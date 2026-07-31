"use client";

import { Bell, Building2, ChevronDown, LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAppContext } from "@/components/app-context";
import { apiFetch } from "@/lib/api/client";
import type { Notification } from "@/lib/api/types";

const PAGE_META: Array<{ prefix: string; title: string; subtitle: string }> = [
  { prefix: "/dashboard", title: "Dashboard", subtitle: "Live organization overview" },
  { prefix: "/search", title: "Find a resource", subtitle: "Check availability and book a space" },
  { prefix: "/resources", title: "Resources", subtitle: "Browse and manage bookable assets" },
  { prefix: "/bookings", title: "Bookings", subtitle: "Manage reservations and approvals" },
  { prefix: "/analytics", title: "Analytics", subtitle: "Utilization and no-show insights" },
  { prefix: "/team", title: "Team & access", subtitle: "Members, roles, and access groups" },
  { prefix: "/settings", title: "Settings", subtitle: "Profile and organization settings" },
];

function roleLabel(role: string) {
  if (role === "super_admin") return "Organization owner";
  if (role === "space_admin") return "Space admin";
  return "Member";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, organization, role } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const meta = useMemo(
    () => PAGE_META.find((item) => pathname.startsWith(item.prefix)) ?? PAGE_META[0],
    [pathname],
  );

  useEffect(() => {
    apiFetch<Notification[]>("/api/notifications?limit=8")
      .then((response) => setNotifications(response.data))
      .catch(() => setNotifications([]));
  }, [pathname]);

  const initials = (profile.full_name || profile.email || "User")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function logout() {
    setLoggingOut(true);
    try {
      await apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur-md"
      style={{ background: "rgba(13, 21, 38, 0.9)", borderColor: "var(--ss-border)" }}
    >
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1 pl-11 md:pl-0">
          <h1
            className="truncate text-base font-bold sm:text-lg md:text-xl"
            style={{ color: "var(--ss-text-primary)" }}
          >
            {meta.title}
          </h1>
          <p
            className="mt-0.5 hidden truncate text-xs sm:block md:text-sm"
            style={{ color: "var(--ss-text-secondary)" }}
          >
            {meta.subtitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          <div
            className="hidden max-w-56 items-center gap-2 rounded-lg border px-3 py-2 lg:flex"
            style={{ borderColor: "var(--ss-border)", color: "var(--ss-text-secondary)" }}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs">{organization.name}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications((value) => !value);
                setShowUser(false);
              }}
              className="relative rounded-lg p-2 transition hover:bg-white/5"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" style={{ color: "var(--ss-text-secondary)" }} />
              {notifications.length > 0 ? (
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                  style={{ background: "var(--ss-danger)" }}
                />
              ) : null}
            </button>

            {showNotifications ? (
              <>
                <button
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                />
                <div
                  className="fixed left-3 right-3 z-40 mt-2 overflow-hidden rounded-xl border shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:w-80"
                  style={{
                    background: "var(--ss-bg-elevated)",
                    borderColor: "var(--ss-border)",
                  }}
                >
                  <div
                    className="border-b px-4 py-3 text-sm font-semibold"
                    style={{ borderColor: "var(--ss-border)" }}
                  >
                    Notifications
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p
                        className="px-4 py-8 text-center text-sm"
                        style={{ color: "var(--ss-text-muted)" }}
                      >
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="border-b px-4 py-3 last:border-0"
                          style={{ borderColor: "var(--ss-border-subtle)" }}
                        >
                          <p className="text-sm capitalize">
                            {notification.type.replaceAll("_", " ")}
                          </p>
                          <p
                            className="mt-1 text-xs"
                            style={{ color: "var(--ss-text-muted)" }}
                          >
                            {new Date(notification.sent_at ?? "").toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowUser((value) => !value);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-lg p-1 pr-1 transition hover:bg-white/5 sm:pr-2"
              aria-label="Open user menu"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "var(--ss-cyan)", color: "var(--ss-bg-base)" }}
              >
                {initials}
              </div>
              <div className="hidden max-w-40 text-left sm:block">
                <p className="truncate text-sm font-medium leading-tight">
                  {profile.full_name || profile.email}
                </p>
                <p
                  className="truncate text-xs leading-tight"
                  style={{ color: "var(--ss-text-muted)" }}
                >
                  {roleLabel(role)}
                </p>
              </div>
              <ChevronDown
                className="hidden h-4 w-4 sm:block"
                style={{ color: "var(--ss-text-muted)" }}
              />
            </button>

            {showUser ? (
              <>
                <button
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShowUser(false)}
                  aria-label="Close user menu"
                />
                <div
                  className="absolute right-0 z-40 mt-2 w-52 rounded-xl border p-2 shadow-2xl"
                  style={{
                    background: "var(--ss-bg-elevated)",
                    borderColor: "var(--ss-border)",
                  }}
                >
                  <div className="border-b px-3 py-2 sm:hidden" style={{ borderColor: "var(--ss-border)" }}>
                    <p className="truncate text-sm font-medium">{profile.full_name || profile.email}</p>
                    <p className="truncate text-xs" style={{ color: "var(--ss-text-muted)" }}>
                      {roleLabel(role)}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/settings")}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5 sm:mt-0"
                  >
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
                    style={{ color: "var(--ss-danger)" }}
                  >
                    {loggingOut ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                    Sign out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
