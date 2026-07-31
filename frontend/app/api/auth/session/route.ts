import { handleRouteError, jsonData } from "@/lib/api/http";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return jsonData({ user: null, profile: null });

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    return jsonData({ user, profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
