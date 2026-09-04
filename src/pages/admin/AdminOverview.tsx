import { Activity, CheckCircle2, Clock, FolderKanban, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useActivityLogs, useAllProjects, useAllSubdomainRequests, useAllUsers } from "@/hooks/useAdminData";
import { relativeTime } from "@/lib/utils";

export default function AdminOverview() {
  const { users, loading: usersLoading } = useAllUsers();
  const { projects, loading: projectsLoading } = useAllProjects();
  const { requests, loading: requestsLoading } = useAllSubdomainRequests();
  const { logs, loading: logsLoading } = useActivityLogs();

  if (usersLoading || projectsLoading || requestsLoading) return <PageSpinner />;

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" description="Platform-wide stats and recent activity." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={users.length} icon={Users} />
        <StatCard label="Connected projects" value={projects.length} icon={FolderKanban} />
        <StatCard label="Subdomain requests" value={requests.length} icon={Clock} trend={`${pending} pending`} trendTone={pending > 0 ? "up" : "neutral"} />
        <StatCard label="Approved subdomains" value={approved} icon={CheckCircle2} />
      </div>

      <Card>
        <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] p-5">
          <Activity size={16} className="text-[var(--color-text-tertiary)]" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Recent activity</h2>
          <Link to="/admin/activity" className="ml-auto text-xs text-[var(--color-accent)] hover:underline">
            View all
          </Link>
        </div>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="p-5"><PageSpinner /></div>
          ) : logs.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" />
          ) : (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {logs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[var(--color-text-primary)]">{log.action}</p>
                    <p className="truncate text-xs text-[var(--color-text-tertiary)]">{log.actorEmail ?? "system"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-text-tertiary)]">
                    {relativeTime(log.createdAt?.toDate?.())}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
