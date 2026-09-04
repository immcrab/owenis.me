import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "@/lib/utils";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
      aria-label={label}
      type="button"
    >
      {copied ? (
        <>
          <Check size={12} className="text-[var(--color-success)]" /> Copied
        </>
      ) : (
        <>
          <Copy size={12} /> {label}
        </>
      )}
    </button>
  );
}
