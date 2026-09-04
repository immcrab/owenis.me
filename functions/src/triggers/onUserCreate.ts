import { FieldValue } from "firebase-admin/firestore";
import * as functionsV1 from "firebase-functions/v1";
import { auth, db } from "../lib/admin.js";
import { isAllowlistedAdminEmail } from "../lib/params.js";
import { logActivity } from "../utils/activityLog.js";

export const onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
    const shouldBeAdmin = isAllowlistedAdminEmail(user.email);

    await db
      .collection("users")
      .doc(user.uid)
      .set(
        {
          uid: user.uid,
          email: user.email ?? "",
          displayName: user.displayName ?? null,
          createdAt: FieldValue.serverTimestamp(),
          disabled: false,
          isAdmin: shouldBeAdmin,
          aiCallsToday: 0,
          aiCallsResetAt: null,
        },
        { merge: true },
      );

    if (shouldBeAdmin) {
      await auth.setCustomUserClaims(user.uid, { admin: true });
    }

    await logActivity({
      userId: user.uid,
      actorEmail: user.email ?? null,
      action: "user_created",
      meta: { admin: shouldBeAdmin },
    });
  });
