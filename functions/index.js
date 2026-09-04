const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const GROQ_API_KEY = defineSecret("GROQ_API_KEY");

// Keep this in sync with the allowlist in firestore.rules.
const ADMIN_EMAILS = ["imcrabfr@gmail.com"];

exports.generateRequestEmail = onCall(
  { secrets: [GROQ_API_KEY] },
  async (request) => {
    const auth = request.auth;
    if (!auth || !auth.token.email_verified || !ADMIN_EMAILS.includes(auth.token.email)) {
      throw new HttpsError("permission-denied", "Not an admin.");
    }

    const { requestId, decision } = request.data || {};
    if (!requestId || !["approve", "deny"].includes(decision)) {
      throw new HttpsError("invalid-argument", "requestId and a decision of approve or deny are required.");
    }

    const ref = db.collection("requests").doc(requestId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "That request no longer exists.");
    }
    const d = snap.data();

    const prompt = decision === "approve"
      ? `Write a short, friendly email telling a developer their custom sender-domain request for Firebase auth emails has been approved and is now live.\nTheir chosen address: ${d.handle}@owenis.me\nTheir Firebase project ID: ${d.projectId}\nTell them to go back to the Firebase console (Authentication > Templates > pencil icon > customize domain) and click "Verify" to finish switching over. Sign off as the Owenis.me team. Keep it under 120 words. Output only the email body, no subject line, no placeholders in brackets.`
      : `Write a short, kind email telling a developer their custom sender-domain request for Firebase auth emails could not be approved as submitted.\nTheir chosen address: ${d.handle}@owenis.me\nTheir Firebase project ID: ${d.projectId}\nAsk them to double check the DNS records they pasted (from Firebase console > Authentication > Templates > customize domain) are complete and try again, or reply with questions. Sign off as the Owenis.me team. Keep it under 120 words. Output only the email body, no subject line, no placeholders in brackets.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY.value()}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You write short, warm, plain-text support emails. No markdown, no placeholders in brackets." },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      console.error("Groq error", res.status, await res.text());
      throw new HttpsError("internal", "The email draft failed to generate. Try again.");
    }

    const json = await res.json();
    const body = json.choices?.[0]?.message?.content?.trim();
    if (!body) {
      throw new HttpsError("internal", "The email draft came back empty. Try again.");
    }

    const subject = decision === "approve"
      ? `${d.handle}@owenis.me is ready to verify`
      : "About your owenis.me request";

    await ref.update({ status: decision === "approve" ? "approved" : "denied" });

    return { subject, body, to: d.contactEmail };
  }
);
