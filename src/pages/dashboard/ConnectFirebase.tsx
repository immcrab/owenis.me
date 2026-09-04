import { httpsCallable } from "firebase/functions";
import { AlertTriangle, Cloud, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { ProjectStatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/context/ToastContext";
import { useUserProject } from "@/hooks/useUserProject";
import { functions } from "@/lib/firebase";
import { connectProjectSchema } from "@/lib/validators";

export default function ConnectFirebase() {
  const { project, loading } = useUserProject();
  const { push } = useToast();

  const [firebaseProjectId, setFirebaseProjectId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [webApiKey, setWebApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (project) {
      setFirebaseProjectId(project.firebaseProjectId);
      setDisplayName(project.displayName);
      setWebApiKey(project.webApiKey ?? "");
      setAuthDomain(project.authDomain ?? "");
    }
  }, [project]);

  if (loading) return <PageSpinner />;

  function resetFormFromProject() {
    setFirebaseProjectId(project?.firebaseProjectId ?? "");
    setDisplayName(project?.displayName ?? "");
    setWebApiKey(project?.webApiKey ?? "");
    setAuthDomain(project?.authDomain ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = connectProjectSchema.safeParse({
      firebaseProjectId,
      displayName,
      webApiKey,
      authDomain,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const fn = httpsCallable(functions, "connectProject");
      await fn(parsed.data);
      push({
        kind: "success",
        title: project ? "Project updated" : "Project connected",
        description: parsed.data.displayName,
      });
    } catch (err) {
      push({
        kind: "error",
        title: "Couldn't save project",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const fn = httpsCallable(functions, "disconnectProject");
      await fn();
      push({ kind: "success", title: "Project disconnected" });
      setConfirmDisconnect(false);
      setFirebaseProjectId("");
      setDisplayName("");
      setWebApiKey("");
      setAuthDomain("");
    } catch (err) {
      push({
        kind: "error",
        title: "Couldn't disconnect",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Connect Firebase"
        description="Link your Firebase project to configure email settings and request a subdomain."
        action={project && <ProjectStatusBadge status={project.status} />}
      />

      <Card className="border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)]">
        <CardContent className="flex gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-primary)]">
            We only ask for your Project ID and public web config — the same values already visible
            in your app's client code. We never ask for a service-account private key or any Admin SDK
            credential.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>Found in Firebase console → Project settings → General.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              label="Firebase Project ID"
              placeholder="my-app-a1b2c"
              value={firebaseProjectId}
              onChange={(e) => setFirebaseProjectId(e.target.value)}
              error={errors.firebaseProjectId}
              hint="Lowercase letters, numbers, and hyphens only."
              required
            />
            <Input
              label="Display name"
              placeholder="My App"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={errors.displayName}
              required
            />
            <Input
              label="Web API Key"
              placeholder="AIza…"
              value={webApiKey}
              onChange={(e) => setWebApiKey(e.target.value)}
              error={errors.webApiKey}
              hint="Optional — public key from your firebaseConfig, safe to share."
            />
            <Input
              label="Auth domain"
              placeholder="my-app-a1b2c.firebaseapp.com"
              value={authDomain}
              onChange={(e) => setAuthDomain(e.target.value)}
              error={errors.authDomain}
              hint="Optional — used to prefill your action URL settings."
            />
          </CardContent>
          <CardContent className="flex flex-wrap gap-3 border-t border-[var(--color-border-subtle)] pt-5">
            <Button type="submit" loading={submitting} icon={<Cloud size={16} />}>
              {project ? "Save changes" : "Connect project"}
            </Button>
            {project && (
              <>
                <Button type="button" variant="outline" onClick={resetFormFromProject}>
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="ml-auto text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]"
                  onClick={() => setConfirmDisconnect(true)}
                  icon={<Trash2 size={16} />}
                >
                  Disconnect
                </Button>
              </>
            )}
          </CardContent>
        </form>
      </Card>

      <Modal
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        title="Disconnect this project?"
        description="Your email templates and action URL settings will be removed. This can't be undone."
      >
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)] p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
          <p className="text-sm text-[var(--color-text-primary)]">
            This does not affect your actual Firebase project — only the configuration stored here.
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDisconnect(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={disconnecting} onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </Modal>
    </div>
  );
}
