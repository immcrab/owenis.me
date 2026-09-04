import { Badge } from "@/components/ui/Badge";
import type { ProjectStatus, SubdomainStatus } from "@/lib/types";

const subdomainConfig: Record<SubdomainStatus, { label: string; tone: "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  denied: { label: "Denied", tone: "danger" },
  needs_changes: { label: "Needs changes", tone: "info" },
};

const projectConfig: Record<ProjectStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  connected: { label: "Connected", tone: "success" },
  pending_setup: { label: "Setup incomplete", tone: "warning" },
  needs_attention: { label: "Needs attention", tone: "danger" },
};

export function SubdomainStatusBadge({ status }: { status: SubdomainStatus }) {
  const config = subdomainConfig[status];
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = projectConfig[status];
  return (
    <Badge tone={config.tone} dot>
      {config.label}
    </Badge>
  );
}
