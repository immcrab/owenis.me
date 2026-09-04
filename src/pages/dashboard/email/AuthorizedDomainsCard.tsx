import { LogIn, Lock, Plus, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/context/ToastContext";
import { googleOAuthConfigured, requestIdentityToolkitToken } from "@/lib/googleAuth";
import { getAuthorizedDomains, updateAuthorizedDomains } from "@/lib/identityToolkit";

function isDefaultDomain(domain: string, firebaseProjectId: string) {
  return (
    domain === "localhost" ||
    domain === `${firebaseProjectId}.firebaseapp.com` ||
    domain === `${firebaseProjectId}.web.app`
  );
}

export function AuthorizedDomainsCard({ firebaseProjectId }: { firebaseProjectId: string }) {
  const { push } = useToast();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [domains, setDomains] = useState<string[] | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setError(null);
    setConnecting(true);
    try {
      const token = await requestIdentityToolkitToken();
      setAccessToken(token);
      const current = await getAuthorizedDomains(firebaseProjectId, token);
      setDomains(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect to Google.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleRefresh() {
    if (!accessToken) return;
    setConnecting(true);
    setError(null);
    try {
      setDomains(await getAuthorizedDomains(firebaseProjectId, accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't refresh domains.");
    } finally {
      setConnecting(false);
    }
  }

  async function handleSave(next: string[]) {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAuthorizedDomains(firebaseProjectId, accessToken, next);
      setDomains(updated);
      push({ kind: "success", title: "Authorized domains updated", description: "Live in your Firebase project." });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update authorized domains.");
    } finally {
      setSaving(false);
    }
  }

  function handleAdd() {
    const domain = newDomain.trim().toLowerCase();
    if (!domain || !domains || domains.includes(domain)) return;
    handleSave([...domains, domain]);
    setNewDomain("");
  }

  function handleRemove(domain: string) {
    if (!domains) return;
    handleSave(domains.filter((d) => d !== domain));
  }

  if (!googleOAuthConfigured) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorized domains</CardTitle>
        <CardDescription>
          The domains Firebase Auth will redirect to. This writes directly to your real Firebase
          project via Google's Identity Toolkit API — nothing here is simulated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!domains ? (
          <Button variant="outline" onClick={handleConnect} loading={connecting} icon={<LogIn size={16} />}>
            Connect Google to manage domains
          </Button>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => {
                const protectedDomain = isDefaultDomain(domain, firebaseProjectId);
                return (
                  <Badge key={domain} tone="neutral">
                    {protectedDomain && <Lock size={11} className="text-[var(--color-text-tertiary)]" />}
                    <span className="font-mono">{domain}</span>
                    {!protectedDomain && (
                      <button
                        onClick={() => handleRemove(domain)}
                        disabled={saving}
                        aria-label={`Remove ${domain}`}
                        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)]"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </Badge>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="app.yourdomain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
                className="max-w-xs"
              />
              <Button variant="outline" onClick={handleAdd} loading={saving} icon={<Plus size={16} />}>
                Add
              </Button>
              <Button variant="ghost" onClick={handleRefresh} loading={connecting} icon={<RefreshCw size={16} />} />
            </div>
          </>
        )}
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      </CardContent>
    </Card>
  );
}
