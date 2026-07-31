import {
  ApiError,
  handleRouteError,
  jsonData,
  parseJson,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { logAdminNotifications, logNotification } from "@/lib/api/notifications";
import { getResourceForCaller } from "@/lib/auth/access";
import { requireOrganization } from "@/lib/auth/context";
import {
  getBlockingBookings,
  overlapsWithBuffer,
} from "@/lib/bookings/availability";
import { materializeOccurrences } from "@/lib/bookings/recurrence";
import { createRecurringBookingSchema } from "@/schemas/booking.schema";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, createRecurringBookingSchema);
    const context = await requireOrganization();
    const resource = await getResourceForCaller(context, input.resource_id, {
      requireActive: true,
      requireBookAccess: true,
    });

    if (resource.capacity && input.attendee_count > resource.capacity) {
      throw new ApiError(
        422,
        "CAPACITY_EXCEEDED",
        `Attendee count exceeds this resource's capacity of ${resource.capacity}.`,
      );
    }

    const occurrences = materializeOccurrences({
      start: new Date(input.start_time),
      end: new Date(input.end_time),
      rrule: input.rrule,
      maxOccurrences: input.max_occurrences,
      horizonDays: input.horizon_days,
    });
    const bufferMinutes = resource.buffer_minutes ?? 0;
    const bufferMs = bufferMinutes * 60_000;
    const first = occurrences[0].start;
    const last = occurrences.at(-1)!.end;
    const existing = await getBlockingBookings(
      context.admin,
      resource.id,
      new Date(first.getTime() - bufferMs),
      new Date(last.getTime() + bufferMs),
    );

    const internalConflict = occurrences.some((occurrence, index) =>
      occurrences
        .slice(index + 1)
        .some((other) =>
          occurrence.start.getTime() < other.end.getTime() + bufferMs &&
          occurrence.end.getTime() + bufferMs > other.start.getTime(),
        ),
    );
    if (internalConflict) {
      throw new ApiError(
        422,
        "RECURRENCE_BUFFER_CONFLICT",
        "Occurrences in this series overlap each other or violate the resource buffer.",
      );
    }

    const conflicts = occurrences.filter((occurrence) =>
      existing.some((booking) =>
        overlapsWithBuffer(
          occurrence.start,
          occurrence.end,
          booking,
          bufferMinutes,
        ),
      ),
    );
    if (conflicts.length > 0) {
      throw new ApiError(
        409,
        "RECURRING_BOOKING_CONFLICT",
        "One or more occurrences conflict with existing bookings. No occurrences were created.",
        {
          conflicts: conflicts.map((occurrence) => ({
            start_time: occurrence.start.toISOString(),
            end_time: occurrence.end.toISOString(),
          })),
        },
      );
    }

    const status = resource.requires_approval ? "pending" : "confirmed";
    const rows = occurrences.map((occurrence) => ({
      resource_id: input.resource_id,
      user_id: context.user.id,
      org_id: context.profile.org_id,
      title: input.title,
      attendee_count: input.attendee_count,
      notes: input.notes ?? null,
      start_time: occurrence.start.toISOString(),
      end_time: occurrence.end.toISOString(),
      status,
      rrule: input.rrule,
    }));

    const { data, error } = await context.admin
      .from("bookings")
      .insert(rows)
      .select("*");
    throwIfDatabaseError(error);

    await Promise.all(
      (data ?? []).map((booking) =>
        status === "pending"
          ? logAdminNotifications(context.admin, {
              org_id: context.profile.org_id,
              booking_id: booking.id,
              type: "approval_requested",
            })
          : logNotification(context.admin, {
              user_id: context.user.id,
              booking_id: booking.id,
              type: "booking_confirmed",
            }),
      ),
    );

    return jsonData(data, 201, { occurrence_count: data?.length ?? 0 });
  } catch (error) {
    return handleRouteError(error);
  }
}
