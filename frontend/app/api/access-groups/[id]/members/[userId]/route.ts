import {
  ApiError,
  handleRouteError,
  jsonMessage,
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
    const { profile, admin } = await requireRole(["super_admin", "space_admin"]);
    const { data: group, error: groupError } = await admin
      .from("access_groups")
      .select("id")
      .eq("id", id)
      .eq("org_id", profile.org_id)
      .maybeSingle();
    throwIfDatabaseError(groupError);
    if (!group) throw new ApiError(404, "GROUP_NOT_FOUND", "Access group not found.");

    const { data, error } = await admin
      .from("access_group_members")
      .delete()
      .eq("group_id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    throwIfDatabaseError(error);
    if (!data) throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found.");
    return jsonMessage("Member removed from access group.");
  } catch (error) {
    return handleRouteError(error);
  }
}
