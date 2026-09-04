import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, firebaseConfigured } from "@/lib/firebase";
import type {
  ActivityLogDoc,
  AiSettingsDoc,
  FirebaseProjectDoc,
  SubdomainRequestDoc,
  UserDoc,
} from "@/lib/types";

function useAdminCollection<T>(path: string, orderField: string, max = 200) {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured || !isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, path), orderBy(orderField, "desc"), limit(max));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, path, orderField, max]);

  return { data, loading };
}

export function useAllUsers() {
  const { data, loading } = useAdminCollection<UserDoc>("users", "createdAt");
  return { users: data, loading };
}

export function useAllSubdomainRequests() {
  const { data, loading } = useAdminCollection<SubdomainRequestDoc>("subdomainRequests", "createdAt");
  return { requests: data, loading };
}

export function useAllProjects() {
  const { data, loading } = useAdminCollection<FirebaseProjectDoc>("projects", "createdAt");
  return { projects: data, loading };
}

export function useActivityLogs() {
  const { data, loading } = useAdminCollection<ActivityLogDoc>("activityLogs", "createdAt", 100);
  return { logs: data, loading };
}

export function useAiSettings() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<AiSettingsDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured || !isAdmin) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "aiSettings", "config"),
      (snap) => {
        setSettings(snap.exists() ? (snap.data() as AiSettingsDoc) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [isAdmin]);

  return { settings, loading };
}
