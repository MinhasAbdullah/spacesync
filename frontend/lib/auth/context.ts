import type { User } from "@supabase/supabase-js";

import { ApiError, throwIfDatabaseError } from "@/lib/api/http";
import type { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AppRole = "super_admin" | "space_admin" | "member";

export type AuthContext = {
  user: User;
  profile: Profile;
  admin: ReturnType<typeof createAdminClient>;
};

export async function requireAuth(): Promise<AuthContext> {
  const authClient = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    throw new ApiError(401, "UNAUTHENTICATED", "You must be logged in.");
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  throwIfDatabaseError(profileError);

  if (!profile) {
    const { data: created, error: createError } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email ?? null,
        full_name:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null,
        avatar_url:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null,
        role: "member",
      })
      .select("*")
      .single();
    throwIfDatabaseError(createError);
    if (!created) {
      throw new ApiError(500, "INTERNAL_ERROR", "Failed to create profile.");
    }
    return { user, profile: created, admin };
  }

  return { user, profile, admin };
}

export async function requireOrganization() {
  const context = await requireAuth();
  if (!context.profile.org_id) {
    throw new ApiError(
      409,
      "ORGANIZATION_REQUIRED",
      "Create or join an organization before using this endpoint.",
    );
  }
  return context as AuthContext & { profile: Profile & { org_id: string } };
}

export async function requireRole(roles: AppRole[]) {
  const context = await requireOrganization();
  if (!roles.includes((context.profile.role ?? "member") as AppRole)) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      `This action requires one of these roles: ${roles.join(", ")}.`,
    );
  }
  return context;
}

export function isAdminRole(role: string | null) {
  return role === "super_admin" || role === "space_admin";
}

export function requireSameOrganization(
  callerOrgId: string,
  targetOrgId: string | null,
) {
  if (!targetOrgId || targetOrgId !== callerOrgId) {
    throw new ApiError(404, "NOT_FOUND", "The requested record was not found.");
  }
}
