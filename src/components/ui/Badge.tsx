import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  success: "bg-[var(--color-success-subtle)] text-[var(--color-success)] border-transparent",
  warning: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border-transparent",
  danger: "bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border-transparent",
  info: "bg-[var(--color-info-subtle)] text-[var(--color-info)] border-transparent",
  accent: "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-transparent",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-[var(--color-text-tertiary)]",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  danger: "bg-[var(--color-danger)]",
  info: "bg-[var(--color-info)]",
  accent: "bg-[var(--color-accent)]",
};

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotClasses[tone])} />}
      {children}
    </span>
  );
}
