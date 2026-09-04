import { updateProfile as updateAuthProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
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
import { db, functions } from "@/lib/firebase";

export default function AccountSettings() {
  const { user, userDoc, resendVerification, resetPassword, signOutUser } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(userDoc?.displayName ?? user?.displayName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  async function handleDelete() {
    setDeleting(true);
    try {
      const fn = httpsCallable(functions, "deleteMyAccount");
      await fn();
      await signOutUser();
      navigate("/");
    } catch (err) {
      push({ kind: "error", title: "Couldn't delete account", description: err instanceof Error ? err.message : undefined });
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
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)] p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
          <p className="text-sm text-[var(--color-text-primary)]">This action cannot be undone.</p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete my account
          </Button>
        </div>
      </Modal>
    </div>
  );
}
