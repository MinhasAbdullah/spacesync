"use client";

import { useState } from "react";

import { AppProvider } from "@/components/app-context";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import type { Organization, Profile } from "@/lib/api/types";

export default function AppShell({
  profile,
  organization,
  children,
}: {
  profile: Profile;
  organization: Organization;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const role = (profile.role ?? "member") as "super_admin" | "space_admin" | "member";

  return (
    <AppProvider
      value={{
        profile,
        organization,
        role,
        isAdmin: role === "super_admin" || role === "space_admin",
        isSuperAdmin: role === "super_admin",
      }}
    >
      <div className="min-h-screen" style={{ background: "var(--ss-bg-base)" }}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />
        <div className={`transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-60"}`}>
          <Header />
          <main className="animate-fade-up mx-auto w-full max-w-[1600px] px-4 pb-10 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">{children}</main>
        </div>
      </div>
    </AppProvider>
  );
}
