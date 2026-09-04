import { AnimatePresence, motion } from "framer-motion";
import { Mail, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { buttonVariants } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

const links = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/projects", label: "Public projects" },
  { to: "/docs", label: "Docs" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-subtle)] bg-[var(--color-canvas)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            <Mail size={16} />
          </span>
          owenis.me
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Link to="/dashboard" className={buttonVariants("secondary", "sm")}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/sign-in" className={buttonVariants("ghost", "sm")}>
                Sign in
              </Link>
              <Link to="/sign-up" className={buttonVariants("primary", "sm")}>
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="flex size-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-[var(--color-border-subtle)] md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-[var(--color-border-subtle)] pt-3">
                {user ? (
                  <Link to="/dashboard" onClick={() => setOpen(false)} className={buttonVariants("secondary", "md", "w-full")}>
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/sign-in" onClick={() => setOpen(false)} className={buttonVariants("outline", "md", "w-full")}>
                      Sign in
                    </Link>
                    <Link to="/sign-up" onClick={() => setOpen(false)} className={buttonVariants("primary", "md", "w-full")}>
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
