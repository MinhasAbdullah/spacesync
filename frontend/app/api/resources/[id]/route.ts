import {
  ApiError,
  handleRouteError,
  jsonData,
  jsonMessage,
  parseJson,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { getResourceForCaller } from "@/lib/auth/access";
import { requireOrganization, requireRole } from "@/lib/auth/context";
import { idParamSchema } from "@/schemas/common.schema";
import { updateResourceSchema } from "@/schemas/resource.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const context = await requireOrganization();
    const resource = await getResourceForCaller(context, id, {
      requireBookAccess: true,
    });
    return jsonData(resource);
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
    const input = await parseJson(request, updateResourceSchema);
    const context = await requireRole(["super_admin", "space_admin"]);
    await getResourceForCaller(context, id);

    if (input.access_group_id) {
      const { data: group, error: groupError } = await context.admin
        .from("access_groups")
        .select("id")
        .eq("id", input.access_group_id)
        .eq("org_id", context.profile.org_id)
        .maybeSingle();
      throwIfDatabaseError(groupError);
      if (!group) {
        throw new ApiError(422, "INVALID_ACCESS_GROUP", "Access group does not belong to this organization.");
      }
    }

    const { data, error } = await context.admin
      .from("resources")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
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
    const context = await requireRole(["super_admin", "space_admin"]);
    await getResourceForCaller(context, id);
    const { error } = await context.admin.from("resources").delete().eq("id", id);
    throwIfDatabaseError(error);
    return jsonMessage("Resource deleted.");
  } catch (error) {
    return handleRouteError(error);
  }
}
