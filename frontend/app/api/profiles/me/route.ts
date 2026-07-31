import {
  handleRouteError,
  jsonData,
  parseJson,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireAuth } from "@/lib/auth/context";
import { updateMyProfileSchema } from "@/schemas/profile.schema";

export async function GET() {
  try {
    const { profile } = await requireAuth();
    return jsonData(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const input = await parseJson(request, updateMyProfileSchema);
    const { user, admin } = await requireAuth();
    const { data, error } = await admin
      .from("profiles")
      .update(input)
      .eq("id", user.id)
      .select("*")
      .single();
    throwIfDatabaseError(error);
    return jsonData(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
