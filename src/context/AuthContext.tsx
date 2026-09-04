import {
  createUserWithEmailAndPassword,
  type User,
  onAuthStateChanged,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, db, firebaseConfigured, functions } from "@/lib/firebase";
import type { UserDoc } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  userDoc: UserDoc | null;
  isAdmin: boolean;
  loading: boolean;
  firebaseConfigured: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthLoading(false);
      setDocLoading(false);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setUserDoc(null);
        setDocLoading(false);
      }
    });

    const unsubToken = onIdTokenChanged(auth, async (u) => {
      if (!u) {
        setIsAdmin(false);
        return;
      }
      const result = await u.getIdTokenResult();
      setIsAdmin(result.claims.admin === true);
    });

    return () => {
      unsubAuth();
      unsubToken();
    };
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    setDocLoading(true);
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setUserDoc(snap.exists() ? (snap.data() as UserDoc) : null);
      setDocLoading(false);
    });
    return () => unsub();
  }, [user]);

  async function signUp(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
      try {
        await httpsCallable(functions, "syncProfile")({ displayName: displayName.trim() });
      } catch {
        // Non-fatal — the Firestore doc will just show a blank name until the
        // user edits it from Account settings.
      }
    }
    await sendEmailVerification(cred.user);
    // Best-effort: claim admin if this email is on the server allowlist.
    // No-op (and silently ignored) for everyone else.
    try {
      const result = await httpsCallable<unknown, { granted: boolean }>(functions, "bootstrapAdmin")();
      if (result.data.granted) {
        // The ID token minted at sign-up predates the custom claim — force a
        // refresh so isAdmin reflects it immediately instead of on next sign-in.
        await cred.user.getIdToken(true);
      }
    } catch {
      // Not on the allowlist, or functions not deployed yet — ignore.
    }
  }

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOutUser() {
    await signOut(auth);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function resendVerification() {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        isAdmin,
        loading: authLoading || (Boolean(user) && docLoading),
        firebaseConfigured,
        signUp,
        signIn,
        signOutUser,
        resetPassword,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
