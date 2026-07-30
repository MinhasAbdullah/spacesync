'use client';

/* =====================================================
   AppShell — layout wrapper combining Sidebar + Header.
   Used by every admin page to keep layout consistent.
   ===================================================== */

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--ss-bg-base)' }}>
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} />

      {/* Main content area — left margin shifts when sidebar collapses */}
      <div
        className={`transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-60'}`}
      >
        <Header title={title} subtitle={subtitle} />
        <main className="px-4 md:px-8 py-6 md:py-8 animate-fade-up">
          {children}
        </main>
      </div>
    </div>
  );
}
