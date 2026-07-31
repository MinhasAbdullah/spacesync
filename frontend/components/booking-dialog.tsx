"use client";

import { CalendarClock, CheckCircle2, LoaderCircle, Repeat, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Field } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiFetch, toQueryString } from "@/lib/api/client";
import type { AvailabilityData, Booking, Resource } from "@/lib/api/types";
import { formatDateTime, toLocalInputValue } from "@/lib/format";
import { createBookingSchema, createRecurringBookingSchema } from "@/schemas/booking.schema";

export default function BookingDialog({
  resource,
  open,
  onOpenChange,
  onCreated,
}: {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (booking: Booking | Booking[]) => void;
}) {
  const initialStart = useMemo(() => {
    const value = new Date();
    value.setMinutes(Math.ceil(value.getMinutes() / 30) * 30, 0, 0);
    if (value <= new Date()) value.setMinutes(value.getMinutes() + 30);
    return value;
  }, [open]);

  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [notes, setNotes] = useState("");
  const [start, setStart] = useState(toLocalInputValue(initialStart));
  const [end, setEnd] = useState(
    toLocalInputValue(new Date(initialStart.getTime() + 60 * 60_000)),
  );
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState("WEEKLY");
  const [count, setCount] = useState(4);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setAttendees(1);
    setNotes("");
    setRecurring(false);
    setFrequency("WEEKLY");
    setCount(4);
    setAvailability(null);
    setError(null);
    setSuccess(null);
    setStart(toLocalInputValue(initialStart));
    setEnd(toLocalInputValue(new Date(initialStart.getTime() + 60 * 60_000)));
  }, [open, initialStart]);

  const durationMinutes = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
  );

  async function checkAvailability() {
    if (!resource || durationMinutes <= 0) {
      setError("End time must be after start time.");
      return;
    }

    setChecking(true);
    setError(null);
    setSuccess(null);

    try {
      const from = new Date(start);
      const searchTo = new Date(from.getTime() + 7 * 24 * 60 * 60_000);
      const response = await apiFetch<AvailabilityData>(
        `/api/resources/${resource.id}/availability${toQueryString({
          from: from.toISOString(),
          to: searchTo.toISOString(),
          duration_minutes: durationMinutes,
        })}`,
      );
      setAvailability(response.data);
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason.message : "Could not check availability.");
    } finally {
      setChecking(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!resource) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const common = {
      resource_id: resource.id,
      title,
      attendee_count: Number(attendees),
      notes: notes.trim() || null,
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
    };
    const payload = recurring
      ? {
          ...common,
          rrule: `FREQ=${frequency};INTERVAL=1;COUNT=${count}`,
          max_occurrences: count,
          horizon_days: 366,
        }
      : common;
    const parsed = recurring
      ? createRecurringBookingSchema.safeParse(payload)
      : createBookingSchema.safeParse(payload);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the booking details.");
      setSaving(false);
      return;
    }

    try {
      const response = await apiFetch<Booking | Booking[]>(
        recurring ? "/api/bookings/recurring" : "/api/bookings",
        {
          method: "POST",
          body: JSON.stringify(parsed.data),
        },
      );
      onCreated?.(response.data);
      setSuccess(
        resource.requires_approval
          ? "Booking submitted for approval."
          : "Booking created successfully.",
      );
      window.setTimeout(() => onOpenChange(false), 700);
    } catch (reason) {
      const apiError = reason instanceof ApiClientError ? reason : null;
      setError(apiError?.message ?? "Could not create the booking.");
      const details = apiError?.details as
        | { next_available_slots?: AvailabilityData["next_available_slots"] }
        | undefined;

      if (details?.next_available_slots) {
        setAvailability((current) => ({
          resource,
          requested_slot: {
            start_time: new Date(start).toISOString(),
            end_time: new Date(end).toISOString(),
            available: false,
          },
          blocking_bookings: current?.blocking_bookings ?? [],
          next_available_slots: details.next_available_slots ?? [],
        }));
      }
    } finally {
      setSaving(false);
    }
  }

  function chooseSlot(slot: { start_time: string; end_time: string }) {
    setStart(toLocalInputValue(new Date(slot.start_time)));
    setEnd(toLocalInputValue(new Date(slot.end_time)));
    setAvailability(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book {resource?.name ?? "resource"}</DialogTitle>
          <DialogDescription>
            {resource?.location || "Choose a date and time for this resource."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <Field label="Booking title">
            <Input
              id="booking-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Team planning session"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start">
              <Input
                id="booking-start"
                type="datetime-local"
                value={start}
                onChange={(event) => {
                  setStart(event.target.value);
                  setAvailability(null);
                }}
                required
              />
            </Field>
            <Field label="End">
              <Input
                id="booking-end"
                type="datetime-local"
                value={end}
                onChange={(event) => {
                  setEnd(event.target.value);
                  setAvailability(null);
                }}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-center">
            <Field
              label="Attendees"
              hint={resource?.capacity ? `Maximum capacity: ${resource.capacity}` : undefined}
            >
              <Input
                id="attendees"
                type="number"
                min={1}
                max={resource?.capacity ?? undefined}
                value={attendees}
                onChange={(event) => setAttendees(Number(event.target.value))}
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={checkAvailability}
              disabled={checking}
            >
              {checking ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Check availability
            </Button>
          </div>

          <Field label="Notes" hint="Optional details for attendees or approvers.">
            <Textarea
              id="booking-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add any setup or access notes"
              className="min-h-24"
            />
          </Field>

          <div className="app-data-row p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--ss-cyan-dim)" }}
                >
                  <Repeat className="h-4 w-4" style={{ color: "var(--ss-cyan)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium">Recurring booking</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--ss-text-muted)" }}>
                    The complete series is validated and created atomically.
                  </p>
                </div>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>

            {recurring ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Frequency">
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Occurrences">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(event) => setCount(Number(event.target.value))}
                  />
                </Field>
              </div>
            ) : null}
          </div>

          {availability ? (
            <div
              className={`rounded-lg border p-4 ${
                availability.requested_slot.available
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-amber-500/30 bg-amber-500/10"
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-medium">
                {availability.requested_slot.available ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <CalendarClock className="h-4 w-4 shrink-0" />
                )}
                {availability.requested_slot.available
                  ? "Requested slot is available"
                  : "Requested slot is unavailable"}
              </p>

              {!availability.requested_slot.available &&
              availability.next_available_slots.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs">Choose one of the next available times:</p>
                  {availability.next_available_slots.map((slot) => (
                    <button
                      type="button"
                      key={slot.start_time}
                      onClick={() => chooseSlot(slot)}
                      className="block w-full rounded-md border px-3 py-2.5 text-left text-xs transition hover:bg-white/5"
                    >
                      {formatDateTime(slot.start_time)} – {formatDateTime(slot.end_time)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {success}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
