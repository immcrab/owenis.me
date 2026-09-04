import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, firebaseConfigured } from "@/lib/firebase";
import type { Timestamp } from "firebase/firestore";

export interface AiEmailDraft {
  id: string;
  subject: string;
  bodyText: string;
  emailType: string;
  tone: string;
  createdAt: Timestamp;
}

export function useAiEmailDrafts() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<AiEmailDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "users", user.uid, "aiEmailDrafts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDrafts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AiEmailDraft));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { drafts, loading };
}
