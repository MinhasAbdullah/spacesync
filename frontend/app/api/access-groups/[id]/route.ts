import {
  ApiError,
  handleRouteError,
  jsonData,
  jsonMessage,
  parseJson,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireOrganization, requireRole } from "@/lib/auth/context";
import { idParamSchema } from "@/schemas/common.schema";
import { updateAccessGroupSchema } from "@/schemas/access-group.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const { profile, admin } = await requireOrganization();
    const { data, error } = await admin
      .from("access_groups")
      .select("*")
      .eq("id", id)
      .eq("org_id", profile.org_id)
      .maybeSingle();
    throwIfDatabaseError(error);
    if (!data) throw new ApiError(404, "GROUP_NOT_FOUND", "Access group not found.");
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const input = await parseJson(request, updateAccessGroupSchema);
    const { profile, admin } = await requireRole(["super_admin", "space_admin"]);
    const { data, error } = await admin
      .from("access_groups")
      .update(input)
      .eq("id", id)
      .eq("org_id", profile.org_id)
      .select("*")
      .maybeSingle();
    throwIfDatabaseError(error);
    if (!data) throw new ApiError(404, "GROUP_NOT_FOUND", "Access group not found.");
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const { profile, admin } = await requireRole(["super_admin", "space_admin"]);
    const { data, error } = await admin
      .from("access_groups")
      .delete()
      .eq("id", id)
      .eq("org_id", profile.org_id)
      .select("id")
      .maybeSingle();
    throwIfDatabaseError(error);
    if (!data) throw new ApiError(404, "GROUP_NOT_FOUND", "Access group not found.");
    return jsonMessage("Access group deleted.");
  } catch (error) {
    return handleRouteError(error);
  }
}
