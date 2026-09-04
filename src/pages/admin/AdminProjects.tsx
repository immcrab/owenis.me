import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  limit as fbLimit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { Globe, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ProjectStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/context/ToastContext";
import { useAllProjects } from "@/hooks/useAdminData";
import { logActivity } from "@/lib/activityLog";
import { db } from "@/lib/firebase";
import type { FirebaseProjectDoc } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AdminProjects() {
  const { projects, loading } = useAllProjects();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FirebaseProjectDoc | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (p) => p.displayName.toLowerCase().includes(term) || p.firebaseProjectId.toLowerCase().includes(term),
    );
  }, [projects, search]);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description={`${projects.length} connected`} />

      <Input
        placeholder="Search projects…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        suffix={<Search size={16} className="text-[var(--color-text-tertiary)]" />}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No projects found" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <Card key={p.id} className="cursor-pointer transition-colors hover:border-[var(--color-border-strong)]" onClick={() => setSelected(p)}>
              <CardContent>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">{p.displayName}</p>
                    <p className="text-xs font-mono text-[var(--color-text-tertiary)]">{p.firebaseProjectId}</p>
                  </div>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {p.publicListing && <Badge tone="accent" dot>Public</Badge>}
                  <span className="text-xs text-[var(--color-text-tertiary)]">Connected {formatDate(p.createdAt?.toDate?.())}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: FirebaseProjectDoc; onClose: () => void }) {
  const { push } = useToast();
  const [publicListing, setPublicListing] = useState(project.publicListing);
  const [description, setDescription] = useState(project.publicDescription ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const uid = project.ownerId;
      const trimmedDescription = description.trim();

      await setDoc(
        doc(db, "projects", uid),
        { publicListing, publicDescription: trimmedDescription || null, updatedAt: serverTimestamp() },
        { merge: true },
      );

      if (publicListing) {
        const approvedRequest = await getDocs(
          query(
            collection(db, "subdomainRequests"),
            where("userId", "==", uid),
            where("status", "==", "approved"),
            fbLimit(1),
          ),
        );
        const subdomain = approvedRequest.empty ? null : approvedRequest.docs[0]!.data().requestedSubdomain;

        await setDoc(doc(db, "publicProjects", uid), {
          id: uid,
          displayName: project.displayName,
          subdomain,
          description: trimmedDescription,
          joinedAt: project.createdAt ?? serverTimestamp(),
        });
      } else {
        await deleteDoc(doc(db, "publicProjects", uid));
      }

      logActivity(publicListing ? "project_listed_publicly" : "project_unlisted", { uid });
      push({ kind: "success", title: "Listing updated" });
      onClose();
    } catch (err) {
      push({ kind: "error", title: "Couldn't update listing", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={project.displayName} description={project.firebaseProjectId}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">Status</p>
            <div className="mt-1"><ProjectStatusBadge status={project.status} /></div>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">Auth domain</p>
            <p className="mt-1 font-mono text-xs text-[var(--color-text-primary)]">{project.authDomain || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">Action URL</p>
            <p className="mt-1 truncate font-mono text-xs text-[var(--color-text-primary)]">{project.actionUrls?.continueUrl || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-tertiary)]">DNS records</p>
            <p className="mt-1 text-xs text-[var(--color-text-primary)]">
              {project.dnsRecords?.length ?? 0} configured, {project.dnsRecords?.filter((r) => r.verified).length ?? 0} verified
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] p-4">
          <label className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-primary)]">
            <input
              type="checkbox"
              checked={publicListing}
              onChange={(e) => setPublicListing(e.target.checked)}
              className="size-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
            />
            <Globe size={15} /> List in public directory
          </label>
          {publicListing && (
            <Textarea
              className="mt-3"
              label="Public description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short, public-safe description of this project"
              rows={3}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border-subtle)] pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
