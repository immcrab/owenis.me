import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Settings, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { initials } from "@/lib/utils";

export function UserMenu() {
  const { user, userDoc, isAdmin, signOutUser } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  async function handleSignOut() {
    try {
      await signOutUser();
      push({ kind: "success", title: "Signed out" });
      navigate("/");
    } catch {
      push({ kind: "error", title: "Couldn't sign out", description: "Please try again." });
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-sm font-semibold text-[var(--color-accent)] transition-transform active:scale-95"
      >
        {initials(userDoc?.displayName ?? user.displayName, user.email ?? "")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] p-1.5 shadow-xl shadow-black/30"
          >
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {userDoc?.displayName || user.displayName || "Account"}
              </p>
              <p className="truncate text-xs text-[var(--color-text-tertiary)]">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-[var(--color-border-subtle)]" />
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            >
              <LayoutDashboard size={15} /> Dashboard
            </Link>
            <Link
              to="/dashboard/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            >
              <Settings size={15} /> Account settings
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              >
                <Shield size={15} /> Admin dashboard
              </Link>
            )}
            <div className="my-1 h-px bg-[var(--color-border-subtle)]" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]"
            >
              <LogOut size={15} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
