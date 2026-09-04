import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, firebaseConfigured } from "@/lib/firebase";
import type { SubdomainRequestDoc } from "@/lib/types";

export function useSubdomainRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SubdomainRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "subdomainRequests"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SubdomainRequestDoc));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { requests, loading };
}
