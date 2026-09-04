import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Eye, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { logActivity } from "@/lib/activityLog";
import { EMAIL_TEMPLATE_HELP, TEMPLATE_VARIABLES } from "@/lib/constants";
import { db } from "@/lib/firebase";
import { EMAIL_TEMPLATE_LABELS, type EmailTemplateType, type FirebaseProjectDoc } from "@/lib/types";
import { emailTemplateSchema } from "@/lib/validators";

const TEMPLATE_TYPES = Object.keys(EMAIL_TEMPLATE_LABELS) as EmailTemplateType[];

const DEFAULTS: Record<EmailTemplateType, { subject: string; bodyHtml: string }> = {
  verify_email: {
    subject: "Verify your email for %APP_NAME%",
    bodyHtml: "<p>Hi %DISPLAY_NAME%,</p><p>Please verify your email by clicking the link below.</p><p><a href=\"%LINK%\">Verify email</a></p>",
  },
  password_reset: {
    subject: "Reset your password for %APP_NAME%",
    bodyHtml: "<p>Hi %DISPLAY_NAME%,</p><p>We received a request to reset your password.</p><p><a href=\"%LINK%\">Reset password</a></p>",
  },
  email_address_change: {
    subject: "Your email for %APP_NAME% was changed",
    bodyHtml: "<p>Hi %DISPLAY_NAME%,</p><p>Your account email was recently changed to %EMAIL%. If this wasn't you, secure your account immediately.</p>",
  },
  sms_verification: {
    subject: "Your verification code",
    bodyHtml: "<p>Hi %DISPLAY_NAME%,</p><p>Use this link to verify: <a href=\"%LINK%\">%LINK%</a></p>",
  },
};

export function EmailTemplatesTab({ project }: { project: FirebaseProjectDoc | null }) {
  const { user } = useAuth();
  const { push } = useToast();
  const { templates, loading } = useEmailTemplates();
  const [activeType, setActiveType] = useState<EmailTemplateType>("verify_email");
  const [subject, setSubject] = useState("");
  const [senderName, setSenderName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const existing = templates[activeType];
    const fallback = DEFAULTS[activeType];
    setSubject(existing?.subject ?? fallback.subject);
    setSenderName(existing?.senderName ?? (project?.displayName || ""));
    setReplyTo(existing?.replyTo ?? "");
    setBodyHtml(existing?.bodyHtml ?? fallback.bodyHtml);
    setErrors({});
  }, [activeType, templates, project?.displayName]);

  if (!project) {
    return <EmptyState icon={Mail} title="Connect a project first" description="Templates are configured per Firebase project." />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = emailTemplateSchema.safeParse({ subject, senderName, replyTo, bodyHtml });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "projects", user.uid, "emailTemplates", activeType),
        {
          id: activeType,
          projectId: user.uid,
          ...parsed.data,
          replyTo: parsed.data.replyTo || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      logActivity("email_template_saved", { templateType: activeType });
      push({ kind: "success", title: "Template saved", description: EMAIL_TEMPLATE_LABELS[activeType] });
    } catch (err) {
      push({ kind: "error", title: "Couldn't save template", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  const appName = project.displayName || "Your App";
  function substituteVariables(text: string) {
    return text
      .replaceAll("%DISPLAY_NAME%", "Jane Doe")
      .replaceAll("%EMAIL%", "jane@example.com")
      .replaceAll("%APP_NAME%", appName)
      .replaceAll("%LINK%", "#");
  }

  const previewHtml = substituteVariables(bodyHtml);
  const previewSubject = substituteVariables(subject);

  return (
    <div className="space-y-6">
      <Tabs
        tabs={TEMPLATE_TYPES.map((t) => ({ value: t, label: EMAIL_TEMPLATE_LABELS[t] }))}
        value={activeType}
        onChange={(v) => setActiveType(v as EmailTemplateType)}
        className="w-full flex-wrap"
      />
      <p className="text-sm text-[var(--color-text-secondary)]">{EMAIL_TEMPLATE_HELP[activeType]}</p>

      {loading ? null : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
              <CardDescription>Available variables: {TEMPLATE_VARIABLES.map((v) => v.token).join(", ")}</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} required />
                <Input label="Sender name" value={senderName} onChange={(e) => setSenderName(e.target.value)} error={errors.senderName} required />
                <Input
                  label="Reply-to (optional)"
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  error={errors.replyTo}
                />
                <Textarea
                  label="Body (HTML)"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  error={errors.bodyHtml}
                  rows={10}
                  className="font-mono text-xs"
                  required
                />
              </CardContent>
              <CardContent className="border-t border-[var(--color-border-subtle)] pt-5">
                <Button type="submit" loading={saving}>
                  Save template
                </Button>
              </CardContent>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye size={16} /> Live preview
              </CardTitle>
              <CardDescription>Sample data substituted for variables.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-[var(--color-border)] bg-white p-4 text-black">
                <p className="mb-3 border-b border-black/10 pb-2 text-xs text-black/50">
                  From: {senderName || "Sender"} {replyTo && `<${replyTo}>`}
                  <br />
                  Subject: {previewSubject || "(no subject)"}
                </p>
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
