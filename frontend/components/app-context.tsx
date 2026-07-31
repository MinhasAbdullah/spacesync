"use client";

import { createContext, useContext } from "react";

import type { AppRole, Organization, Profile } from "@/lib/api/types";

export type AppContextValue = {
  profile: Profile;
  organization: Organization;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AppRole;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  value,
  children,
}: {
  value: AppContextValue;
  children: React.ReactNode;
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppContext must be used inside AppProvider.");
  return value;
}
