import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

type NotificationInsert = {
  user_id: string;
  booking_id: string;
  type: string;
};

export async function logNotifications(
  admin: SupabaseClient<Database>,
  values: NotificationInsert[],
) {
  if (values.length === 0) return;
  const { error } = await admin.from("notifications").insert(values);
  if (error) console.error("Notification log failed", error);
}

export async function logNotification(
  admin: SupabaseClient<Database>,
  values: NotificationInsert,
) {
  await logNotifications(admin, [values]);
}

export async function logAdminNotifications(
  admin: SupabaseClient<Database>,
  values: { org_id: string; booking_id: string; type: string },
) {
  const { data: admins, error } = await admin
    .from("profiles")
    .select("id")
    .eq("org_id", values.org_id)
    .in("role", ["super_admin", "space_admin"]);

  if (error) {
    console.error("Admin notification lookup failed", error);
    return;
  }

  await logNotifications(
    admin,
    (admins ?? []).map((profile) => ({
      user_id: profile.id,
      booking_id: values.booking_id,
      type: values.type,
    })),
  );
}
