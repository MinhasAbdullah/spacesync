"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Layers,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAppContext } from "@/components/app-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { PageContainer, PageHeader } from "@/components/page-layout";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, toQueryString } from "@/lib/api/client";
import type { Booking, Notification, Profile, Resource } from "@/lib/api/types";
import { endOfLocalDay, formatDateTime, startOfLocalDay } from "@/lib/format";

export default function DashboardClient() {
  const { isAdmin } = useAppContext();
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const now = new Date();
    const from = startOfLocalDay(now).toISOString();
    const to = new Date(now.getTime() + 30 * 24 * 60 * 60_000).toISOString();

    Promise.all([
      apiFetch<Resource[]>("/api/resources?limit=100"),
      apiFetch<Booking[]>(
        `/api/bookings${toQueryString({
          from,
          to,
          limit: 100,
          mine: isAdmin ? undefined : true,
        })}`,
      ),
      apiFetch<Notification[]>("/api/notifications?limit=6"),
      isAdmin ? apiFetch<Profile[]>("/api/profiles?limit=1") : Promise.resolve(null),
    ])
      .then(([resourceResponse, bookingResponse, notificationResponse, profileResponse]) => {
        if (!active) return;
        setResources(resourceResponse.data);
        setBookings(bookingResponse.data);
        setNotifications(notificationResponse.data);
        setMemberCount(profileResponse?.meta?.count ?? null);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Could not load the dashboard.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, version]);

  const today = useMemo(() => {
    const start = startOfLocalDay().getTime();
    const end = endOfLocalDay().getTime();
    return bookings.filter((booking) => {
      const time = new Date(booking.start_time).getTime();
      return time >= start && time <= end;
    });
  }, [bookings]);

  const pending = bookings.filter((booking) => booking.status === "pending");
  const upcoming = bookings
    .filter(
      (booking) =>
        new Date(booking.end_time) > new Date() &&
        !["cancelled", "denied", "no_show"].includes(booking.status ?? ""),
    )
    .slice(0, 6);
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));

  if (loading) return <LoadingState label="Loading live workspace data…" />;
  if (error) {
    return <ErrorState message={error} onRetry={() => setVersion((value) => value + 1)} />;
  }

  const stats = [
    {
      label: "Active resources",
      value: resources.filter((resource) => resource.is_active).length,
      icon: Layers,
    },
    { label: "Bookings today", value: today.length, icon: CalendarDays },
    { label: "Pending approval", value: pending.length, icon: Clock },
    ...(isAdmin
      ? [{ label: "Organization members", value: memberCount ?? 0, icon: Users }]
      : []),
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Live overview"
        description="Monitor current resources, upcoming reservations, approval requests, and recent organization activity."
        actions={
          <>
            <Button variant="outline" onClick={() => setVersion((value) => value + 1)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/search">
                <Plus className="mr-2 h-4 w-4" />
                New booking
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="ss-stat-card app-card-hover overflow-hidden">
            <CardContent className="flex items-center justify-between gap-4 p-5 sm:p-6">
              <div className="min-w-0">
                <p className="truncate text-sm" style={{ color: "var(--ss-text-secondary)" }}>
                  {label}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
              </div>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--ss-cyan-dim)" }}
              >
                <Icon className="h-5 w-5" style={{ color: "var(--ss-cyan)" }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)] xl:gap-6">
        <Card className="min-w-0">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle>Upcoming bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming bookings" description="Book a resource to see it here." />
            ) : (
              <div className="space-y-3">
                {upcoming.map((booking) => (
                  <div
                    key={booking.id}
                    className="app-data-row flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{booking.title}</p>
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{ color: "var(--ss-text-secondary)" }}
                      >
                        {resourceById.get(booking.resource_id ?? "")?.name ?? "Resource"}
                        <span className="mx-1.5">·</span>
                        {formatDateTime(booking.start_time)}
                      </p>
                    </div>
                    <div className="shrink-0 self-start sm:self-auto">
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Recent notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <EmptyState title="No notifications" description="Booking updates will appear here." />
            ) : (
              <div className="space-y-2.5">
                {notifications.map((notification) => (
                  <div key={notification.id} className="app-data-row flex gap-3 p-3.5">
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "var(--ss-cyan-dim)" }}
                    >
                      <CheckCircle2 className="h-4 w-4" style={{ color: "var(--ss-cyan)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm capitalize">
                        {notification.type.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--ss-text-muted)" }}>
                        {formatDateTime(notification.sent_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {isAdmin && pending.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" style={{ color: "var(--ss-warning)" }} />
              Approval queue
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {pending.slice(0, 4).map((booking) => (
              <Link
                href="/bookings"
                key={booking.id}
                className="app-data-row app-card-hover block min-w-0 p-4"
              >
                <p className="truncate font-medium">{booking.title}</p>
                <p className="mt-1 truncate text-sm" style={{ color: "var(--ss-text-secondary)" }}>
                  {resourceById.get(booking.resource_id ?? "")?.name ?? "Resource"}
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--ss-text-muted)" }}>
                  {formatDateTime(booking.start_time)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
