import { Cloud, Link2, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectStatusBadge, SubdomainStatusBadge } from "@/components/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useSubdomainRequests } from "@/hooks/useSubdomainRequests";
import { useUserProject } from "@/hooks/useUserProject";
import { PLATFORM_DOMAIN } from "@/lib/constants";

export default function Dashboard() {
  const { userDoc, user } = useAuth();
  const { project, loading: projectLoading } = useUserProject();
  const { requests, loading: requestsLoading } = useSubdomainRequests();

  const latestRequest = requests[0];
  const name = userDoc?.displayName || user?.displayName || user?.email?.split("@")[0];

  if (projectLoading || requestsLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome back${name ? `, ${name}` : ""}`} description="Here's the current state of your setup." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Firebase project</p>
              <div className="mt-2">
                {project ? <ProjectStatusBadge status={project.status} /> : <span className="text-sm text-[var(--color-text-tertiary)]">Not connected</span>}
              </div>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              <Cloud size={16} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Subdomain</p>
              <div className="mt-2">
                {latestRequest ? <SubdomainStatusBadge status={latestRequest.status} /> : <span className="text-sm text-[var(--color-text-tertiary)]">Not requested</span>}
              </div>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              <Link2 size={16} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Email verification</p>
              <div className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                {user?.emailVerified ? "Verified" : "Not verified"}
              </div>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              <Mail size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      {!project ? (
        <EmptyState
          icon={Cloud}
          title="Connect your Firebase project"
          description="Link your project to start configuring email templates, action URLs, and DNS."
          action={
            <Link to="/dashboard/connect" className={buttonVariants("primary", "md")}>
              Connect Firebase
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">{project.displayName}</p>
              <p className="text-sm text-[var(--color-text-tertiary)]">{project.firebaseProjectId}</p>
            </div>
            <Link to="/dashboard/email" className={buttonVariants("secondary", "sm")}>
              Configure email
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">AI email generator</p>
                <p className="text-sm text-[var(--color-text-tertiary)]">Draft an email in seconds</p>
              </div>
            </div>
            <Link to="/dashboard/ai-email">
              <Button variant="outline" size="sm" className="mt-4 w-full">Generate an email</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                <Link2 size={16} />
              </div>
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {latestRequest ? "Your subdomain" : "Request a subdomain"}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {latestRequest ? `${latestRequest.requestedSubdomain}.${PLATFORM_DOMAIN}` : "Get yourname.owenis.me"}
                </p>
              </div>
            </div>
            <Link to="/dashboard/subdomain">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                {latestRequest ? "View status" : "Request now"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
