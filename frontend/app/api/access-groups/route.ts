import {
  handleRouteError,
  jsonData,
  parseJson,
  parseQuery,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireOrganization, requireRole } from "@/lib/auth/context";
import {
  accessGroupListQuerySchema,
  createAccessGroupSchema,
} from "@/schemas/access-group.schema";

export async function GET(request: Request) {
  try {
    const query = parseQuery(request, accessGroupListQuerySchema);
    const { profile, admin } = await requireOrganization();
    let builder = admin
      .from("access_groups")
      .select("*", { count: "exact" })
      .eq("org_id", profile.org_id)
      .order("name")
      .range(query.offset, query.offset + query.limit - 1);
    if (query.q) builder = builder.ilike("name", `%${query.q}%`);
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
    const input = await parseJson(request, createAccessGroupSchema);
    const { profile, admin } = await requireRole(["super_admin", "space_admin"]);
    const { data, error } = await admin
      .from("access_groups")
      .insert({ ...input, org_id: profile.org_id })
      .select("*")
      .single();
    throwIfDatabaseError(error);
    return jsonData(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
