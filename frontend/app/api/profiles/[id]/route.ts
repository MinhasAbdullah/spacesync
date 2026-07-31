import {
  ApiError,
  handleRouteError,
  jsonData,
  parseParams,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireOrganization } from "@/lib/auth/context";
import { idParamSchema } from "@/schemas/common.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await parseParams(params, idParamSchema);
    const { profile, admin } = await requireOrganization();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .eq("org_id", profile.org_id)
      .maybeSingle();
    throwIfDatabaseError(error);
    if (!data) throw new ApiError(404, "PROFILE_NOT_FOUND", "Profile not found.");
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
