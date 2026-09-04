import { Globe, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { ActionUrlsTab } from "@/pages/dashboard/email/ActionUrlsTab";
import { DnsRecordsTab } from "@/pages/dashboard/email/DnsRecordsTab";
import { EmailTemplatesTab } from "@/pages/dashboard/email/EmailTemplatesTab";
import { useUserProject } from "@/hooks/useUserProject";

type Tab = "templates" | "action-urls" | "dns";

export default function EmailConfig() {
  const [tab, setTab] = useState<Tab>("templates");
  const { project, loading } = useUserProject();

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Email configuration" description="Templates, action URLs, and DNS for your Firebase Auth emails." />

      <Tabs
        tabs={[
          { value: "templates", label: "Templates", icon: <Mail size={14} /> },
          { value: "action-urls", label: "Action URLs", icon: <KeyRound size={14} /> },
          { value: "dns", label: "Custom domain / DNS", icon: <Globe size={14} /> },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />

      {tab === "templates" && <EmailTemplatesTab project={project} />}
      {tab === "action-urls" && <ActionUrlsTab project={project} />}
      {tab === "dns" && <DnsRecordsTab project={project} />}
    </div>
  );
}
