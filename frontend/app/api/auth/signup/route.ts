import { handleRouteError, jsonData, parseJson } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/schemas/auth.schema";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, signupSchema);
    const supabase = await createClient();
    const origin = new URL(request.url).origin;
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.full_name },
        emailRedirectTo: `${origin}/auth/confirm?next=/api-test`,
      },
    });
    if (error) throw error;

    return jsonData(
      {
        user: data.user,
        session: data.session,
        email_confirmation_required: !data.session,
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
