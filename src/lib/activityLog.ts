import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * Best-effort, self-reported activity log (no backend to write it
 * authoritatively). Failures are swallowed — logging should never block the
 * action it's describing.
 */
export async function logActivity(action: string, meta: Record<string, unknown> = {}) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, "activityLogs"), {
      userId: user.uid,
      actorEmail: user.email,
      action,
      meta,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal — admin overview will just show one fewer entry.
  }
}
