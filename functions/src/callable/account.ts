import { HttpsError, onCall } from "firebase-functions/v2/https";
import { auth as adminAuth, db } from "../lib/admin.js";
import { logActivity } from "../utils/activityLog.js";

/**
 * The users/{uid} doc is created by the onUserCreate auth trigger, which fires
 * at account-creation time — before the client's follow-up updateProfile() call
 * has set a display name. This callable lets the client push the display name
 * into Firestore right after it sets one, using the Admin SDK so it works
 * whether or not the trigger's doc write has landed yet (no create/update race).
 */
export const syncProfile = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  const displayName = (request.data?.displayName as string | undefined)?.trim().slice(0, 120) ?? "";

  await db.collection("users").doc(request.auth.uid).set({ displayName: displayName || null }, { merge: true });

  return { success: true };
});

export const deleteMyAccount = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  const { uid, token } = request.auth;

  const batch = db.batch();

  const projectRef = db.collection("projects").doc(uid);
  const templatesSnap = await projectRef.collection("emailTemplates").get();
  templatesSnap.forEach((doc) => batch.delete(doc.ref));
  batch.delete(projectRef);
  batch.delete(db.collection("publicProjects").doc(uid));

  const draftsSnap = await db.collection("users").doc(uid).collection("aiEmailDrafts").get();
  draftsSnap.forEach((doc) => batch.delete(doc.ref));

  const requestsSnap = await db.collection("subdomainRequests").where("userId", "==", uid).get();
  requestsSnap.forEach((doc) => batch.delete(doc.ref));

  batch.delete(db.collection("users").doc(uid));

  await batch.commit();
  await logActivity({ userId: null, actorEmail: (token.email as string) ?? null, action: "account_deleted", meta: { uid } });
  await adminAuth.deleteUser(uid);

  return { success: true };
});
