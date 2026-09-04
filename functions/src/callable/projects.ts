import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../lib/admin.js";
import { logActivity } from "../utils/activityLog.js";
import { connectProjectSchema } from "../utils/validators.js";

function requireAuth(request: { auth?: { uid: string; token: Record<string, unknown> } | null }) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  return request.auth;
}

export const connectProject = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAuth(request);
  const parsed = connectProjectSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const { firebaseProjectId, displayName, webApiKey, authDomain } = parsed.data;

  const ref = db.collection("projects").doc(auth.uid);
  const existing = await ref.get();

  await ref.set(
    {
      id: auth.uid,
      ownerId: auth.uid,
      firebaseProjectId,
      displayName,
      webApiKey: webApiKey || null,
      authDomain: authDomain || null,
      status: "connected",
      publicListing: existing.exists ? (existing.data()?.publicListing ?? false) : false,
      publicDescription: existing.exists ? (existing.data()?.publicDescription ?? null) : null,
      actionUrls: existing.exists ? (existing.data()?.actionUrls ?? { continueUrl: "", customDomain: null }) : { continueUrl: "", customDomain: null },
      dnsRecords: existing.exists ? (existing.data()?.dnsRecords ?? []) : [],
      createdAt: existing.exists ? existing.data()?.createdAt : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await logActivity({
    userId: auth.uid,
    actorEmail: (auth.token.email as string) ?? null,
    action: existing.exists ? "project_updated" : "project_connected",
    meta: { firebaseProjectId },
  });

  return { success: true };
});

export const disconnectProject = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAuth(request);
  const ref = db.collection("projects").doc(auth.uid);

  const templatesSnap = await ref.collection("emailTemplates").get();
  const batch = db.batch();
  templatesSnap.forEach((doc) => batch.delete(doc.ref));
  batch.delete(ref);
  batch.delete(db.collection("publicProjects").doc(auth.uid));
  await batch.commit();

  await logActivity({
    userId: auth.uid,
    actorEmail: (auth.token.email as string) ?? null,
    action: "project_disconnected",
  });

  return { success: true };
});
