import { updateProfile as updateAuthProfile } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { AlertTriangle, CheckCircle2, Mail, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { db } from "@/lib/firebase";

export default function AccountSettings() {
  const { user, userDoc, resendVerification, resetPassword, deleteAccount } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(userDoc?.displayName ?? user?.displayName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateAuthProfile(user!, { displayName: displayName.trim() });
      await updateDoc(doc(db, "users", user!.uid), { displayName: displayName.trim() });
      push({ kind: "success", title: "Profile updated" });
    } catch (err) {
      push({ kind: "error", title: "Couldn't update profile", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleResendVerification() {
    setSendingVerify(true);
    try {
      await resendVerification();
      push({ kind: "success", title: "Verification email sent" });
    } catch (err) {
      push({ kind: "error", title: "Couldn't send email", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSendingVerify(false);
    }
  }

  async function handlePasswordReset() {
    if (!user!.email) return;
    setSendingReset(true);
    try {
      await resetPassword(user!.email);
      push({ kind: "success", title: "Reset email sent", description: user!.email });
    } catch (err) {
      push({ kind: "error", title: "Couldn't send email", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSendingReset(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    setDeleting(true);
    try {
      const uid = user!.uid;

      const templatesSnap = await getDocs(collection(db, "projects", uid, "emailTemplates"));
      const draftsSnap = await getDocs(collection(db, "users", uid, "aiEmailDrafts"));
      const requestsSnap = await getDocs(query(collection(db, "subdomainRequests"), where("userId", "==", uid)));

      const batch = writeBatch(db);
      templatesSnap.forEach((d) => batch.delete(d.ref));
      draftsSnap.forEach((d) => batch.delete(d.ref));
      requestsSnap.forEach((d) => batch.delete(d.ref));
      batch.delete(doc(db, "projects", uid));
      batch.delete(doc(db, "publicProjects", uid));
      batch.delete(doc(db, "users", uid));
      await batch.commit().catch(() => {
        // Some of these docs may not exist or may already be gone — fall
        // through to per-doc deletes so one missing doc doesn't block the rest.
      });

      // Belt-and-suspenders: retry any stragglers individually, ignoring
      // "not found"-style failures.
      await Promise.allSettled([
        deleteDoc(doc(db, "projects", uid)),
        deleteDoc(doc(db, "publicProjects", uid)),
      ]);

      // This reauthenticates (password) and deletes the Firebase Auth
      // account itself — self-service, no Admin SDK needed.
      await deleteAccount(deletePassword);
      navigate("/");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Account settings" description="Manage your profile and account security." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-4">
            <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <Input label="Email" value={user.email ?? ""} disabled hint="Email cannot be changed here." />
          </CardContent>
          <CardContent className="border-t border-[var(--color-border-subtle)] pt-5">
            <Button type="submit" loading={savingProfile}>
              Save changes
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] p-4">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-[var(--color-text-tertiary)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Email verification</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {user.emailVerified ? "Your email is verified." : "Your email is not verified yet."}
                </p>
              </div>
            </div>
            {user.emailVerified ? (
              <CheckCircle2 size={18} className="text-[var(--color-success)]" />
            ) : (
              <Button variant="outline" size="sm" onClick={handleResendVerification} loading={sendingVerify}>
                Resend
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] p-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Password</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">We'll email you a secure link to set a new one.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handlePasswordReset} loading={sendingReset}>
              Change password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--color-danger-subtle)]">
        <CardHeader>
          <CardTitle className="text-[var(--color-danger)]">Danger zone</CardTitle>
          <CardDescription>Permanently delete your account, connected project, and stored configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={16} />}>
            Delete account
          </Button>
        </CardContent>
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        description="This permanently removes your account, connected project, templates, and subdomain requests."
      >
        <form onSubmit={handleDelete} className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)] p-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
            <p className="text-sm text-[var(--color-text-primary)]">This action cannot be undone.</p>
          </div>
          <Input
            label="Confirm your password"
            type="password"
            required
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            error={deleteError ?? undefined}
            hint="Deleting your own account requires re-entering your password."
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={deleting}>
              Delete my account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
