import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Info, KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { logActivity } from "@/lib/activityLog";
import { ACTION_URL_HELP } from "@/lib/constants";
import { db } from "@/lib/firebase";
import type { FirebaseProjectDoc } from "@/lib/types";
import { actionUrlsSchema } from "@/lib/validators";
import { AuthorizedDomainsCard } from "@/pages/dashboard/email/AuthorizedDomainsCard";

export function ActionUrlsTab({ project }: { project: FirebaseProjectDoc | null }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [continueUrl, setContinueUrl] = useState(project?.actionUrls?.continueUrl ?? "");
  const [customDomain, setCustomDomain] = useState(project?.actionUrls?.customDomain ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!project) {
    return (
      <EmptyState icon={KeyRound} title="Connect a project first" description="Action URLs are configured per Firebase project." />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = actionUrlsSchema.safeParse({ continueUrl, customDomain });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "projects", user.uid),
        {
          actionUrls: {
            continueUrl: parsed.data.continueUrl,
            customDomain: parsed.data.customDomain || null,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      logActivity("action_urls_updated");
      push({ kind: "success", title: "Action URLs saved" });
    } catch (err) {
      push({ kind: "error", title: "Couldn't save", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-[var(--color-info-subtle)] bg-[var(--color-info-subtle)]">
        <CardContent className="flex gap-3">
          <Info size={18} className="mt-0.5 shrink-0 text-[var(--color-info)]" />
          <p className="text-sm text-[var(--color-text-primary)]">{ACTION_URL_HELP}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authentication action URLs</CardTitle>
          <CardDescription>Used by Firebase Auth for verify-email, password-reset, and email-change links.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              label="Continue URL"
              placeholder="https://yourapp.com/auth/action"
              value={continueUrl}
              onChange={(e) => setContinueUrl(e.target.value)}
              error={errors.continueUrl}
              hint="Where Firebase redirects users after completing an email action."
              required
            />
            <Input
              label="Custom action-handler domain"
              placeholder="auth.yourapp.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              error={errors.customDomain}
              hint="Optional — must also be added as an authorized domain in your Firebase console."
            />
          </CardContent>
          <CardContent className="border-t border-[var(--color-border-subtle)] pt-5">
            <Button type="submit" loading={saving}>
              Save action URLs
            </Button>
          </CardContent>
        </form>
      </Card>

      <AuthorizedDomainsCard firebaseProjectId={project.firebaseProjectId} />
    </div>
  );
}
