import {
  ApiError,
  handleRouteError,
  jsonData,
  parseJson,
  parseQuery,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { getResourceForCaller } from "@/lib/auth/access";
import { isAdminRole, requireOrganization } from "@/lib/auth/context";
import { logAdminNotifications, logNotification } from "@/lib/api/notifications";
import {
  findAlternativeSlots,
  getBlockingBookings,
  overlapsWithBuffer,
} from "@/lib/bookings/availability";
import {
  bookingListQuerySchema,
  createBookingSchema,
} from "@/schemas/booking.schema";

export async function GET(request: Request) {
  try {
    const query = parseQuery(request, bookingListQuerySchema);
    const { user, profile, admin } = await requireOrganization();
    let builder = admin
      .from("bookings")
      .select("*", { count: "exact" })
      .eq("org_id", profile.org_id)
      .order("start_time", { ascending: true });

    if (query.resource_id) builder = builder.eq("resource_id", query.resource_id);
    if (query.status) builder = builder.eq("status", query.status);
    if (query.mine) builder = builder.eq("user_id", user.id);
    if (query.from && query.to) {
      builder = builder.lt("start_time", query.to).gt("end_time", query.from);
    }

    if (!isAdminRole(profile.role) && !query.mine) {
      const { data: memberships, error: membershipError } = await admin
        .from("access_group_members")
        .select("group_id")
        .eq("user_id", user.id);
      throwIfDatabaseError(membershipError);
      const groupIds = (memberships ?? [])
        .map((membership) => membership.group_id)
        .filter((value): value is string => Boolean(value));

      let resourceBuilder = admin
        .from("resources")
        .select("id, access_group_id")
        .eq("org_id", profile.org_id);
      const { data: resources, error: resourceError } = await resourceBuilder;
      throwIfDatabaseError(resourceError);
      const visibleResourceIds = (resources ?? [])
        .filter(
          (resource) =>
            !resource.access_group_id || groupIds.includes(resource.access_group_id),
        )
        .map((resource) => resource.id);

      if (visibleResourceIds.length === 0) return jsonData([], 200, { count: 0, limit: query.limit, offset: query.offset });
      builder = builder.in("resource_id", visibleResourceIds);
    }

    builder = builder.range(query.offset, query.offset + query.limit - 1);
    const { data, error, count } = await builder;
    throwIfDatabaseError(error);
    return jsonData(data, 200, {
      count: count ?? 0,
      limit: query.limit,
      offset: query.offset,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, createBookingSchema);
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

    const start = new Date(input.start_time);
    const end = new Date(input.end_time);
    const bufferMinutes = resource.buffer_minutes ?? 0;
    const bufferMs = bufferMinutes * 60_000;
    const bookings = await getBlockingBookings(
      context.admin,
      resource.id,
      new Date(start.getTime() - bufferMs),
      new Date(end.getTime() + bufferMs),
    );
    if (bookings.some((booking) => overlapsWithBuffer(start, end, booking, bufferMinutes))) {
      const searchEnd = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1_000);
      const alternativesSource = await getBlockingBookings(
        context.admin,
        resource.id,
        start,
        searchEnd,
      );
      throw new ApiError(
        409,
        "BOOKING_CONFLICT",
        "This resource is unavailable for the requested time.",
        {
          next_available_slots: findAlternativeSlots({
            from: start,
            to: searchEnd,
            durationMinutes: Math.ceil((end.getTime() - start.getTime()) / 60_000),
            bookings: alternativesSource,
            bufferMinutes,
          }),
        },
      );
    }

    const status = resource.requires_approval ? "pending" : "confirmed";
    const { data, error } = await context.admin
      .from("bookings")
      .insert({
        ...input,
        notes: input.notes ?? null,
        rrule: input.rrule ?? null,
        user_id: context.user.id,
        org_id: context.profile.org_id,
        status,
      })
      .select("*")
      .single();
    throwIfDatabaseError(error);

    if (!data) {
      throw new ApiError(500, "BOOKING_INSERT_FAILED", "Booking creation failed.");
    }

    if (status === "pending") {
      await logAdminNotifications(context.admin, {
        org_id: context.profile.org_id,
        booking_id: data.id,
        type: "approval_requested",
      });
    } else {
      await logNotification(context.admin, {
        user_id: context.user.id,
        booking_id: data.id,
        type: "booking_confirmed",
      });
    }
    return jsonData(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
