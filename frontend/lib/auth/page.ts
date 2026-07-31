import { redirect } from "next/navigation";

import type { AppRole, Organization, Profile } from "@/lib/api/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function requirePageUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}

export async function getPageProfile() {
  const user = await requirePageUser();
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return { user, profile: existing as Profile };

  const { data: created, error } = await admin
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

  if (error) throw error;
  return { user, profile: created as Profile };
}

export async function requirePageOrganization(roles?: AppRole[]) {
  const { user, profile } = await getPageProfile();
  if (!profile.org_id) redirect("/onboarding");
  if (roles && !roles.includes((profile.role ?? "member") as AppRole)) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: organization, error } = await admin
    .from("organizations")
    .select("*")
    .eq("id", profile.org_id)
    .single();
  if (error) throw error;

  return {
    user,
    profile: profile as Profile & { org_id: string },
    organization: organization as Organization,
  };
}
