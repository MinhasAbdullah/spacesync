import {
  handleRouteError,
  jsonData,
  parseQuery,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireOrganization } from "@/lib/auth/context";
import { profileListQuerySchema } from "@/schemas/profile.schema";

export async function GET(request: Request) {
  try {
    const query = parseQuery(request, profileListQuerySchema);
    const { profile, admin } = await requireOrganization();
    let builder = admin
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);

    if (query.role) builder = builder.eq("role", query.role);
    if (query.q) {
      const safe = query.q.replaceAll(",", " ");
      builder = builder.or(
        `full_name.ilike.%${safe}%,email.ilike.%${safe}%`,
      );
    }

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
