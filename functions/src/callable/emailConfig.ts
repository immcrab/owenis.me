import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../lib/admin.js";
import { logActivity } from "../utils/activityLog.js";
import { generateVerificationToken, verifyTxtRecord } from "../utils/dns.js";
import { actionUrlsSchema, domainSchema, emailTemplateSchema } from "../utils/validators.js";

function requireAuth(request: { auth?: { uid: string; token: Record<string, unknown> } | null }) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  return request.auth;
}

async function requireProject(uid: string) {
  const ref = db.collection("projects").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("failed-precondition", "Connect a Firebase project first.");
  return ref;
}

export const updateActionUrls = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAuth(request);
  const parsed = actionUrlsSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const ref = await requireProject(auth.uid);

  await ref.set(
    {
      actionUrls: {
        continueUrl: parsed.data.continueUrl,
        customDomain: parsed.data.customDomain || null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await logActivity({ userId: auth.uid, actorEmail: (auth.token.email as string) ?? null, action: "action_urls_updated" });
  return { success: true };
});

export const saveEmailTemplate = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAuth(request);
  const parsed = emailTemplateSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  await requireProject(auth.uid);
  const { templateType, ...fields } = parsed.data;

  await db
    .collection("projects")
    .doc(auth.uid)
    .collection("emailTemplates")
    .doc(templateType)
    .set(
      {
        id: templateType,
        projectId: auth.uid,
        ...fields,
        replyTo: fields.replyTo || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  await logActivity({
    userId: auth.uid,
    actorEmail: (auth.token.email as string) ?? null,
    action: "email_template_saved",
    meta: { templateType },
  });
  return { success: true };
});

export const requestDomainVerification = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAuth(request);
  const domainInput = (request.data?.domain as string | undefined)?.trim().toLowerCase();
  const parsed = domainSchema.safeParse(domainInput);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Enter a valid domain, e.g. mail.example.com");
  }
  const ref = await requireProject(auth.uid);
  const domain = parsed.data;
  const token = generateVerificationToken();

  const record = {
    type: "TXT" as const,
    host: domain,
    value: token,
    purpose: "Proves you control this domain before custom email sending is enabled.",
    verified: false,
  };

  await ref.set(
    {
      dnsRecords: [record],
      emailDomain: domain,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await logActivity({
    userId: auth.uid,
    actorEmail: (auth.token.email as string) ?? null,
    action: "domain_verification_requested",
    meta: { domain },
  });

  return { success: true };
});

export const verifyDns = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAuth(request);
  const ref = await requireProject(auth.uid);
  const snap = await ref.get();
  const data = snap.data();
  const records: { type: string; host: string; value: string; purpose: string; verified: boolean }[] =
    data?.dnsRecords ?? [];

  if (records.length === 0) {
    throw new HttpsError("failed-precondition", "No domain has been submitted for verification yet.");
  }

  const record = records[0]!;
  const verified = await verifyTxtRecord(record.host, record.value);

  const updatedRecords = records.map((r, i) => (i === 0 ? { ...r, verified } : r));
  await ref.set({ dnsRecords: updatedRecords, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  await logActivity({
    userId: auth.uid,
    actorEmail: (auth.token.email as string) ?? null,
    action: "dns_verification_checked",
    meta: { host: record.host, verified },
  });

  return { verified };
});
