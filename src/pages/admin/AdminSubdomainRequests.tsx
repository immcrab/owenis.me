import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Check, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SubdomainStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useAllSubdomainRequests } from "@/hooks/useAdminData";
import { logActivity } from "@/lib/activityLog";
import { PLATFORM_DOMAIN } from "@/lib/constants";
import { db } from "@/lib/firebase";
import type { SubdomainRequestDoc, SubdomainStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const STATUS_FILTERS: (SubdomainStatus | "all")[] = ["all", "pending", "approved", "denied", "needs_changes"];

export default function AdminSubdomainRequests() {
  const { requests, loading } = useAllSubdomainRequests();
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubdomainStatus | "all">("all");
  const [selected, setSelected] = useState<SubdomainRequestDoc | null>(null);

  const filtered = useMemo(() => {
    let list = requests;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    const term = search.trim().toLowerCase();
    if (term) list = list.filter((r) => r.requestedSubdomain.toLowerCase().includes(term));
    return list;
  }, [requests, statusFilter, search]);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Subdomain requests" description={`${requests.length} total`} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search subdomain…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          suffix={<Search size={16} className="text-[var(--color-text-tertiary)]" />}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SubdomainStatus | "all")} className="sm:max-w-[200px]">
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s.replace("_", " ")}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No requests found" />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="cursor-pointer transition-colors hover:border-[var(--color-border-strong)]" onClick={() => setSelected(r)}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono font-medium text-[var(--color-text-primary)]">
                    {r.requestedSubdomain}.{PLATFORM_DOMAIN}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">Submitted {formatDateTime(r.createdAt?.toDate?.())}</p>
                </div>
                <SubdomainStatusBadge status={r.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <ReviewModal request={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); push({ kind: "success", title: "Request updated" }); }} />
      )}
    </div>
  );
}

function ReviewModal({
  request,
  onClose,
  onDone,
}: {
  request: SubdomainRequestDoc;
  onClose: () => void;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const { push } = useToast();
  const [subdomain, setSubdomain] = useState(request.requestedSubdomain);
  const [message, setMessage] = useState(request.adminMessage ?? "");
  const [submitting, setSubmitting] = useState<SubdomainStatus | null>(null);

  async function review(status: SubdomainStatus) {
    setSubmitting(status);
    try {
      await updateDoc(doc(db, "subdomainRequests", request.id), {
        status,
        adminMessage: message.trim() || null,
        requestedSubdomain: subdomain,
        reviewedBy: user?.uid ?? null,
        updatedAt: serverTimestamp(),
      });
      logActivity("subdomain_request_reviewed", { requestId: request.id, status });
      onDone();
    } catch (err) {
      push({ kind: "error", title: "Couldn't update request", description: err instanceof Error ? err.message : undefined });
      setSubmitting(null);
    }
  }

  return (
    <Modal open onClose={onClose} title="Review request" size="lg">
      <div className="space-y-4">
        <Input
          label="Requested subdomain"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
          suffix={<span className="text-sm text-[var(--color-text-tertiary)]">.{PLATFORM_DOMAIN}</span>}
        />
        <Textarea
          label="Admin message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional note visible to the requester"
          rows={3}
        />
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Submitted by user {request.userId} on {formatDateTime(request.createdAt?.toDate?.())}
        </p>
        <div className="flex flex-wrap gap-3 border-t border-[var(--color-border-subtle)] pt-4">
          <Button variant="primary" loading={submitting === "approved"} onClick={() => review("approved")} icon={<Check size={16} />}>
            Approve
          </Button>
          <Button variant="outline" loading={submitting === "needs_changes"} onClick={() => review("needs_changes")}>
            Needs changes
          </Button>
          <Button variant="danger" loading={submitting === "denied"} onClick={() => review("denied")} icon={<X size={16} />}>
            Deny
          </Button>
        </div>
      </div>
    </Modal>
  );
}
