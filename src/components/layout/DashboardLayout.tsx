import {
  Cloud,
  LayoutDashboard,
  Link2,
  Mail as MailIcon,
  MessageSquareText,
  Settings,
  Sparkles,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { PageTransition } from "@/components/layout/PageTransition";
import { Sidebar, type NavItem } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";

const items: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/connect", label: "Connect Firebase", icon: Cloud },
  { to: "/dashboard/email", label: "Email configuration", icon: MailIcon },
  { to: "/dashboard/subdomain", label: "Subdomain request", icon: Link2 },
  { to: "/dashboard/ai-email", label: "AI email generator", icon: Sparkles },
  { to: "/dashboard/assistant", label: "AI assistant", icon: MessageSquareText },
  { to: "/dashboard/account", label: "Account settings", icon: Settings },
];

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapse() {
    setCollapsed((v) => {
      localStorage.setItem("sidebar-collapsed", String(!v));
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
