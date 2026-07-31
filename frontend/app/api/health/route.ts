import { handleRouteError, jsonData, throwIfDatabaseError } from "@/lib/api/http";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("organizations")
      .select("id", { head: true, count: "exact" });
    throwIfDatabaseError(error);
    return jsonData({ status: "ok", database: "reachable", timestamp: new Date().toISOString() });
  } catch (error) {
    return handleRouteError(error);
  }
}
