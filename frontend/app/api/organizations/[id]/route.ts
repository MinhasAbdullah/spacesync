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
import { updateOrganizationSchema } from "@/schemas/organization.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const { profile, admin } = await requireOrganization();
    if (id !== profile.org_id) {
      throw new ApiError(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");
    }
    const { data, error } = await admin
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();
    throwIfDatabaseError(error);
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
    const input = await parseJson(request, updateOrganizationSchema);
    const { profile, admin } = await requireRole(["super_admin"]);
    if (id !== profile.org_id) {
      throw new ApiError(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");
    }
    const { data, error } = await admin
      .from("organizations")
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
    const { profile, admin } = await requireRole(["super_admin"]);
    if (id !== profile.org_id) {
      throw new ApiError(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");
    }

    const { error: detachError } = await admin
      .from("profiles")
      .update({ org_id: null, role: "member" })
      .eq("org_id", id);
    throwIfDatabaseError(detachError);
    const { error } = await admin.from("organizations").delete().eq("id", id);
    throwIfDatabaseError(error);
    return jsonMessage("Organization deleted.");
  } catch (error) {
    return handleRouteError(error);
  }
}
