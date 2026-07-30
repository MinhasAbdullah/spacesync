'use client';

/* =====================================================
   Sidebar — shared navigation for all admin pages.
   Shows SpaceSync logo, nav links, and current user.
   On mobile it collapses to a slide-out drawer.
   ===================================================== */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  BarChart2,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* Navigation items — label, href, icon */
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Resources', href: '/resources', icon: Layers },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },

];

interface SidebarProps {
  /** When true, sidebar renders in collapsed (icon-only) mode on desktop */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  /* Mobile drawer open state */
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Shared inner content — reused by both desktop sidebar and mobile drawer */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* ---- Logo + collapse toggle ---- */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[--ss-border]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {/* Brand icon with cyan glow */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--ss-cyan-dim)', border: '1px solid var(--ss-cyan)' }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--ss-cyan)' }} />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--ss-text-primary)' }}>
              Space<span style={{ color: 'var(--ss-cyan)' }}>Sync</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center"
            style={{ background: 'var(--ss-cyan-dim)', border: '1px solid var(--ss-cyan)' }}>
            <Zap className="w-4 h-4" style={{ color: 'var(--ss-cyan)' }} />
          </div>
        )}
        {/* Desktop collapse button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-md transition-colors"
          style={{ color: 'var(--ss-text-muted)' }}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* ---- Navigation links ---- */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          /* Highlight the active page */
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active ? 'ss-nav-active' : 'ss-nav-hover',
                collapsed && 'justify-center px-2',
              )}
              style={{
                color: active ? 'var(--ss-cyan)' : 'var(--ss-text-secondary)',
              }}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ---- User profile + logout ---- */}
      <div className="px-3 pb-4 border-t border-[--ss-border] pt-4">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2">
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--ss-cyan)', color: 'var(--ss-bg-base)' }}>
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--ss-text-primary)' }}>
                Super Admin
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--ss-text-muted)' }}>
                admin@spacesync.io
              </p>
            </div>
            <button
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--ss-text-muted)' }}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--ss-cyan)', color: 'var(--ss-bg-base)' }}>
              SA
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ---- Mobile hamburger button (top-left, visible only on small screens) ---- */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg"
        style={{ background: 'var(--ss-bg-elevated)', border: '1px solid var(--ss-border)' }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" style={{ color: 'var(--ss-text-primary)' }} />
      </button>

      {/* ---- Mobile overlay backdrop ---- */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ---- Mobile slide-out drawer ---- */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: 'var(--ss-bg-surface)', borderRight: '1px solid var(--ss-border)' }}
      >
        {/* Close button inside drawer */}
        <button
          className="absolute top-4 right-4 p-1.5 rounded-md"
          style={{ color: 'var(--ss-text-muted)' }}
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* ---- Desktop sidebar (always visible, collapses to icon strip) ---- */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed top-0 left-0 h-full transition-all duration-300 z-30',
          collapsed ? 'w-16' : 'w-60',
        )}
        style={{ background: 'var(--ss-bg-surface)', borderRight: '1px solid var(--ss-border)' }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}