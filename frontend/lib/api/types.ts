import type { User } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AccessGroup = Database["public"]["Tables"]["access_groups"]["Row"];
export type AccessGroupMember = Database["public"]["Tables"]["access_group_members"]["Row"];
export type Resource = Database["public"]["Tables"]["resources"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AppRole = "super_admin" | "space_admin" | "member";

export type ApiEnvelope<T> = {
  data: T;
  meta?: {
    count?: number;
    limit?: number;
    offset?: number;
  };
};

export type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type SessionData = {
  user: User | null;
  profile: Profile | null;
};

export type AvailabilityData = {
  resource: Resource;
  requested_slot: {
    start_time: string;
    end_time: string;
    available: boolean;
  };
  blocking_bookings: Booking[];
  next_available_slots: Array<{
    start_time: string;
    end_time: string;
  }>;
};

export type AnalyticsData = {
  range: { from: string; to: string };
  resources: Array<{
    resource: Resource;
    booking_count: number;
    booked_hours: number;
    utilization_percent: number;
    no_show_count: number;
    no_show_rate_percent: number;
  }>;
  peak_hours_utc: Array<{ hour: number; booking_count: number }>;
  most_active_bookers: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    booking_count: number;
  }>;
  totals: {
    resources: number;
    bookings: number;
    no_shows: number;
  };
};

export type AccessGroupMemberWithProfile = AccessGroupMember & {
  profiles: Profile | null;
};
