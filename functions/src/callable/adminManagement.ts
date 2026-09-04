import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { auth as adminAuth, db } from "../lib/admin.js";
import { logActivity } from "../utils/activityLog.js";

function requireAdmin(request: { auth?: { uid: string; token: Record<string, unknown> } | null }) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  if (!request.auth.token.admin) throw new HttpsError("permission-denied", "Admin access required.");
  return request.auth;
}

export const setUserDisabled = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAdmin(request);
  const uid = request.data?.uid as string | undefined;
  const disabled = Boolean(request.data?.disabled);
  if (!uid) throw new HttpsError("invalid-argument", "uid is required.");

  const targetUser = await adminAuth.getUser(uid);
  if (targetUser.customClaims?.admin) {
    throw new HttpsError("permission-denied", "Admins cannot disable other admins from here.");
  }

  await adminAuth.updateUser(uid, { disabled });
  await db.collection("users").doc(uid).set({ disabled }, { merge: true });

  await logActivity({
    userId: uid,
    actorEmail: (auth.token.email as string) ?? null,
    action: disabled ? "user_disabled" : "user_enabled",
  });

  return { success: true };
});

export const setProjectPublicListing = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAdmin(request);
  const uid = request.data?.uid as string | undefined;
  const publicListing = Boolean(request.data?.publicListing);
  const publicDescription = (request.data?.publicDescription as string | undefined)?.trim().slice(0, 500) ?? "";
  if (!uid) throw new HttpsError("invalid-argument", "uid is required.");

  const projectRef = db.collection("projects").doc(uid);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) throw new HttpsError("not-found", "Project not found.");
  const project = projectSnap.data()!;

  await projectRef.set(
    { publicListing, publicDescription: publicDescription || null, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );

  const publicRef = db.collection("publicProjects").doc(uid);
  if (publicListing) {
    const approvedRequest = await db
      .collection("subdomainRequests")
      .where("userId", "==", uid)
      .where("status", "==", "approved")
      .limit(1)
      .get();
    const subdomain = approvedRequest.empty ? null : approvedRequest.docs[0]!.data().requestedSubdomain;

    await publicRef.set({
      id: uid,
      displayName: project.displayName,
      subdomain,
      description: publicDescription || "",
      joinedAt: project.createdAt ?? FieldValue.serverTimestamp(),
    });
  } else {
    await publicRef.delete();
  }

  await logActivity({
    userId: uid,
    actorEmail: (auth.token.email as string) ?? null,
    action: publicListing ? "project_listed_publicly" : "project_unlisted",
  });

  return { success: true };
});
