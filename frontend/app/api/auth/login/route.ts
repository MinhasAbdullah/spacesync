import { handleRouteError, jsonData, parseJson } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/schemas/auth.schema";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, loginSchema);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(input);
    if (error) throw error;
    return jsonData({ user: data.user, session: data.session });
  } catch (error) {
    return handleRouteError(error);
  }
}
