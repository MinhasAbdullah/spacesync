import {
  handleRouteError,
  jsonData,
  parseQuery,
  throwIfDatabaseError,
} from "@/lib/api/http";
import { requireRole } from "@/lib/auth/context";
import { analyticsQuerySchema } from "@/schemas/analytics.schema";

export async function GET(request: Request) {
  try {
    const query = parseQuery(request, analyticsQuerySchema);
    const { profile, admin } = await requireRole(["super_admin", "space_admin"]);
    const from = new Date(query.from);
    const to = new Date(query.to);
    const windowHours = (to.getTime() - from.getTime()) / 3_600_000;

    const [{ data: resources, error: resourceError }, { data: bookings, error: bookingError }] =
      await Promise.all([
        admin
          .from("resources")
          .select("*")
          .eq("org_id", profile.org_id)
          .order("name"),
        admin
          .from("bookings")
          .select("*")
          .eq("org_id", profile.org_id)
          .lt("start_time", to.toISOString())
          .gt("end_time", from.toISOString())
          .not("status", "in", "(cancelled,denied)"),
      ]);
    throwIfDatabaseError(resourceError);
    throwIfDatabaseError(bookingError);

    const activeBookings = bookings ?? [];
    const resourceMetrics = (resources ?? []).map((resource) => {
      const resourceBookings = activeBookings.filter(
        (booking) => booking.resource_id === resource.id,
      );
      const bookedHours = resourceBookings.reduce((sum, booking) => {
        const clippedStart = Math.max(
          from.getTime(),
          new Date(booking.start_time).getTime(),
        );
        const clippedEnd = Math.min(to.getTime(), new Date(booking.end_time).getTime());
        return sum + Math.max(0, clippedEnd - clippedStart) / 3_600_000;
      }, 0);
      const noShows = resourceBookings.filter(
        (booking) => booking.status === "no_show",
      ).length;
      return {
        resource,
        booking_count: resourceBookings.length,
        booked_hours: Number(bookedHours.toFixed(2)),
        utilization_percent: Number(
          Math.min(100, (bookedHours / windowHours) * 100).toFixed(2),
        ),
        no_show_count: noShows,
        no_show_rate_percent:
          resourceBookings.length === 0
            ? 0
            : Number(((noShows / resourceBookings.length) * 100).toFixed(2)),
      };
    });

    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      booking_count: activeBookings.filter(
        (booking) => new Date(booking.start_time).getUTCHours() === hour,
      ).length,
    }));

    const bookerCounts = new Map<string, number>();
    for (const booking of activeBookings) {
      if (booking.user_id) {
        bookerCounts.set(
          booking.user_id,
          (bookerCounts.get(booking.user_id) ?? 0) + 1,
        );
      }
    }
    const activeBookerIds = [...bookerCounts.keys()];
    const { data: bookerProfiles, error: profilesError } = activeBookerIds.length
      ? await admin
          .from("profiles")
          .select("id, full_name, email")
          .in("id", activeBookerIds)
      : { data: [], error: null };
    throwIfDatabaseError(profilesError);

    const mostActiveBookers = (bookerProfiles ?? [])
      .map((booker) => ({
        ...booker,
        booking_count: bookerCounts.get(booker.id) ?? 0,
      }))
      .sort((a, b) => b.booking_count - a.booking_count)
      .slice(0, 10);

    return jsonData({
      range: { from: from.toISOString(), to: to.toISOString() },
      resources: resourceMetrics,
      peak_hours_utc: peakHours,
      most_active_bookers: mostActiveBookers,
      totals: {
        resources: resources?.length ?? 0,
        bookings: activeBookings.length,
        no_shows: activeBookings.filter((booking) => booking.status === "no_show")
          .length,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
