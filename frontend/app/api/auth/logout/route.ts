import { handleRouteError, jsonMessage } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return jsonMessage("Signed out successfully.");
  } catch (error) {
    return handleRouteError(error);
  }
}
