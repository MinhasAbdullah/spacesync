"use client";

import {
  BarChart2,
  CalendarDays,
  ChevronLeft,
  LayoutDashboard,
  Layers,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAppContext } from "@/components/app-context";
import { cn } from "@/lib/utils";

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { isAdmin, organization } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Find & book", href: "/search", icon: Search },
    { label: "Resources", href: "/resources", icon: Layers },
    { label: "Bookings", href: "/bookings", icon: CalendarDays },
    ...(isAdmin
      ? [
          { label: "Analytics", href: "/analytics", icon: BarChart2 },
          { label: "Team & access", href: "/team", icon: ShieldCheck },
        ]
      : []),
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  function sidebarContent(isCollapsed: boolean, mobile = false) {
    return (
      <div className="flex h-full flex-col">
        <div
          className="flex min-h-[72px] items-center justify-between border-b px-4"
          style={{ borderColor: "var(--ss-border)" }}
        >
          <Link
            href="/dashboard"
            className={cn("flex min-w-0 items-center gap-2", isCollapsed && "mx-auto")}
            onClick={() => mobile && setMobileOpen(false)}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--ss-cyan-dim)", border: "1px solid var(--ss-cyan)" }}
            >
              <Zap className="h-4 w-4" style={{ color: "var(--ss-cyan)" }} />
            </div>
            {!isCollapsed ? (
              <span className="truncate font-bold">
                Space<span style={{ color: "var(--ss-cyan)" }}>Sync</span>
              </span>
            ) : null}
          </Link>

          {!mobile ? (
            <button
              onClick={onToggleCollapse}
              className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md transition hover:bg-white/5 md:flex"
              aria-label="Toggle sidebar"
            >
              <ChevronLeft
                className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")}
              />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => mobile && setMobileOpen(false)}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "ss-nav-active" : "ss-nav-hover",
                  isCollapsed && "justify-center px-2",
                )}
                style={{
                  color: active ? "var(--ss-cyan)" : "var(--ss-text-secondary)",
                }}
                title={isCollapsed ? label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed ? <span className="truncate">{label}</span> : null}
              </Link>
            );
          })}
        </nav>

        {!isCollapsed ? (
          <div className="border-t p-3" style={{ borderColor: "var(--ss-border)" }}>
            <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,.025)" }}>
              <p className="truncate text-xs font-medium">{organization.name}</p>
              <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--ss-text-muted)" }}>
                /{organization.slug}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-lg p-2 md:hidden"
        style={{ background: "var(--ss-bg-elevated)", border: "1px solid var(--ss-border)" }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <button
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu overlay"
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-[min(18rem,86vw)] transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "var(--ss-bg-surface)", borderRight: "1px solid var(--ss-border)" }}
      >
        <button
          className="absolute right-4 top-5 z-10 rounded-md p-1.5 hover:bg-white/5"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent(false, true)}
      </aside>

      <aside
        className={cn(
          "fixed left-0 top-0 z-30 hidden h-full flex-col transition-all duration-300 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
        style={{ background: "var(--ss-bg-surface)", borderRight: "1px solid var(--ss-border)" }}
      >
        {sidebarContent(collapsed)}
      </aside>
    </>
  );
}
