import { httpsCallable } from "firebase/functions";
import { Save, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/context/ToastContext";
import { useAiEmailDrafts } from "@/hooks/useAiEmailDrafts";
import { functions } from "@/lib/firebase";
import { formatDateTime } from "@/lib/utils";

const EMAIL_TYPES = ["Welcome", "Announcement", "Newsletter", "Follow-up", "Apology / Incident", "Promotional"];
const TONES = ["Professional", "Friendly", "Casual", "Formal", "Enthusiastic", "Empathetic"];

interface GenerateResult {
  subject: string;
  bodyText: string;
}

export default function AiEmailGenerator() {
  const { push } = useToast();
  const { drafts } = useAiEmailDrafts();

  const [emailType, setEmailType] = useState(EMAIL_TYPES[0]!);
  const [tone, setTone] = useState(TONES[0]!);
  const [purpose, setPurpose] = useState("");
  const [brandName, setBrandName] = useState("");
  const [mainMessage, setMainMessage] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");

  const [result, setResult] = useState<GenerateResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!purpose.trim() || !mainMessage.trim()) {
      setError("Purpose and main message are required.");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const fn = httpsCallable<unknown, GenerateResult>(functions, "generateEmailWithAi");
      const res = await fn({ emailType, tone, purpose, brandName, mainMessage, extraInstructions });
      setResult(res.data);
    } catch (err) {
      push({ kind: "error", title: "Generation failed", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const fn = httpsCallable(functions, "saveAiEmailDraft");
      await fn({ ...result, emailType, tone });
      push({ kind: "success", title: "Draft saved" });
    } catch (err) {
      push({ kind: "error", title: "Couldn't save draft", description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="AI email generator" description="Describe what you need — Groq drafts it, you edit and save." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>The more specific, the better the draft.</CardDescription>
          </CardHeader>
          <form onSubmit={handleGenerate}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select label="Email type" value={emailType} onChange={(e) => setEmailType(e.target.value)}>
                  {EMAIL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <Select label="Tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <Input label="Brand name" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Acme Inc." />
              <Input
                label="Purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Announce a new feature to existing users"
                required
              />
              <Textarea
                label="Main message"
                value={mainMessage}
                onChange={(e) => setMainMessage(e.target.value)}
                placeholder="What's the core thing you want to say?"
                rows={4}
                required
              />
              <Textarea
                label="Extra instructions (optional)"
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="Keep it under 150 words, include a CTA button…"
                rows={2}
              />
              {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
            </CardContent>
            <CardContent className="border-t border-[var(--color-border-subtle)] pt-5">
              <Button type="submit" loading={generating} icon={<Sparkles size={16} />}>
                Generate email
              </Button>
            </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Draft</CardTitle>
            <CardDescription>Edit freely before saving.</CardDescription>
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="flex flex-col gap-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                <div className="h-24 w-full animate-pulse rounded bg-[var(--color-surface-hover)]" />
              </div>
            ) : !result ? (
              <EmptyState icon={Sparkles} title="Nothing generated yet" description="Fill in the details and generate a draft." />
            ) : (
              <div className="space-y-4">
                <Input label="Subject" value={result.subject} onChange={(e) => setResult({ ...result, subject: e.target.value })} />
                <Textarea
                  label="Body"
                  value={result.bodyText}
                  onChange={(e) => setResult({ ...result, bodyText: e.target.value })}
                  rows={10}
                />
                <Button variant="secondary" onClick={handleSave} loading={saving} icon={<Save size={16} />}>
                  Save draft
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {drafts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">Saved drafts</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {drafts.map((draft) => (
              <Card key={draft.id}>
                <CardContent>
                  <p className="font-medium text-[var(--color-text-primary)]">{draft.subject}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">{draft.bodyText}</p>
                  <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                    {draft.emailType} · {draft.tone} · {formatDateTime(draft.createdAt?.toDate?.())}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
