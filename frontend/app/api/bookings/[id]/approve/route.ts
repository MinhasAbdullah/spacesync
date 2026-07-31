import {
  ApiError,
  handleRouteError,
  jsonData,
  parseJson,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { logNotification } from "@/lib/api/notifications";
import { getBookingForCaller } from "@/lib/auth/access";
import { requireRole } from "@/lib/auth/context";
import { reviewBookingSchema } from "@/schemas/booking.schema";
import { idParamSchema } from "@/schemas/common.schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    await parseJson(request, reviewBookingSchema);
    const context = await requireRole(["super_admin", "space_admin"]);
    const booking = await getBookingForCaller(context, id);
    if (booking.status !== "pending") {
      throw new ApiError(409, "INVALID_STATUS", "Only pending bookings can be approved.");
    }
    const { data, error } = await context.admin
      .from("bookings")
      .update({ status: "confirmed", approved_by: context.user.id })
      .eq("id", id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    if (booking.user_id) {
      await logNotification(context.admin, {
        user_id: booking.user_id,
        booking_id: id,
        type: "booking_approved",
      });
    }
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
