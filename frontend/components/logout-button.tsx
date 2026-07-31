"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return <button type="button" disabled={loading} onClick={async () => { setLoading(true); try { await apiFetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); } finally { setLoading(false); } }}>{loading ? "Signing out…" : "Sign out"}</button>;
}
