import { HttpsError } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../lib/admin.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Enforces (and increments) a per-user daily AI call counter stored on users/{uid}.
 * Throws resource-exhausted if the user is at or over the limit.
 */
export async function checkAndIncrementAiUsage(uid: string, dailyLimit: number): Promise<void> {
  const ref = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() ?? {};
    const resetAt = data.aiCallsResetAt as Timestamp | null | undefined;
    const now = Date.now();

    const isStale = !resetAt || now - resetAt.toMillis() > DAY_MS;
    const currentCount = isStale ? 0 : ((data.aiCallsToday as number) ?? 0);

    if (currentCount >= dailyLimit) {
      throw new HttpsError(
        "resource-exhausted",
        `Daily AI usage limit (${dailyLimit}) reached. Try again tomorrow.`,
      );
    }

    tx.set(
      ref,
      {
        aiCallsToday: currentCount + 1,
        aiCallsResetAt: isStale ? FieldValue.serverTimestamp() : (resetAt ?? FieldValue.serverTimestamp()),
      },
      { merge: true },
    );
  });
}
