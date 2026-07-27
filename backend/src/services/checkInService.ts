import { getSupabaseClient } from '../config/supabase.js';
import { config } from '../config/env.js';
import { EmailService } from './emailService.js';
import { RealtimeService } from './realtimeService.js';

export interface CheckInStatusResult {
  bookingId: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  status: string;
  isEligibleForCheckIn: boolean;
  gracePeriodExpiresAt: string;
  reason?: string;
}

export class CheckInService {
  // 1. Perform Check-in for a booking
  static async performCheckIn(bookingId: string, userId?: string): Promise<{ success: boolean; message: string; data?: any }> {
    const supabase = getSupabaseClient();
    const now = new Date();

    if (!supabase) {
      // Mock Fallback implementation if DB not configured yet
      return {
        success: true,
        message: 'Check-in successful (Mock mode). Resource claimed!',
        data: {
          bookingId,
          checked_in: true,
          checked_in_at: now.toISOString(),
          status: 'confirmed',
        },
      };
    }

    // Fetch booking from Supabase
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, profiles(email, full_name), resources(name, location)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return { success: false, message: 'Booking not found.' };
    }

    if (booking.checked_in) {
      return { success: false, message: 'Booking has already been checked in.' };
    }

    if (booking.status === 'released' || booking.status === 'cancelled') {
      return { success: false, message: `Cannot check in. Booking status is '${booking.status}'.` };
    }

    const startTime = new Date(booking.start_time);
    const windowStart = new Date(startTime.getTime() - config.checkIn.graceMinutes * 60 * 1000);
    const windowEnd = new Date(startTime.getTime() + config.checkIn.graceMinutes * 60 * 1000);

    if (now < windowStart) {
      return {
        success: false,
        message: `Too early to check in. Check-in opens 10 minutes before start time (${windowStart.toLocaleTimeString()}).`,
      };
    }

    if (now > windowEnd) {
      return {
        success: false,
        message: `Check-in period expired. The booking was eligible until ${windowEnd.toLocaleTimeString()}.`,
      };
    }

    // Perform check-in update
    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update({
        checked_in: true,
        checked_in_at: now.toISOString(),
        status: 'confirmed',
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      return { success: false, message: `Database update failed: ${updateError.message}` };
    }

    // Broadcast Realtime Update
    RealtimeService.broadcastBookingChange('UPDATE', updated);

    return {
      success: true,
      message: 'Check-in successful! Enjoy your space.',
      data: updated,
    };
  }

  // 2. Get detailed Check-in status & countdown
  static async getCheckInStatus(bookingId: string): Promise<CheckInStatusResult> {
    const supabase = getSupabaseClient();
    const now = new Date();

    if (!supabase) {
      const mockStart = new Date(now.getTime() - 2 * 60 * 1000);
      const mockExpires = new Date(mockStart.getTime() + config.checkIn.graceMinutes * 60 * 1000);
      return {
        bookingId,
        checkedIn: false,
        status: 'approved',
        isEligibleForCheckIn: true,
        gracePeriodExpiresAt: mockExpires.toISOString(),
      };
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    const startTime = new Date(booking.start_time);
    const windowStart = new Date(startTime.getTime() - config.checkIn.graceMinutes * 60 * 1000);
    const windowEnd = new Date(startTime.getTime() + config.checkIn.graceMinutes * 60 * 1000);

    const isEligible =
      !booking.checked_in &&
      booking.status === 'approved' &&
      now >= windowStart &&
      now <= windowEnd;

    let reason = undefined;
    if (booking.checked_in) reason = 'Already checked in';
    else if (booking.status === 'released') reason = 'Auto-released due to no-show';
    else if (now < windowStart) reason = 'Check-in window has not opened yet';
    else if (now > windowEnd) reason = 'Check-in grace period expired';

    return {
      bookingId: booking.id,
      checkedIn: !!booking.checked_in,
      checkedInAt: booking.checked_in_at,
      status: booking.status || 'approved',
      isEligibleForCheckIn: isEligible,
      gracePeriodExpiresAt: windowEnd.toISOString(),
      reason,
    };
  }

  // 3. Process Auto-release for No-shows
  static async processAutoReleases(): Promise<{ releasedCount: number; releasedIds: string[] }> {
    const supabase = getSupabaseClient();
    const now = new Date();
    const releasedIds: string[] = [];

    if (!supabase) {
      console.log('[Auto-Release Engine] Mock mode scan complete. 0 bookings pending auto-release.');
      return { releasedCount: 0, releasedIds: [] };
    }

    // Calculate cutoff: start_time older than graceMinutes ago
    const cutoffTime = new Date(now.getTime() - config.checkIn.graceMinutes * 60 * 1000).toISOString();

    const { data: expiredBookings, error } = await supabase
      .from('bookings')
      .select('*, profiles(email, full_name), resources(name, location)')
      .eq('checked_in', false)
      .eq('auto_released', false)
      .eq('status', 'approved')
      .lt('start_time', cutoffTime);

    if (error || !expiredBookings || expiredBookings.length === 0) {
      return { releasedCount: 0, releasedIds: [] };
    }

    for (const booking of expiredBookings) {
      const { error: updateErr } = await supabase
        .from('bookings')
        .update({
          status: 'released',
          auto_released: true,
        })
        .eq('id', booking.id);

      if (!updateErr) {
        releasedIds.push(booking.id);

        // Broadcast realtime slot release so other users see slot as open
        RealtimeService.broadcastBookingChange('DELETE', { ...booking, status: 'released' });

        // Send email notice to user
        const userEmail = booking.profiles?.email;
        const userName = booking.profiles?.full_name || 'Member';
        if (userEmail) {
          await EmailService.sendAutoReleaseNotice({
            bookingId: booking.id,
            title: booking.title,
            userName,
            userEmail,
            resourceName: booking.resources?.name || 'Resource',
            startTime: booking.start_time,
            endTime: booking.end_time,
          });
        }
      }
    }

    console.log(`[Auto-Release Engine] Released ${releasedIds.length} no-show bookings:`, releasedIds);
    return { releasedCount: releasedIds.length, releasedIds };
  }
}
