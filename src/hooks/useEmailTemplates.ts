import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, firebaseConfigured } from "@/lib/firebase";
import type { EmailTemplateDoc, EmailTemplateType } from "@/lib/types";

export function useEmailTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Partial<Record<EmailTemplateType, EmailTemplateDoc>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = collection(db, "projects", user.uid, "emailTemplates");
    const unsub = onSnapshot(ref, (snap) => {
      const next: Partial<Record<EmailTemplateType, EmailTemplateDoc>> = {};
      for (const d of snap.docs) {
        next[d.id as EmailTemplateType] = { id: d.id, ...d.data() } as EmailTemplateDoc;
      }
      setTemplates(next);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { templates, loading };
}
