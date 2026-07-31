import type { SupabaseClient } from "@supabase/supabase-js";

import { throwIfDatabaseError } from "@/lib/api/http";
import type { Database } from "@/lib/database.types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export async function getBlockingBookings(
  admin: SupabaseClient<Database>,
  resourceId: string,
  from: Date,
  to: Date,
) {
  const { data, error } = await admin
    .from("bookings")
    .select("*")
    .eq("resource_id", resourceId)
    .lt("start_time", to.toISOString())
    .gt("end_time", from.toISOString())
    .not("status", "in", "(cancelled,no_show,denied)")
    .order("start_time", { ascending: true });
  throwIfDatabaseError(error);
  return data ?? [];
}

export function overlapsWithBuffer(
  start: Date,
  end: Date,
  booking: Booking,
  bufferMinutes: number,
) {
  const bufferMs = bufferMinutes * 60_000;
  const existingStart = new Date(booking.start_time).getTime() - bufferMs;
  const existingEnd = new Date(booking.end_time).getTime() + bufferMs;
  return start.getTime() < existingEnd && end.getTime() > existingStart;
}

export function findAlternativeSlots(options: {
  from: Date;
  to: Date;
  durationMinutes: number;
  bookings: Booking[];
  bufferMinutes: number;
  limit?: number;
}) {
  const durationMs = options.durationMinutes * 60_000;
  const stepMs = 15 * 60_000;
  const slots: Array<{ start_time: string; end_time: string }> = [];
  let cursor = new Date(options.from);

  while (
    cursor.getTime() + durationMs <= options.to.getTime() &&
    slots.length < (options.limit ?? 3)
  ) {
    const end = new Date(cursor.getTime() + durationMs);
    const conflict = options.bookings.some((booking) =>
      overlapsWithBuffer(cursor, end, booking, options.bufferMinutes),
    );
    if (!conflict) {
      slots.push({ start_time: cursor.toISOString(), end_time: end.toISOString() });
      cursor = new Date(end.getTime() + options.bufferMinutes * 60_000);
    } else {
      cursor = new Date(cursor.getTime() + stepMs);
    }
  }

  return slots;
}
