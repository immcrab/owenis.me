// Deploy:
//   npm install -g wrangler
//   wrangler login
//   wrangler secret put GROQ_API_KEY      (paste the key when prompted — never committed here)
//   wrangler deploy
//
// This holds the Groq key server-side. The browser never sees it.
// Security is the Firebase ID token check below, not the request's origin.

const ADMIN_EMAILS = ["imcrabfr@gmail.com"];
const ALLOWED_ORIGIN = "https://owenis.me";
// Firebase web API keys are meant to be public — this is the same one in index.html.
const FIREBASE_WEB_API_KEY = "AIzaSyCDKOIPUhbB5ezjjv2oeDwHYba1kxPVljE";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    if (request.method !== "POST") return cors(json({ error: "Method not allowed" }, 405));

    let payload;
    try {
      payload = await request.json();
    } catch {
      return cors(json({ error: "Bad request" }, 400));
    }

    const { idToken, decision, handle, projectId, contactEmail } = payload || {};
    if (!idToken || !["approve", "deny"].includes(decision) || !handle || !projectId || !contactEmail) {
      return cors(json({ error: "Missing fields" }, 400));
    }

    // Confirm the caller is a signed-in, verified admin — this is the real gate.
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!lookupRes.ok) return cors(json({ error: "Not signed in" }, 401));
    const lookupData = await lookupRes.json();
    const account = lookupData.users?.[0];
    if (!account || !account.emailVerified || !ADMIN_EMAILS.includes(account.email)) {
      return cors(json({ error: "Not an admin" }, 403));
    }

    const prompt = decision === "approve"
      ? `Write a short, friendly email telling a developer their custom sender-domain request for Firebase auth emails has been approved and is now live.\nTheir chosen address: ${handle}@owenis.me\nTheir Firebase project ID: ${projectId}\nTell them to go back to the Firebase console (Authentication > Templates > pencil icon > customize domain) and click "Verify" to finish switching over. Sign off as the Owenis.me team. Keep it under 120 words. Output only the email body, no subject line, no placeholders in brackets.`
      : `Write a short, kind email telling a developer their custom sender-domain request for Firebase auth emails could not be approved as submitted.\nTheir chosen address: ${handle}@owenis.me\nTheir Firebase project ID: ${projectId}\nAsk them to double check the DNS records they pasted (from Firebase console > Authentication > Templates > customize domain) are complete and try again, or reply with questions. Sign off as the Owenis.me team. Keep it under 120 words. Output only the email body, no subject line, no placeholders in brackets.`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
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

    if (!groqRes.ok) {
      console.log("Groq error", groqRes.status, await groqRes.text());
      return cors(json({ error: "Draft failed" }, 502));
    }

    const groqJson = await groqRes.json();
    const body = groqJson.choices?.[0]?.message?.content?.trim();
    if (!body) return cors(json({ error: "Empty draft" }, 502));

    const subject = decision === "approve"
      ? `${handle}@owenis.me is ready to verify`
      : "About your owenis.me request";

    return cors(json({ subject, body, to: contactEmail }));
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}

function cors(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(res.body, { status: res.status, headers });
}
