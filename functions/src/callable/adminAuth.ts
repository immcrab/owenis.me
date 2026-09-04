import { HttpsError, onCall } from "firebase-functions/v2/https";
import { auth, db } from "../lib/admin.js";
import { isAllowlistedAdminEmail } from "../lib/params.js";
import { logActivity } from "../utils/activityLog.js";

/** Idempotent: grants the admin custom claim only if the caller's email is on the server allowlist. */
export const bootstrapAdmin = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const email = request.auth.token.email as string | undefined;

  if (!isAllowlistedAdminEmail(email)) {
    // Not an error — this endpoint is called opportunistically by every new signup.
    return { granted: false };
  }

  await auth.setCustomUserClaims(request.auth.uid, { admin: true });
  await db.collection("users").doc(request.auth.uid).set({ isAdmin: true }, { merge: true });
  await logActivity({
    userId: request.auth.uid,
    actorEmail: email ?? null,
    action: "admin_bootstrapped",
  });

  return { granted: true };
});

/** Existing admins can promote another user by email. */
export const setAdminRole = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth?.token.admin) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
  const email = request.data?.email as string | undefined;
  const makeAdmin = Boolean(request.data?.admin);
  if (!email) throw new HttpsError("invalid-argument", "email is required.");

  const targetUser = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(targetUser.uid, { admin: makeAdmin });
  await db.collection("users").doc(targetUser.uid).set({ isAdmin: makeAdmin }, { merge: true });
  await logActivity({
    userId: targetUser.uid,
    actorEmail: request.auth.token.email ?? null,
    action: makeAdmin ? "admin_granted" : "admin_revoked",
    meta: { targetEmail: email },
  });

  return { success: true };
});
