import {
  ApiError,
  handleRouteError,
  jsonData,
  parseJson,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/context";
import { createOrganizationSchema } from "@/schemas/organization.schema";

export async function GET() {
  try {
    const { profile, admin } = await requireAuth();
    if (!profile.org_id) return jsonData([]);
    const { data, error } = await admin
      .from("organizations")
      .select("*")
      .eq("id", profile.org_id);
    throwIfDatabaseError(error);
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, createOrganizationSchema);
    const { user, profile, admin } = await requireAuth();
    if (profile.org_id) {
      throw new ApiError(
        409,
        "ALREADY_IN_ORGANIZATION",
        "Your profile already belongs to an organization.",
      );
    }

    const { data: organization, error } = await admin
      .from("organizations")
      .insert(input)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    if (!organization) {
      throw new ApiError(
        500,
        "ORGANIZATION_CREATION_FAILED",
        "Failed to create organization.",
      );
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ org_id: organization.id, role: "super_admin" })
      .eq("id", user.id);
    if (profileError) {
      await admin.from("organizations").delete().eq("id", organization.id);
      throw profileError;
    }

    return jsonData(organization, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
