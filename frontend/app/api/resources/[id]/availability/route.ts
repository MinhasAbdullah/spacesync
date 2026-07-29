import {
  handleRouteError,
  jsonData,
  parseParams,
  parseQuery,
} from "@/lib/api/http";
import { getResourceForCaller } from "@/lib/auth/access";
import { requireOrganization } from "@/lib/auth/context";
import {
  findAlternativeSlots,
  getBlockingBookings,
  overlapsWithBuffer,
} from "@/lib/bookings/availability";
import { availabilityQuerySchema } from "@/schemas/booking.schema";
import { idParamSchema } from "@/schemas/common.schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const query = parseQuery(request, availabilityQuerySchema);
    const context = await requireOrganization();
    const resource = await getResourceForCaller(context, id, {
      requireActive: true,
      requireBookAccess: true,
    });
    const from = new Date(query.from);
    const to = new Date(query.to);
    const requestedEnd = new Date(from.getTime() + query.duration_minutes * 60_000);
    const bufferMinutes = resource.buffer_minutes ?? 0;
    const bufferMs = bufferMinutes * 60_000;
    const bookings = await getBlockingBookings(
      context.admin,
      id,
      new Date(from.getTime() - bufferMs),
      new Date(to.getTime() + bufferMs),
    );
    const available =
      requestedEnd <= to &&
      !bookings.some((booking) =>
        overlapsWithBuffer(from, requestedEnd, booking, bufferMinutes),
      );

    return jsonData({
      resource,
      requested_slot: {
        start_time: from.toISOString(),
        end_time: requestedEnd.toISOString(),
        available,
      },
      blocking_bookings: bookings,
      next_available_slots: findAlternativeSlots({
        from,
        to,
        durationMinutes: query.duration_minutes,
        bookings,
        bufferMinutes,
      }),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
