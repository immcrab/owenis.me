import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../lib/admin.js";
import { logActivity } from "../utils/activityLog.js";
import { aiSettingsSchema } from "../utils/validators.js";

export const updateAiSettings = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");
  if (!request.auth.token.admin) throw new HttpsError("permission-denied", "Admin access required.");

  const parsed = aiSettingsSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", parsed.error.issues[0]?.message ?? "Invalid settings.");
  }

  await db
    .collection("aiSettings")
    .doc("config")
    .set(
      { provider: "groq", ...parsed.data, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

  await logActivity({
    userId: request.auth.uid,
    actorEmail: (request.auth.token.email as string) ?? null,
    action: "ai_settings_updated",
  });

  return { success: true };
});
