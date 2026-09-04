import {
  createUserWithEmailAndPassword,
  deleteUser,
  type User,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { logActivity } from "@/lib/activityLog";
import { auth, db, firebaseConfigured } from "@/lib/firebase";
import { ADMIN_EMAIL } from "@/lib/constants";
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
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(true);
  const [disabledNotice, setDisabledNotice] = useState(false);

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

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || !user) return;
    setDocLoading(true);
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? (snap.data() as UserDoc) : null;
      setUserDoc(data);
      setDocLoading(false);

      // Admin "disable" is enforced at the app level (Firestore rules block
      // this user's writes once disabled:true, and we sign them out here) —
      // there's no Cloud Functions backend to do a real Firebase Auth
      // account suspension without a paid Blaze plan.
      if (data?.disabled) {
        setDisabledNotice(true);
        signOut(auth);
      }
    });
    return () => unsub();
  }, [user]);

  // isAdmin here is a UI convenience only. The real security boundary is
  // Firestore rules checking request.auth.token server-side — this client
  // value can never grant access to anything by itself. It mirrors the
  // rules' email_verified requirement too, so an admin who hasn't verified
  // yet gets routed to a clear message instead of a silently-broken panel
  // (every read/write would be denied server-side regardless).
  const isAdmin = Boolean(user?.email && user.email === ADMIN_EMAIL && user.emailVerified);

  async function signUp(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const trimmedName = displayName.trim();
    if (trimmedName) {
      await updateProfile(cred.user, { displayName: trimmedName });
    }
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: trimmedName || null,
      createdAt: serverTimestamp(),
      disabled: false,
      isAdmin: email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
      aiCallsToday: 0,
      aiCallsResetAt: null,
    });
    await sendEmailVerification(cred.user);
    logActivity("user_created");
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

  async function deleteAccount(password: string) {
    if (!auth.currentUser?.email) throw new Error("Not signed in.");
    // Deleting your own Firebase Auth account requires a recent sign-in;
    // reauthenticate first so this works without a backend.
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await deleteUser(auth.currentUser);
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
        deleteAccount,
      }}
    >
      {children}
      {disabledNotice && (
        <div className="fixed inset-x-0 bottom-0 z-100 border-t border-[var(--color-danger-subtle)] bg-[var(--color-elevated)] px-4 py-3 text-center text-sm text-[var(--color-danger)]">
          Your account has been disabled. Contact support if you think this is a mistake.
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
