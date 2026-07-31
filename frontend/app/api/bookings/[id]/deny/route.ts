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
    const input = await parseJson(request, reviewBookingSchema);
    const context = await requireRole(["super_admin", "space_admin"]);
    const booking = await getBookingForCaller(context, id);
    if (booking.status !== "pending") {
      throw new ApiError(409, "INVALID_STATUS", "Only pending bookings can be denied.");
    }
    const denialNote = input.reason
      ? [booking.notes, `Denial reason: ${input.reason}`].filter(Boolean).join("\n")
      : booking.notes;
    const { data, error } = await context.admin
      .from("bookings")
      .update({ status: "denied", approved_by: context.user.id, notes: denialNote })
      .eq("id", id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    if (booking.user_id) {
      await logNotification(context.admin, {
        user_id: booking.user_id,
        booking_id: id,
        type: "booking_denied",
      });
    }
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
