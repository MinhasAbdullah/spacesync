'use client';

/* =====================================================
   Header — shared top bar for all admin pages.
   Contains page title, search, notifications, theme.
   ===================================================== */

import { useState } from 'react';
import { Search, Bell, ChevronDown, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 py-4 border-b backdrop-blur-md"
      style={{
        background: 'rgba(13, 21, 38, 0.8)',
        borderColor: 'var(--ss-border)',
      }}
    >
      {/* ---- Left: page title ---- */}
      <div className="flex-1 min-w-0 pl-12 md:pl-0">
        <h1 className="text-lg md:text-xl font-bold truncate" style={{ color: 'var(--ss-text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs md:text-sm mt-0.5 truncate" style={{ color: 'var(--ss-text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* ---- Right: search + actions ---- */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search input — hidden on very small screens */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--ss-text-muted)' }} />
          
        </div>

        {/* Notifications with dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(s => !s)}
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: 'var(--ss-text-secondary)' }}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Unread indicator dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: 'var(--ss-danger)' }} />
          </button>

          {/* Dropdown panel */}
          {showNotif && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
              <div
                className="absolute right-0 mt-2 w-72 rounded-lg shadow-2xl z-40 animate-fade-up"
                style={{ background: 'var(--ss-bg-elevated)', border: '1px solid var(--ss-border)' }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--ss-border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--ss-text-primary)' }}>
                    Notifications
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {[
                    { t: 'New booking request', d: '2 minutes ago', c: 'var(--ss-cyan)' },
                    { t: 'Resource conflict detected', d: '12 minutes ago', c: 'var(--ss-danger)' },
                    { t: 'Lab B maintenance scheduled', d: '1 hour ago', c: 'var(--ss-warning)' },
                  ].map((n, i) => (
                    <div key={i} className="px-4 py-3 border-b last:border-0 hover:bg-white/5 transition-colors"
                         style={{ borderColor: 'var(--ss-border-subtle)' }}>
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.c }} />
                        <div>
                          <p className="text-sm" style={{ color: 'var(--ss-text-primary)' }}>{n.t}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--ss-text-muted)' }}>{n.d}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User profile menu trigger */}
        <button
          className="flex items-center gap-2 p-1 pr-2 rounded-lg transition-colors hover:bg-white/5"
          aria-label="User menu"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
               style={{ background: 'var(--ss-cyan)', color: 'var(--ss-bg-base)' }}>
            SA
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-tight" style={{ color: 'var(--ss-text-primary)' }}>
              Super Admin
            </p>
            <p className="text-xs leading-tight" style={{ color: 'var(--ss-text-muted)' }}>
              Administrator
            </p>
          </div>
          <ChevronDown className="w-4 h-4 hidden sm:block" style={{ color: 'var(--ss-text-muted)' }} />
        </button>
      </div>
    </header>
  );
}
