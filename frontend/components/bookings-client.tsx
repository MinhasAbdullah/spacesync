"use client";

import {
  CalendarPlus,
  Check,
  Clock3,
  Edit3,
  LoaderCircle,
  LogIn,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAppContext } from "@/components/app-context";
import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import { Field, PageContainer, PageHeader } from "@/components/page-layout";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiFetch, toQueryString } from "@/lib/api/client";
import type { Booking, Profile, Resource } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { updateBookingSchema } from "@/schemas/booking.schema";

const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "denied", "no_show"];

export default function BookingsClient() {
  const { profile, isAdmin } = useAppContext();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [status, setStatus] = useState("all");
  const [scope, setScope] = useState(isAdmin ? "all" : "mine");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAttendees, setEditAttendees] = useState(1);
  const [editNotes, setEditNotes] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const url = `/api/bookings${toQueryString({
      limit: 100,
      mine: scope === "mine" ? true : undefined,
      status: status === "all" ? undefined : status,
    })}`;

    Promise.all([
      apiFetch<Booking[]>(url),
      apiFetch<Resource[]>("/api/resources?limit=100"),
      isAdmin
        ? apiFetch<Profile[]>("/api/profiles?limit=100")
        : Promise.resolve({ data: [profile] }),
    ])
      .then(([bookingResponse, resourceResponse, profileResponse]) => {
        if (!active) return;
        setBookings(bookingResponse.data);
        setResources(resourceResponse.data);
        setProfiles(profileResponse.data);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Could not load bookings.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [scope, status, version, isAdmin, profile]);

  const resourceById = useMemo(
    () => new Map(resources.map((resource) => [resource.id, resource])),
    [resources],
  );
  const profileById = useMemo(
    () => new Map(profiles.map((item) => [item.id, item])),
    [profiles],
  );
  const filtered = bookings.filter((booking) => {
    const resource = resourceById.get(booking.resource_id ?? "");
    return `${booking.title} ${resource?.name ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  async function action(
    booking: Booking,
    path: string,
    method: "POST" | "DELETE" = "POST",
    body?: unknown,
  ) {
    setBusyId(booking.id);
    setError(null);
    try {
      await apiFetch(`/api/bookings/${booking.id}${path}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      setVersion((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Booking action failed.");
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(booking: Booking) {
    setEditing(booking);
    setEditTitle(booking.title);
    setEditAttendees(booking.attendee_count ?? 1);
    setEditNotes(booking.notes ?? "");
    setDialogError(null);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;

    const parsed = updateBookingSchema.safeParse({
      title: editTitle,
      attendee_count: editAttendees,
      notes: editNotes.trim() || null,
    });
    if (!parsed.success) {
      setDialogError(parsed.error.issues[0]?.message ?? "Check the booking details.");
      return;
    }

    setBusyId(editing.id);
    try {
      await apiFetch(`/api/bookings/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify(parsed.data),
      });
      setEditing(null);
      setVersion((value) => value + 1);
    } catch (reason) {
      setDialogError(reason instanceof ApiClientError ? reason.message : "Could not update booking.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Bookings"
        description="Manage reservations, approval requests, check-ins, cancellations, and no-show status from one responsive view."
        actions={
          <>
            <Button variant="outline" onClick={() => setVersion((value) => value + 1)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/search">
                <CalendarPlus className="mr-2 h-4 w-4" />
                New booking
              </Link>
            </Button>
          </>
        }
      />

      <section className="app-panel app-toolbar">
        <div
          className={`grid gap-3 ${
            isAdmin
              ? "md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_190px_210px]"
              : "md:grid-cols-[minmax(260px,1fr)_190px]"
          }`}
        >
          <div className="relative md:col-span-2 xl:col-span-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--ss-text-muted)" }}
            />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title or resource"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {BOOKING_STATUSES.map((value) => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin ? (
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All visible bookings</SelectItem>
                <SelectItem value="mine">My bookings</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </section>

      {loading ? (
        <LoadingState label="Loading bookings…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setVersion((value) => value + 1)} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="Change your filters or create a booking from Find & book."
        />
      ) : (
        <section className="space-y-3">
          {filtered.map((booking) => {
            const resource = resourceById.get(booking.resource_id ?? "");
            const owner = profileById.get(booking.user_id ?? "");
            const own = booking.user_id === profile.id;
            const closed = ["cancelled", "denied", "no_show"].includes(booking.status ?? "");
            const busy = busyId === booking.id;

            return (
              <Card key={booking.id} className="app-card-hover min-w-0">
                <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 truncate text-base font-semibold">{booking.title}</h3>
                      <StatusBadge status={booking.status} />
                      {booking.checked_in ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                          Checked in
                        </span>
                      ) : null}
                    </div>

                    <p className="truncate text-sm" style={{ color: "var(--ss-text-secondary)" }}>
                      {resource?.name ?? "Unknown resource"}
                      <span className="mx-1.5">·</span>
                      {resource?.location ?? "No location"}
                    </p>

                    <p className="flex items-start gap-1.5 text-sm leading-relaxed">
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--ss-cyan)" }} />
                      <span>
                        {formatDateTime(booking.start_time)}
                        <span className="mx-1">–</span>
                        {formatDateTime(booking.end_time)}
                      </span>
                    </p>

                    {isAdmin ? (
                      <p
                        className="flex items-center gap-1.5 truncate text-xs"
                        style={{ color: "var(--ss-text-muted)" }}
                      >
                        <UserRound className="h-3.5 w-3.5 shrink-0" />
                        Booked by {owner?.full_name || owner?.email || booking.user_id}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:max-w-[430px] lg:justify-end">
                    {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}

                    {!closed && (own || isAdmin) ? (
                      <Button variant="outline" size="sm" onClick={() => openEdit(booking)} disabled={busy}>
                        <Edit3 className="mr-1.5 h-4 w-4" />
                        Edit
                      </Button>
                    ) : null}

                    {booking.status === "confirmed" && !booking.checked_in && (own || isAdmin) ? (
                      <Button size="sm" onClick={() => action(booking, "/check-in")} disabled={busy}>
                        <LogIn className="mr-1.5 h-4 w-4" />
                        Check in
                      </Button>
                    ) : null}

                    {isAdmin && booking.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => action(booking, "/approve", "POST", {})}
                          disabled={busy}
                        >
                          <Check className="mr-1.5 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = window.prompt("Reason for denial (optional)") ?? undefined;
                            if (reason !== undefined) {
                              action(booking, "/deny", "POST", { reason: reason || null });
                            }
                          }}
                          disabled={busy}
                        >
                          <X className="mr-1.5 h-4 w-4" />
                          Deny
                        </Button>
                      </>
                    ) : null}

                    {isAdmin &&
                    booking.status === "confirmed" &&
                    !booking.checked_in &&
                    new Date(booking.start_time) < new Date() ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => action(booking, "/no-show")}
                        disabled={busy}
                      >
                        <UserX className="mr-1.5 h-4 w-4" />
                        No-show
                      </Button>
                    ) : null}

                    {!closed && (own || isAdmin) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm("Cancel this booking?")) {
                            action(booking, "", "DELETE");
                          }
                        }}
                        disabled={busy}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit booking</DialogTitle>
            <DialogDescription>
              To change the time or resource, cancel this reservation and create a new one.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveEdit} className="space-y-5">
            <Field label="Title">
              <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            </Field>
            <Field label="Attendees">
              <Input
                type="number"
                min={1}
                value={editAttendees}
                onChange={(event) => setEditAttendees(Number(event.target.value))}
              />
            </Field>
            <Field label="Notes">
              <Textarea
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                className="min-h-28"
              />
            </Field>

            {dialogError ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {dialogError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button disabled={Boolean(editing && busyId === editing.id)}>Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
