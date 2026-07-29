import {
  ApiError,
  handleRouteError,
  jsonData,
  parseJson,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireRole } from "@/lib/auth/context";
import { idParamSchema } from "@/schemas/common.schema";
import { addOrganizationMemberSchema } from "@/schemas/organization.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const { profile, admin } = await requireRole(["super_admin", "space_admin"]);
    if (id !== profile.org_id) {
      throw new ApiError(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");
    }
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("org_id", id)
      .order("created_at", { ascending: true });
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
    const input = await parseJson(request, addOrganizationMemberSchema);
    const { profile, admin } = await requireRole(["super_admin"]);
    if (id !== profile.org_id) {
      throw new ApiError(404, "ORGANIZATION_NOT_FOUND", "Organization not found.");
    }

    const { data: target, error: targetError } = await admin
      .from("profiles")
      .select("*")
      .ilike("email", input.email)
      .maybeSingle();
    throwIfDatabaseError(targetError);
    if (!target) {
      throw new ApiError(
        404,
        "PROFILE_NOT_FOUND",
        "No signed-up profile was found for that email address.",
      );
    }
    if (target.org_id && target.org_id !== id) {
      throw new ApiError(
        409,
        "PROFILE_ALREADY_ASSIGNED",
        "This profile already belongs to another organization.",
      );
    }

    const { data, error } = await admin
      .from("profiles")
      .update({ org_id: id, role: input.role })
      .eq("id", target.id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    return jsonData(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
