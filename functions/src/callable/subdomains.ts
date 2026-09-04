import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../lib/admin.js";
import { logActivity } from "../utils/activityLog.js";
import { subdomainSchema } from "../utils/validators.js";

function requireAuth(request: { auth?: { uid: string; token: Record<string, unknown> } | null }) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  return request.auth;
}

function requireAdmin(request: { auth?: { uid: string; token: Record<string, unknown> } | null }) {
  const auth = requireAuth(request);
  if (!auth.token.admin) throw new HttpsError("permission-denied", "Admin access required.");
  return auth;
}

const ACTIVE_STATUSES = ["pending", "approved", "needs_changes"];

export const requestSubdomain = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAuth(request);
  const parsed = subdomainSchema.safeParse(request.data?.requestedSubdomain);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid subdomain format.");
  }
  const requestedSubdomain = parsed.data;

  const existingForUser = await db
    .collection("subdomainRequests")
    .where("userId", "==", auth.uid)
    .where("status", "in", ACTIVE_STATUSES)
    .limit(1)
    .get();
  if (!existingForUser.empty) {
    throw new HttpsError("already-exists", "You already have an active subdomain request.");
  }

  const taken = await db
    .collection("subdomainRequests")
    .where("requestedSubdomain", "==", requestedSubdomain)
    .where("status", "in", ["pending", "approved"])
    .limit(1)
    .get();
  if (!taken.empty) {
    throw new HttpsError("already-exists", "This subdomain is already requested or taken.");
  }

  const projectSnap = await db.collection("projects").doc(auth.uid).get();

  const ref = db.collection("subdomainRequests").doc();
  await ref.set({
    id: ref.id,
    userId: auth.uid,
    projectId: projectSnap.exists ? auth.uid : null,
    requestedSubdomain,
    status: "pending",
    adminMessage: null,
    dnsRecords: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    reviewedBy: null,
  });

  await logActivity({
    userId: auth.uid,
    actorEmail: (auth.token.email as string) ?? null,
    action: "subdomain_requested",
    meta: { requestedSubdomain },
  });

  return { success: true, id: ref.id };
});

export const reviewSubdomainRequest = onCall({ region: "us-central1" }, async (request) => {
  const auth = requireAdmin(request);
  const { requestId, status, adminMessage, requestedSubdomain } = request.data ?? {};

  if (typeof requestId !== "string") throw new HttpsError("invalid-argument", "requestId is required.");
  if (!["pending", "approved", "denied", "needs_changes"].includes(status)) {
    throw new HttpsError("invalid-argument", "Invalid status.");
  }

  const ref = db.collection("subdomainRequests").doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Request not found.");

  const update: Record<string, unknown> = {
    status,
    adminMessage: adminMessage ?? null,
    reviewedBy: auth.uid,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (typeof requestedSubdomain === "string" && requestedSubdomain.trim()) {
    const parsed = subdomainSchema.safeParse(requestedSubdomain);
    if (!parsed.success) throw new HttpsError("invalid-argument", "Invalid replacement subdomain.");
    update.requestedSubdomain = parsed.data;
  }

  await ref.update(update);

  await logActivity({
    userId: snap.data()?.userId ?? null,
    actorEmail: (auth.token.email as string) ?? null,
    action: "subdomain_request_reviewed",
    meta: { requestId, status },
  });

  return { success: true };
});
