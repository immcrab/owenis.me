import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { ExternalLink, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { db, firebaseConfigured } from "@/lib/firebase";
import type { PublicProjectDoc } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { PLATFORM_DOMAIN } from "@/lib/constants";

export default function PublicProjects() {
  const [projects, setProjects] = useState<PublicProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const q = query(collection(db, "publicProjects"), orderBy("joinedAt", "desc"));
        const snap = await getDocs(q);
        setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PublicProjectDoc));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (p) =>
        p.displayName.toLowerCase().includes(term) ||
        p.subdomain?.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term),
    );
  }, [projects, search]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-serif text-4xl italic leading-tight text-[var(--color-text-primary)] sm:text-5xl">
          Public projects
        </h1>
        <p className="mt-4 text-[var(--color-text-secondary)]">
          Projects that have opted in to being listed publicly. Only names, subdomains, and
          descriptions the owner chose to share are shown here.
        </p>
      </div>

      <div className="mt-8 max-w-sm">
        <Input
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={undefined}
          suffix={<Search size={16} className="text-[var(--color-text-tertiary)]" />}
        />
      </div>

      <div className="mt-8">
        {!firebaseConfigured ? (
          <EmptyState
            icon={Sparkles}
            title="Firebase not configured"
            description="Set VITE_FIREBASE_* environment variables to load the public directory."
          />
        ) : loading ? (
          <PageSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title={projects.length === 0 ? "No public projects yet" : "No matches"}
            description={
              projects.length === 0
                ? "Approved projects that opt in to public listing will appear here."
                : "Try a different search term."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-strong)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{project.displayName}</h3>
                  {project.subdomain && (
                    <a
                      href={`https://${project.subdomain}.${PLATFORM_DOMAIN}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
                    >
                      {project.subdomain}.{PLATFORM_DOMAIN} <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{project.description}</p>
                <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
                  Joined {formatDate(project.joinedAt?.toDate?.())}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
