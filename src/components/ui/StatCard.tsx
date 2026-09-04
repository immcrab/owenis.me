import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendTone?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, icon: Icon, trend, trendTone = "neutral" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-border-strong)]">
      <div className="flex items-start justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-surface-hover)]">
          <Icon size={16} className="text-[var(--color-text-tertiary)]" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">{value}</p>
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs",
            trendTone === "up" && "text-[var(--color-success)]",
            trendTone === "down" && "text-[var(--color-danger)]",
            trendTone === "neutral" && "text-[var(--color-text-tertiary)]",
          )}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
