import { ApiError, throwIfDatabaseError } from "@/lib/api/http";
import type { AuthContext } from "@/lib/auth/context";
import { isAdminRole, requireSameOrganization } from "@/lib/auth/context";
import type { Database } from "@/lib/database.types";

export type ResourceRow =
  Database["public"]["Tables"]["resources"]["Row"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export async function getResourceForCaller(
  context: AuthContext & { profile: { org_id: string; role: string | null } },
  resourceId: string,
  options: { requireActive?: boolean; requireBookAccess?: boolean } = {},
) {
  const { data: resource, error } = await context.admin
    .from("resources")
    .select("*")
    .eq("id", resourceId)
    .maybeSingle();
  throwIfDatabaseError(error);

  if (!resource) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Resource not found.");
  }
  requireSameOrganization(context.profile.org_id, resource.org_id);

  if (options.requireActive && !resource.is_active) {
    throw new ApiError(409, "RESOURCE_INACTIVE", "This resource is inactive.");
  }

  if (
    options.requireBookAccess &&
    resource.access_group_id &&
    !isAdminRole(context.profile.role)
  ) {
    const { data: membership, error: membershipError } = await context.admin
      .from("access_group_members")
      .select("id")
      .eq("group_id", resource.access_group_id)
      .eq("user_id", context.user.id)
      .maybeSingle();
    throwIfDatabaseError(membershipError);
    if (!membership) {
      throw new ApiError(
        403,
        "RESOURCE_ACCESS_DENIED",
        "You do not belong to this resource's access group.",
      );
    }
  }

  return resource;
}

export async function getBookingForCaller(
  context: AuthContext & { profile: { org_id: string; role: string | null } },
  bookingId: string,
) {
  const { data: booking, error } = await context.admin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();
  throwIfDatabaseError(error);
  if (!booking) {
    throw new ApiError(404, "BOOKING_NOT_FOUND", "Booking not found.");
  }
  requireSameOrganization(context.profile.org_id, booking.org_id);
  return booking;
}

export function assertBookingOwnerOrAdmin(
  context: AuthContext & { profile: { role: string | null } },
  booking: BookingRow,
) {
  if (booking.user_id !== context.user.id && !isAdminRole(context.profile.role)) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Only the booking owner or an administrator can perform this action.",
    );
  }
}
