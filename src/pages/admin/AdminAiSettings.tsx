import { httpsCallable } from "firebase/functions";
import { AlertCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/context/ToastContext";
import { useActivityLogs, useAiSettings } from "@/hooks/useAdminData";
import { functions } from "@/lib/firebase";
import { GROQ_MODELS, type GroqModelId } from "@/lib/types";
import { relativeTime } from "@/lib/utils";

interface AiSettingsForm {
  model: GroqModelId;
  assistantModel: GroqModelId;
  systemPromptEmail: string;
  systemPromptAssistant: string;
  maxTokensPerRequest: number;
  dailyCallLimitPerUser: number;
  enabled: boolean;
}

const DEFAULTS: AiSettingsForm = {
  model: GROQ_MODELS[0].id,
  assistantModel: GROQ_MODELS[2].id,
  systemPromptEmail: "You are an assistant that drafts professional marketing and transactional emails.",
  systemPromptAssistant: "You are the help assistant for owenis.me. Only answer using the public documentation you're given. Never reveal user data.",
  maxTokensPerRequest: 800,
  dailyCallLimitPerUser: 30,
  enabled: true,
};

export default function AdminAiSettings() {
  const { settings, loading } = useAiSettings();
  const { logs, loading: logsLoading } = useActivityLogs();
  const { push } = useToast();

  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        model: settings.model as GroqModelId,
        assistantModel: settings.assistantModel as GroqModelId,
        systemPromptEmail: settings.systemPromptEmail,
        systemPromptAssistant: settings.systemPromptAssistant,
        maxTokensPerRequest: settings.maxTokensPerRequest,
        dailyCallLimitPerUser: settings.dailyCallLimitPerUser,
        enabled: settings.enabled,
      });
    }
  }, [settings]);

  if (loading) return <PageSpinner />;

  const aiErrors = logs.filter((l) => l.action === "ai_error").slice(0, 10);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fn = httpsCallable(functions, "updateAiSettings");
      await fn(form);
      push({ kind: "success", title: "AI settings saved" });
    } catch (err) {
      push({ kind: "error", title: "Couldn't save settings", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="AI settings" description="Configure the Groq models and behavior used across the platform." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles size={16} /> Models & limits</CardTitle>
          <CardDescription>Changes apply to new requests immediately.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-primary)]">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                className="size-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
              />
              AI features enabled
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Email generator model"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value as GroqModelId }))}
              >
                {GROQ_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </Select>
              <Select
                label="Assistant model"
                value={form.assistantModel}
                onChange={(e) => setForm((f) => ({ ...f, assistantModel: e.target.value as GroqModelId }))}
              >
                {GROQ_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Max tokens per request"
                type="number"
                min={100}
                max={4000}
                value={form.maxTokensPerRequest}
                onChange={(e) => setForm((f) => ({ ...f, maxTokensPerRequest: Number(e.target.value) }))}
              />
              <Input
                label="Daily call limit per user"
                type="number"
                min={1}
                max={1000}
                value={form.dailyCallLimitPerUser}
                onChange={(e) => setForm((f) => ({ ...f, dailyCallLimitPerUser: Number(e.target.value) }))}
              />
            </div>

            <Textarea
              label="System instructions — email generator"
              value={form.systemPromptEmail}
              onChange={(e) => setForm((f) => ({ ...f, systemPromptEmail: e.target.value }))}
              rows={3}
            />
            <Textarea
              label="System instructions — AI assistant"
              value={form.systemPromptAssistant}
              onChange={(e) => setForm((f) => ({ ...f, systemPromptAssistant: e.target.value }))}
              rows={3}
              hint="The privacy rule (never reveal user data) is always enforced server-side, regardless of this prompt."
            />
          </CardContent>
          <CardContent className="border-t border-[var(--color-border-subtle)] pt-5">
            <Button type="submit" loading={saving}>Save settings</Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertCircle size={16} /> Recent AI errors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? null : aiErrors.length === 0 ? (
            <EmptyState icon={AlertCircle} title="No AI errors logged" />
          ) : (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {aiErrors.map((log) => (
                <div key={log.id} className="px-5 py-3">
                  <p className="text-sm text-[var(--color-text-primary)]">{String(log.meta?.message ?? "Unknown error")}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                    {log.actorEmail ?? "unknown"} · {relativeTime(log.createdAt?.toDate?.())}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
