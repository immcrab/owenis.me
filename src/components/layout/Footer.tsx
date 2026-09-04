import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-subtle)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
          <span className="flex size-7 items-center justify-center rounded-md bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            <Mail size={14} />
          </span>
          owenis.me
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-text-secondary)]">
          <Link to="/features" className="hover:text-[var(--color-text-primary)]">Features</Link>
          <Link to="/how-it-works" className="hover:text-[var(--color-text-primary)]">How it works</Link>
          <Link to="/projects" className="hover:text-[var(--color-text-primary)]">Public projects</Link>
          <Link to="/docs" className="hover:text-[var(--color-text-primary)]">Docs</Link>
        </nav>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          © {new Date().getFullYear()} owenis.me
        </p>
      </div>
    </footer>
  );
}
