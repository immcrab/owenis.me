import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ChevronsLeft, Mail, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  badge?: string;
  homeTo?: string;
}

function SidebarContent({
  items,
  collapsed,
  onToggleCollapse,
  onCloseMobile,
  badge,
  homeTo = "/dashboard",
  isMobile,
}: Omit<SidebarProps, "mobileOpen"> & { isMobile?: boolean }) {
  return (
    <div className="flex h-full flex-col bg-[var(--color-surface)]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border-subtle)] px-4">
        <Link to={homeTo} className="flex items-center gap-2 overflow-hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            <Mail size={16} />
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              owenis.me
              {badge && (
                <span className="ml-1.5 rounded bg-[var(--color-accent-subtle)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                  {badge}
                </span>
              )}
            </span>
          )}
        </Link>
        {isMobile ? (
          <button
            onClick={onCloseMobile}
            className="flex size-8 items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onCloseMobile}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )
            }
          >
            <item.icon size={17} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!isMobile && (
        <div className="border-t border-[var(--color-border-subtle)] p-3">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft size={16} className={cn("transition-transform duration-200", collapsed && "rotate-180")} />
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: props.collapsed ? 72 : 240 }}
        transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
        className="hidden shrink-0 border-r border-[var(--color-border-subtle)] md:block"
      >
        <div className="sticky top-0 h-screen">
          <SidebarContent {...props} />
        </div>
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {props.mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[var(--color-overlay)]"
              onClick={props.onCloseMobile}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-[var(--color-border-subtle)] shadow-2xl"
            >
              <SidebarContent {...props} collapsed={false} isMobile />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
