"use client";

import { BarChart3, CalendarRange, Clock, RefreshCw, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { Field, PageContainer, PageHeader } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, toQueryString } from "@/lib/api/client";
import type { AnalyticsData } from "@/lib/api/types";

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function AnalyticsClient() {
  const initialFrom = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() - 30);
    return value;
  }, []);
  const [from, setFrom] = useState(dateInput(initialFrom));
  const [to, setTo] = useState(dateInput(new Date()));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T23:59:59.999`);

    apiFetch<AnalyticsData>(
      `/api/analytics/utilization${toQueryString({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      })}`,
    )
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Could not load analytics.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [from, to, version]);

  if (loading) return <LoadingState label="Calculating utilization…" />;
  if (error) {
    return <ErrorState message={error} onRetry={() => setVersion((value) => value + 1)} />;
  }
  if (!data) return null;

  const peakData = data.peak_hours_utc.map((item) => ({
    ...item,
    label: `${String(item.hour).padStart(2, "0")}:00`,
  }));
  const averageUtilization = data.resources.length
    ? data.resources.reduce((sum, item) => sum + item.utilization_percent, 0) /
      data.resources.length
    : 0;
  const noShowRate = data.totals.bookings
    ? (data.totals.no_shows / data.totals.bookings) * 100
    : 0;

  const stats = [
    { label: "Resources", value: data.totals.resources, icon: BarChart3 },
    { label: "Bookings", value: data.totals.bookings, icon: CalendarRange },
    { label: "Average utilization", value: `${averageUtilization.toFixed(1)}%`, icon: Clock },
    { label: "No-show rate", value: `${noShowRate.toFixed(1)}%`, icon: Users },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Utilization analytics"
        description="Review booking demand, no-show patterns, resource utilization, and the most active bookers for a selected date range."
      />

      <section className="app-panel app-toolbar">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end lg:max-w-xl">
          <Field label="From">
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
          <Button
            variant="outline"
            className="w-full sm:w-10 sm:px-0"
            onClick={() => setVersion((value) => value + 1)}
            aria-label="Refresh analytics"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="ml-2 sm:sr-only">Refresh</span>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="ss-stat-card app-card-hover">
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

      <section className="grid gap-4 xl:grid-cols-2 xl:gap-6">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Peak booking hours</CardTitle>
            <p className="text-sm" style={{ color: "var(--ss-text-secondary)" }}>
              Hourly demand is displayed in UTC.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-72 min-w-0 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="label" interval={2} tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,.035)" }}
                    contentStyle={{
                      background: "var(--ss-bg-elevated)",
                      border: "1px solid var(--ss-border)",
                      borderRadius: "10px",
                    }}
                  />
                  <Bar dataKey="booking_count" fill="var(--ss-cyan)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Most active bookers</CardTitle>
            <p className="text-sm" style={{ color: "var(--ss-text-secondary)" }}>
              Members with the highest number of bookings in this period.
            </p>
          </CardHeader>
          <CardContent>
            {data.most_active_bookers.length === 0 ? (
              <EmptyState title="No activity" description="No bookings occurred in this range." />
            ) : (
              <div className="space-y-2.5">
                {data.most_active_bookers.map((booker, index) => (
                  <div
                    key={booker.id}
                    className="app-data-row flex items-center justify-between gap-3 p-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: "var(--ss-cyan-dim)", color: "var(--ss-cyan)" }}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {booker.full_name || booker.email}
                        </p>
                        <p className="truncate text-xs" style={{ color: "var(--ss-text-muted)" }}>
                          {booker.email}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold">{booker.booking_count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Resource performance</CardTitle>
          <p className="text-sm" style={{ color: "var(--ss-text-secondary)" }}>
            Compare bookings, booked hours, utilization, and no-show rates.
          </p>
        </CardHeader>
        <CardContent>
          {data.resources.length === 0 ? (
            <EmptyState title="No resources" description="Create resources to begin tracking utilization." />
          ) : (
            <div className="app-mobile-scroll -mx-4 sm:-mx-5 lg:-mx-6">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr
                    className="border-b text-left"
                    style={{
                      borderColor: "var(--ss-border)",
                      color: "var(--ss-text-secondary)",
                    }}
                  >
                    <th className="px-4 py-3 sm:px-5 lg:px-6">Resource</th>
                    <th className="p-3">Bookings</th>
                    <th className="p-3">Booked hours</th>
                    <th className="p-3">Utilization</th>
                    <th className="p-3 pr-6">No-show rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.resources.map((item) => (
                    <tr
                      key={item.resource.id}
                      className="border-b last:border-0"
                      style={{ borderColor: "var(--ss-border-subtle)" }}
                    >
                      <td className="px-4 py-4 font-medium sm:px-5 lg:px-6">
                        {item.resource.name}
                      </td>
                      <td className="p-3">{item.booking_count}</td>
                      <td className="p-3">{item.booked_hours}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, item.utilization_percent)}%`,
                                background: "var(--ss-cyan)",
                              }}
                            />
                          </div>
                          <span>{item.utilization_percent}%</span>
                        </div>
                      </td>
                      <td className="p-3 pr-6">{item.no_show_rate_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
