import { getSupabaseClient } from '../config/supabase.js';

export interface CalendarSlot {
  id: string;
  resourceId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  checkedIn: boolean;
}

export class RealtimeService {
  // 1. Get Live Calendar Availability snapshot for resources
  static async getLiveAvailability(resourceId?: string, date?: string) {
    const supabase = getSupabaseClient();
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

    if (!supabase) {
      // Mock Fallback response for dev testing
      return {
        isRealtimeActive: false,
        resourceId: resourceId || 'all',
        date: targetDate.toISOString().split('T')[0],
        activeBookings: [
          {
            id: 'mock-b1',
            resourceId: resourceId || 'res-room-101',
            title: 'Team Sync Meeting',
            startTime: new Date(Date.now() + 3600000).toISOString(),
            endTime: new Date(Date.now() + 7200000).toISOString(),
            status: 'approved',
            checkedIn: false,
          },
        ],
      };
    }

    let query = supabase
      .from('bookings')
      .select('id, resource_id, title, start_time, end_time, status, checked_in')
      .gte('start_time', startOfDay)
      .lte('end_time', endOfDay)
      .neq('status', 'cancelled')
      .neq('status', 'released');

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    const { data: bookings, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch live availability: ${error.message}`);
    }

    return {
      isRealtimeActive: true,
      resourceId: resourceId || 'all',
      date: targetDate.toISOString().split('T')[0],
      activeBookings: (bookings || []).map((b) => ({
        id: b.id,
        resourceId: b.resource_id,
        title: b.title,
        startTime: b.start_time,
        endTime: b.end_time,
        status: b.status || 'approved',
        checkedIn: !!b.checked_in,
      })),
    };
  }

  // 2. Helper to broadcast Realtime Slot Change across Supabase channels
  static broadcastBookingChange(eventType: 'INSERT' | 'UPDATE' | 'DELETE', booking: any) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log(`[Realtime Broadcast] Mock mode: Broadcasted '${eventType}' event for booking ID ${booking.id}`);
      return;
    }

    const channel = supabase.channel('calendar-updates');
    channel.send({
      type: 'broadcast',
      event: 'slot_change',
      payload: {
        eventType,
        bookingId: booking.id,
        resourceId: booking.resource_id,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status,
        timestamp: new Date().toISOString(),
      },
    });
    console.log(`[Realtime Broadcast] Dispatched '${eventType}' for room ${booking.resource_id}`);
  }
}
