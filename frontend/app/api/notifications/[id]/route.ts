import {
  ApiError,
  handleRouteError,
  jsonData,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/context";
import { idParamSchema } from "@/schemas/common.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const { user, admin } = await requireAuth();
    const { data, error } = await admin
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    throwIfDatabaseError(error);
    if (!data) {
      throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found.");
    }
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
