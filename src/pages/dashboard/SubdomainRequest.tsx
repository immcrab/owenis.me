import { httpsCallable } from "firebase/functions";
import { Link2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { SubdomainStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { useToast } from "@/context/ToastContext";
import { useSubdomainRequests } from "@/hooks/useSubdomainRequests";
import { useUserProject } from "@/hooks/useUserProject";
import { PLATFORM_DOMAIN } from "@/lib/constants";
import { functions } from "@/lib/firebase";
import { formatDateTime } from "@/lib/utils";
import { subdomainSchema } from "@/lib/validators";

export default function SubdomainRequest() {
  const { requests, loading } = useSubdomainRequests();
  const { project } = useUserProject();
  const { push } = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeRequest = requests.find((r) => r.status === "pending" || r.status === "approved" || r.status === "needs_changes");
  const canRequest = !activeRequest;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = subdomainSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid subdomain");
      return;
    }
    setSubmitting(true);
    try {
      const fn = httpsCallable(functions, "requestSubdomain");
      await fn({ requestedSubdomain: parsed.data });
      push({ kind: "success", title: "Request submitted", description: `${parsed.data}.${PLATFORM_DOMAIN}` });
      setValue("");
    } catch (err) {
      push({ kind: "error", title: "Couldn't submit request", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Subdomain request" description={`Request a free yourname.${PLATFORM_DOMAIN} subdomain.`} />

      {canRequest && (
        <Card>
          <CardHeader>
            <CardTitle>Request a subdomain</CardTitle>
            <CardDescription>Lowercase letters, numbers, and hyphens — 3 to 30 characters.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <Input
                label="Subdomain"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                error={error ?? undefined}
                placeholder="yourname"
                suffix={<span className="text-sm text-[var(--color-text-tertiary)]">.{PLATFORM_DOMAIN}</span>}
              />
              {!project && (
                <p className="mt-2 text-xs text-[var(--color-warning)]">
                  You haven't connected a Firebase project yet — you can still request a subdomain, but connecting
                  a project first helps us review faster.
                </p>
              )}
            </CardContent>
            <CardContent className="border-t border-[var(--color-border-subtle)] pt-5">
              <Button type="submit" loading={submitting} icon={<Link2 size={16} />}>
                Submit request
              </Button>
            </CardContent>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">Request history</h2>
        {requests.length === 0 ? (
          <EmptyState icon={Link2} title="No requests yet" description="Submit your first subdomain request above." />
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono font-medium text-[var(--color-text-primary)]">
                    {request.requestedSubdomain}.{PLATFORM_DOMAIN}
                  </p>
                  <SubdomainStatusBadge status={request.status} />
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Submitted {formatDateTime(request.createdAt?.toDate?.())}
                </p>
                {request.adminMessage && (
                  <div className="flex gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-3">
                    <MessageSquare size={14} className="mt-0.5 shrink-0 text-[var(--color-text-tertiary)]" />
                    <p className="text-sm text-[var(--color-text-secondary)]">{request.adminMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
