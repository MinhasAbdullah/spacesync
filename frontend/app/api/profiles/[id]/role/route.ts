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
import { updateProfileRoleSchema } from "@/schemas/profile.schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const input = await parseJson(request, updateProfileRoleSchema);
    const { profile, admin } = await requireRole(["super_admin"]);

    const { data: target, error: targetError } = await admin
      .from("profiles")
      .select("id, org_id, role")
      .eq("id", id)
      .eq("org_id", profile.org_id)
      .maybeSingle();
    throwIfDatabaseError(targetError);
    if (!target) throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found.");

    if (target.role === "super_admin" && input.role !== "super_admin") {
      const { count, error: countError } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("org_id", profile.org_id)
        .eq("role", "super_admin");
      throwIfDatabaseError(countError);
      if ((count ?? 0) <= 1) {
        throw new ApiError(
          409,
          "LAST_SUPER_ADMIN",
          "Assign another super admin before changing the final super admin's role.",
        );
      }
    }

    const { data, error } = await admin
      .from("profiles")
      .update({ role: input.role })
      .eq("id", id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
