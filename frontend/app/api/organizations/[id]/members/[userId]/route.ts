import {
  ApiError,
  handleRouteError,
  jsonData,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireRole } from "@/lib/auth/context";
import { memberParamSchema } from "@/schemas/common.schema";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const { id, userId } = await parseParams(params, memberParamSchema);
    const context = await requireRole(["super_admin"]);
    if (id !== context.profile.org_id) {
      throw new ApiError(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");
    }
    if (userId === context.user.id) {
      throw new ApiError(
        409,
        "CANNOT_REMOVE_SELF",
        "A super admin cannot remove their own organization membership through this endpoint.",
      );
    }

    const { data: target, error: targetError } = await context.admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .eq("org_id", id)
      .maybeSingle();
    throwIfDatabaseError(targetError);
    if (!target) throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found.");

    const { data: groups, error: groupsError } = await context.admin
      .from("access_groups")
      .select("id")
      .eq("org_id", id);
    throwIfDatabaseError(groupsError);
    const groupIds = (groups ?? []).map((group) => group.id);
    if (groupIds.length > 0) {
      const { error: membershipError } = await context.admin
        .from("access_group_members")
        .delete()
        .eq("user_id", userId)
        .in("group_id", groupIds);
      throwIfDatabaseError(membershipError);
    }

    const { data, error } = await context.admin
      .from("profiles")
      .update({ org_id: null, role: "member" })
      .eq("id", userId)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
