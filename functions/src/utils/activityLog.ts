import { FieldValue } from "firebase-admin/firestore";
import { db } from "../lib/admin.js";

export async function logActivity(params: {
  userId: string | null;
  actorEmail: string | null;
  action: string;
  meta?: Record<string, unknown>;
}) {
  await db.collection("activityLogs").add({
    userId: params.userId,
    actorEmail: params.actorEmail,
    action: params.action,
    meta: params.meta ?? {},
    createdAt: FieldValue.serverTimestamp(),
  });
}
