import {
  handleRouteError,
  jsonData,
  parseQuery,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/context";
import { notificationListQuerySchema } from "@/schemas/notification.schema";

export async function GET(request: Request) {
  try {
    const query = parseQuery(request, notificationListQuerySchema);
    const { user, admin } = await requireAuth();
    let builder = admin
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);
    if (query.booking_id) builder = builder.eq("booking_id", query.booking_id);
    if (query.type) builder = builder.eq("type", query.type);
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
