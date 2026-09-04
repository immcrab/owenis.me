import { Mail } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-semibold text-[var(--color-text-primary)]">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            <Mail size={16} />
          </span>
          owenis.me
        </Link>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl shadow-black/10 sm:p-8">
          <h1 className="font-serif text-3xl italic text-[var(--color-text-primary)]">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">{footer}</div>}
      </div>
    </div>
  );
}
