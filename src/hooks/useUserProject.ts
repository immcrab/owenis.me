import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, firebaseConfigured } from "@/lib/firebase";
import type { FirebaseProjectDoc } from "@/lib/types";

/** Project docs use the owner's uid as the document ID — one project per user. */
export function useUserProject() {
  const { user } = useAuth();
  const [project, setProject] = useState<FirebaseProjectDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, "projects", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setProject(snap.exists() ? ({ id: snap.id, ...snap.data() } as FirebaseProjectDoc) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { project, loading };
}
