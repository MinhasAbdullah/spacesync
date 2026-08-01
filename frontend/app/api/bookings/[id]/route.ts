import {
  ApiError,
  handleRouteError,
  jsonData,
  jsonMessage,
  parseJson,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { logNotification } from "@/lib/api/notifications";
import {
  assertBookingOwnerOrAdmin,
  getBookingForCaller,
  getResourceForCaller,
} from "@/lib/auth/access";
import { isAdminRole, requireOrganization } from "@/lib/auth/context";
import { updateBookingSchema } from "@/schemas/booking.schema";
import { idParamSchema } from "@/schemas/common.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const context = await requireOrganization();
    const booking = await getBookingForCaller(context, id);
    if (booking.user_id !== context.user.id && !isAdminRole(context.profile.role)) {
      if (!booking.resource_id) throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
      await getResourceForCaller(context, booking.resource_id, {
        requireBookAccess: true,
      });
    }
    return jsonData(booking);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const input = await parseJson(request, updateBookingSchema);
    const context = await requireOrganization();
    const booking = await getBookingForCaller(context, id);
    assertBookingOwnerOrAdmin(context, booking);
    if (["cancelled", "denied", "no_show"].includes(booking.status ?? "")) {
      throw new ApiError(409, "BOOKING_CLOSED", "This booking can no longer be edited.");
    }

    const { data, error } = await context.admin
      .from("bookings")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const context = await requireOrganization();
    const booking = await getBookingForCaller(context, id);
    assertBookingOwnerOrAdmin(context, booking);
    if (["cancelled", "denied", "no_show"].includes(booking.status ?? "")) {
      throw new ApiError(409, "BOOKING_CLOSED", "This booking is already closed.");
    }

    const { data, error } = await context.admin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    if (booking.user_id) {
      await logNotification(context.admin, {
        user_id: booking.user_id,
        booking_id: id,
        type: "booking_cancelled",
      });
    }
    return jsonMessage(`Booking ${data?.id} cancelled.`);
  } catch (error) {
    return handleRouteError(error);
  }
}
