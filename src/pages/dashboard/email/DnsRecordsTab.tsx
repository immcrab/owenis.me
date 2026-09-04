import { httpsCallable } from "firebase/functions";
import { CheckCircle2, Clock, Globe, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { functions } from "@/lib/firebase";
import type { DnsRecord, FirebaseProjectDoc } from "@/lib/types";

export function DnsRecordsTab({ project }: { project: FirebaseProjectDoc | null }) {
  const { push } = useToast();
  const [domain, setDomain] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setRequesting(true);
    try {
      const fn = httpsCallable(functions, "requestDomainVerification");
      await fn({ domain: domain.trim() });
      push({ kind: "success", title: "Verification record generated", description: "Add the TXT record below, then verify." });
      setDomain("");
    } catch (err) {
      push({ kind: "error", title: "Couldn't generate record", description: err instanceof Error ? err.message : undefined });
    } finally {
      setRequesting(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    try {
      const fn = httpsCallable<unknown, { verified: boolean }>(functions, "verifyDns");
      const result = await fn();
      push({
        kind: result.data.verified ? "success" : "info",
        title: result.data.verified ? "Domain verified" : "Not verified yet",
        description: result.data.verified
          ? "DNS ownership confirmed."
          : "The TXT record wasn't found yet. DNS changes can take up to 48 hours.",
      });
    } catch (err) {
      push({ kind: "error", title: "Verification failed", description: err instanceof Error ? err.message : undefined });
    } finally {
      setVerifying(false);
    }
  }

  if (!project) {
    return (
      <EmptyState icon={Globe} title="Connect a project first" description="You need a connected Firebase project before configuring a custom email domain." />
    );
  }

  const records = project.dnsRecords ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom email domain</CardTitle>
          <CardDescription>
            Verify a domain you own to enable custom email sending. DNS changes can take a few minutes
            to 48 hours to propagate.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRequest}>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Domain"
                placeholder="mail.example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <Button type="submit" loading={requesting}>
              Generate record
            </Button>
          </CardContent>
        </form>
      </Card>

      {records.length === 0 ? (
        <EmptyState icon={Globe} title="No domain records yet" description="Enter a domain above to generate a verification record." />
      ) : (
        <Card>
          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] p-5">
            <div>
              <CardTitle>DNS records</CardTitle>
              <CardDescription className="mt-1">Add these at your DNS provider.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleVerify} loading={verifying} icon={<RefreshCw size={14} />}>
              Verify now
            </Button>
          </div>
          <CardContent className="space-y-3 p-0">
            {records.map((record, i) => (
              <DnsRecordRow key={i} record={record} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DnsRecordRow({ record }: { record: DnsRecord }) {
  return (
    <div className="grid grid-cols-1 gap-3 border-b border-[var(--color-border-subtle)] p-5 last:border-0 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center">
      <span className="inline-flex w-fit items-center rounded-md bg-[var(--color-surface-hover)] px-2 py-1 text-xs font-mono font-medium text-[var(--color-text-secondary)]">
        {record.type}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-[var(--color-text-tertiary)]">Host</p>
        <p className="truncate font-mono text-sm text-[var(--color-text-primary)]">{record.host}</p>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--color-text-tertiary)]">Value</p>
          <p className="truncate font-mono text-sm text-[var(--color-text-primary)]">{record.value}</p>
        </div>
        <CopyButton value={record.value} />
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        {record.verified ? (
          <span className="flex items-center gap-1 text-[var(--color-success)]">
            <CheckCircle2 size={14} /> Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[var(--color-warning)]">
            <Clock size={14} /> Pending
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)] sm:col-span-4">{record.purpose}</p>
    </div>
  );
}
