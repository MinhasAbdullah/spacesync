import {
  ApiError,
  handleRouteError,
  jsonData,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { logNotification } from "@/lib/api/notifications";
import { getBookingForCaller } from "@/lib/auth/access";
import { requireRole } from "@/lib/auth/context";
import { idParamSchema } from "@/schemas/common.schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const context = await requireRole(["super_admin", "space_admin"]);
    const booking = await getBookingForCaller(context, id);
    if (booking.status !== "confirmed") {
      throw new ApiError(
        409,
        "INVALID_STATUS",
        "Only confirmed bookings can be marked as a no-show.",
      );
    }
    if (booking.checked_in) {
      throw new ApiError(409, "ALREADY_CHECKED_IN", "A checked-in booking cannot be marked as a no-show.");
    }
    const { data, error } = await context.admin
      .from("bookings")
      .update({ status: "no_show" })
      .eq("id", id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    if (booking.user_id) {
      await logNotification(context.admin, {
        user_id: booking.user_id,
        booking_id: id,
        type: "booking_no_show",
      });
    }
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
