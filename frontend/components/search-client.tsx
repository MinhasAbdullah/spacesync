"use client";

import {
  CalendarPlus,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Search as SearchIcon,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/async-state";
import BookingDialog from "@/components/booking-dialog";
import { Field, PageContainer, PageHeader } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch, toQueryString } from "@/lib/api/client";
import type { AvailabilityData, Resource } from "@/lib/api/types";
import { formatDateTime, toLocalInputValue } from "@/lib/format";

const RESOURCE_TYPES = ["room", "desk", "equipment", "vehicle", "court", "other"];

export default function SearchClient() {
  const initialStart = useMemo(() => {
    const date = new Date();
    date.setMinutes(Math.ceil(date.getMinutes() / 30) * 30, 0, 0);
    if (date <= new Date()) date.setMinutes(date.getMinutes() + 30);
    return date;
  }, []);

  const [resources, setResources] = useState<Resource[]>([]);
  const [availability, setAvailability] = useState<Record<string, AvailabilityData | null>>({});
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [start, setStart] = useState(toLocalInputValue(initialStart));
  const [end, setEnd] = useState(
    toLocalInputValue(new Date(initialStart.getTime() + 60 * 60_000)),
  );
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResource, setBookingResource] = useState<Resource | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiFetch<Resource[]>(
      `/api/resources${toQueryString({
        limit: 100,
        q: query || undefined,
        type: type === "all" ? undefined : type,
        is_active: true,
      })}`,
    )
      .then((response) => {
        if (active) setResources(response.data);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Could not load resources.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, type]);

  async function checkAll() {
    const from = new Date(start);
    const endDate = new Date(end);
    const duration = Math.round((endDate.getTime() - from.getTime()) / 60_000);

    if (duration <= 0) {
      setError("End time must be after start time.");
      return;
    }

    setChecking(true);
    setError(null);
    const searchTo = new Date(from.getTime() + 7 * 24 * 60 * 60_000);

    const results = await Promise.all(
      resources.map(async (resource) => {
        try {
          const response = await apiFetch<AvailabilityData>(
            `/api/resources/${resource.id}/availability${toQueryString({
              from: from.toISOString(),
              to: searchTo.toISOString(),
              duration_minutes: duration,
            })}`,
          );
          return [resource.id, response.data] as const;
        } catch {
          return [resource.id, null] as const;
        }
      }),
    );

    setAvailability(Object.fromEntries(results));
    setChecking(false);
  }

  const availableCount = Object.values(availability).filter(
    (item) => item?.requested_slot.available,
  ).length;
  const hasAvailabilityResults = Object.keys(availability).length > 0;

  return (
    <PageContainer>
      <PageHeader
        title="Find and book"
        description="Search your organization’s live inventory, choose a time window, and check availability before creating a reservation."
      />

      <section className="app-panel app-toolbar">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_220px_220px_auto] xl:items-end">
          <Field label="Search resources" className="md:col-span-2 xl:col-span-1">
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--ss-text-muted)" }}
              />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name or location"
              />
            </div>
          </Field>

          <Field label="Resource type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {RESOURCE_TYPES.map((value) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Start time">
            <Input
              type="datetime-local"
              value={start}
              onChange={(event) => {
                setStart(event.target.value);
                setAvailability({});
              }}
            />
          </Field>

          <Field label="End time">
            <Input
              type="datetime-local"
              value={end}
              onChange={(event) => {
                setEnd(event.target.value);
                setAvailability({});
              }}
            />
          </Field>

          <Button
            className="w-full xl:w-auto"
            onClick={checkAll}
            disabled={checking || resources.length === 0}
          >
            {checking ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
            Check availability
          </Button>
        </div>

        {hasAvailabilityResults ? (
          <div
            className="mt-4 flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor: "var(--ss-border)",
              background: "rgba(0, 212, 255, 0.04)",
              color: "var(--ss-text-secondary)",
            }}
          >
            <span>
              <strong style={{ color: "var(--ss-text-primary)" }}>{availableCount}</strong> of{" "}
              {resources.length} resources are available for this slot.
            </span>
            <span className="flex items-center gap-1.5 text-xs">
              <Clock3 className="h-3.5 w-3.5" />
              Results use live booking data
            </span>
          </div>
        ) : null}
      </section>

      {loading ? (
        <LoadingState label="Searching resources…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : resources.length === 0 ? (
        <EmptyState title="No matching resources" description="Try a different search or resource type." />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => {
            const result = availability[resource.id];
            const isAvailable = result?.requested_slot.available;

            return (
              <Card key={resource.id} className="app-card-hover flex min-w-0 flex-col overflow-hidden">
                <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{resource.name}</h3>
                      <p
                        className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm"
                        style={{ color: "var(--ss-text-secondary)" }}
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{resource.location || "No location"}</span>
                      </p>
                    </div>
                    <Badge className="shrink-0 capitalize">{resource.type}</Badge>
                  </div>

                  <div className="flex min-h-7 flex-wrap gap-2 text-xs">
                    {resource.capacity ? (
                      <span className="flex items-center gap-1 rounded-md border px-2 py-1">
                        <Users className="h-3 w-3" />
                        {resource.capacity}
                      </span>
                    ) : null}
                    {(resource.amenities ?? []).slice(0, 3).map((amenity) => (
                      <span key={amenity} className="max-w-full truncate rounded-md border px-2 py-1">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto space-y-3">
                    {result ? (
                      <div
                        className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                          isAvailable
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-red-500/30 bg-red-500/10 text-red-300"
                        }`}
                      >
                        {isAvailable ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{isAvailable ? "Available for this window" : "Unavailable for this window"}</span>
                      </div>
                    ) : null}

                    {!isAvailable && result?.next_available_slots?.length ? (
                      <p className="text-xs leading-relaxed" style={{ color: "var(--ss-text-muted)" }}>
                        Next opening: {formatDateTime(result.next_available_slots[0].start_time)}
                      </p>
                    ) : null}

                    <Button
                      className="w-full"
                      onClick={() => setBookingResource(resource)}
                      disabled={result ? !isAvailable : false}
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      {isAvailable ? "Book this slot" : "Open booking form"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <BookingDialog
        resource={bookingResource}
        open={Boolean(bookingResource)}
        onOpenChange={(open) => {
          if (!open) setBookingResource(null);
        }}
      />
    </PageContainer>
  );
}
