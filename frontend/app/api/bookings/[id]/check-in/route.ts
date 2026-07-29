import {
  ApiError,
  handleRouteError,
  jsonData,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { getBookingForCaller, assertBookingOwnerOrAdmin } from "@/lib/auth/access";
import { requireOrganization } from "@/lib/auth/context";
import { idParamSchema } from "@/schemas/common.schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const context = await requireOrganization();
    const booking = await getBookingForCaller(context, id);
    assertBookingOwnerOrAdmin(context, booking);
    if (booking.status !== "confirmed") {
      throw new ApiError(409, "INVALID_STATUS", "Only confirmed bookings can be checked in.");
    }
    if (booking.checked_in) return jsonData(booking);

    const { data, error } = await context.admin
      .from("bookings")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
