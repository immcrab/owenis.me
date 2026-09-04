import {
  Activity,
  FolderKanban,
  Gauge,
  Link2,
  Menu,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { PageTransition } from "@/components/layout/PageTransition";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";

const items: NavItem[] = [
  { to: "/admin", label: "Overview", icon: Gauge, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/subdomains", label: "Subdomain requests", icon: Link2 },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/ai", label: "AI settings", icon: Sparkles },
  { to: "/admin/activity", label: "Activity logs", icon: Activity },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("admin-sidebar-collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapse() {
    setCollapsed((v) => {
      localStorage.setItem("admin-sidebar-collapsed", String(!v));
      return !v;
    });
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-canvas)]">
      <Sidebar
        items={items}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        badge="Admin"
        homeTo="/admin"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-canvas)]/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:block" />
          <UserMenu />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
