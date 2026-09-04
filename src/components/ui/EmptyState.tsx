import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-surface-hover)]">
        <Icon size={20} className="text-[var(--color-text-tertiary)]" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        {description && (
          <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
