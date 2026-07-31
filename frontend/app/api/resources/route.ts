import {
  ApiError,
  handleRouteError,
  jsonData,
  parseJson,
  parseQuery,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { isAdminRole, requireOrganization, requireRole } from "@/lib/auth/context";
import {
  createResourceSchema,
  resourceListQuerySchema,
} from "@/schemas/resource.schema";

export async function GET(request: Request) {
  try {
    const query = parseQuery(request, resourceListQuerySchema);
    const { user, profile, admin } = await requireOrganization();
    let builder = admin
      .from("resources")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("name");

    if (query.q) builder = builder.ilike("name", `%${query.q}%`);
    if (query.type) builder = builder.eq("type", query.type);
    if (query.location) builder = builder.ilike("location", `%${query.location}%`);
    if (query.is_active !== undefined) builder = builder.eq("is_active", query.is_active);
    if (query.access_group_id) builder = builder.eq("access_group_id", query.access_group_id);

    const { data: resources, error } = await builder;
    throwIfDatabaseError(error);

    let visible = resources ?? [];
    if (!isAdminRole(profile.role)) {
      const { data: memberships, error: membershipError } = await admin
        .from("access_group_members")
        .select("group_id")
        .eq("user_id", user.id);
      throwIfDatabaseError(membershipError);
      const groupIds = new Set(
        (memberships ?? []).map((membership) => membership.group_id).filter(Boolean),
      );
      visible = visible.filter(
        (resource) =>
          !resource.access_group_id || groupIds.has(resource.access_group_id),
      );
    }

    const paginated = visible.slice(query.offset, query.offset + query.limit);
    return jsonData(paginated, 200, {
      count: visible.length,
      limit: query.limit,
      offset: query.offset,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, createResourceSchema);
    const { profile, admin } = await requireRole(["super_admin", "space_admin"]);

    if (input.access_group_id) {
      const { data: group, error: groupError } = await admin
        .from("access_groups")
        .select("id")
        .eq("id", input.access_group_id)
        .eq("org_id", profile.org_id)
        .maybeSingle();
      throwIfDatabaseError(groupError);
      if (!group) {
        throw new ApiError(422, "INVALID_ACCESS_GROUP", "Access group does not belong to this organization.");
      }
    }

    const { data, error } = await admin
      .from("resources")
      .insert({ ...input, org_id: profile.org_id })
      .select("*")
      .single();
    throwIfDatabaseError(error);
    return jsonData(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
