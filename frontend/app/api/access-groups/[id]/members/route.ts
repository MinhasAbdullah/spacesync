import {
  ApiError,
  handleRouteError,
  jsonData,
  parseJson,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireOrganization, requireRole } from "@/lib/auth/context";
import { addAccessGroupMemberSchema } from "@/schemas/access-group.schema";
import { idParamSchema } from "@/schemas/common.schema";

async function assertGroup(admin: Awaited<ReturnType<typeof requireOrganization>>["admin"], orgId: string, id: string) {
  const { data, error } = await admin
    .from("access_groups")
    .select("id")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();
  throwIfDatabaseError(error);
  if (!data) throw new ApiError(404, "GROUP_NOT_FOUND", "Access group not found.");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const { profile, admin } = await requireOrganization();
    await assertGroup(admin, profile.org_id, id);
    const { data, error } = await admin
      .from("access_group_members")
      .select("id, group_id, user_id, profiles(*)")
      .eq("group_id", id);
    throwIfDatabaseError(error);
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const input = await parseJson(request, addAccessGroupMemberSchema);
    const { profile, admin } = await requireRole(["super_admin", "space_admin"]);
    await assertGroup(admin, profile.org_id, id);

    const { data: memberProfile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("id", input.user_id)
      .eq("org_id", profile.org_id)
      .maybeSingle();
    throwIfDatabaseError(profileError);
    if (!memberProfile) {
      throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found in this organization.");
    }

    const { data, error } = await admin
      .from("access_group_members")
      .insert({ group_id: id, user_id: input.user_id })
      .select("*")
      .single();
    throwIfDatabaseError(error);
    return jsonData(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
