import cron from 'node-cron';
import { getSupabaseClient } from '../config/supabase.js';
import { config } from '../config/env.js';
import { EmailService } from './emailService.js';
import { CheckInService } from './checkInService.js';

export class CronScheduler {
  private static isRunning = false;

  static start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('⏰ [Cron Scheduler] Initialized background worker service.');

    // 1. Minutely Job: Process 24h reminders, 10m reminders, and auto-releases
    cron.schedule('* * * * *', async () => {
      try {
        await CronScheduler.process24hReminders();
        await CronScheduler.process10mReminders();
        await CheckInService.processAutoReleases();
      } catch (err) {
        console.error('Error running minutely background cron:', err);
      }
    });

    // 2. Weekly Job: Send No-Show Digest to Admins (Mondays at 09:00 AM)
    cron.schedule('0 9 * * 1', async () => {
      try {
        await CronScheduler.processWeeklyDigest();
      } catch (err) {
        console.error('Error running weekly digest cron:', err);
      }
    });
  }

  // Process 24-Hour Reminder emails
  static async process24hReminders() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const now = Date.now();
    const rangeStart = new Date(now + (24 * 60 - 10) * 60 * 1000).toISOString();
    const rangeEnd = new Date(now + (24 * 60 + 10) * 60 * 1000).toISOString();

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, profiles(email, full_name), resources(name, location)')
      .gte('start_time', rangeStart)
      .lte('start_time', rangeEnd)
      .eq('reminder_24h_sent', false)
      .eq('status', 'approved');

    if (!bookings || bookings.length === 0) return;

    for (const b of bookings) {
      if (b.profiles?.email) {
        const res = await EmailService.send24hReminder({
          bookingId: b.id,
          title: b.title,
          userName: b.profiles.full_name || 'User',
          userEmail: b.profiles.email,
          resourceName: b.resources?.name || 'Resource',
          startTime: b.start_time,
          endTime: b.end_time,
        });

        if (res.success) {
          await supabase
            .from('bookings')
            .update({ reminder_24h_sent: true })
            .eq('id', b.id);
        }
      }
    }
  }

  // Process 10-Minute Reminder + Check-in Nudge emails
  static async process10mReminders() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const now = Date.now();
    const rangeStart = new Date(now + 8 * 60 * 1000).toISOString();
    const rangeEnd = new Date(now + 12 * 60 * 1000).toISOString();

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, profiles(email, full_name), resources(name, location)')
      .gte('start_time', rangeStart)
      .lte('start_time', rangeEnd)
      .eq('reminder_10m_sent', false)
      .eq('checked_in', false)
      .eq('status', 'approved');

    if (!bookings || bookings.length === 0) return;

    for (const b of bookings) {
      if (b.profiles?.email) {
        const checkInUrl = `${config.frontendUrl}/check-in?bookingId=${b.id}`;
        const res = await EmailService.send10mReminder({
          bookingId: b.id,
          title: b.title,
          userName: b.profiles.full_name || 'User',
          userEmail: b.profiles.email,
          resourceName: b.resources?.name || 'Resource',
          startTime: b.start_time,
          endTime: b.end_time,
          checkInUrl,
        });

        if (res.success) {
          await supabase
            .from('bookings')
            .update({ reminder_10m_sent: true })
            .eq('id', b.id);
        }
      }
    }
  }

  // Process Weekly Admin Digest
  static async processWeeklyDigest() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Fetch Super Admins and Space Admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('email, full_name')
      .in('role', ['super_admin', 'space_admin']);

    if (!admins || admins.length === 0) return;

    // Aggregate statistics from past 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo);

    const { count: totalNoShows } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo)
      .eq('auto_released', true);

    const totalB = totalBookings || 0;
    const totalNS = totalNoShows || 0;
    const rate = totalB > 0 ? `${((totalNS / totalB) * 100).toFixed(1)}%` : '0%';

    for (const admin of admins) {
      if (admin.email) {
        await EmailService.sendWeeklyDigest({
          adminName: admin.full_name || 'Admin',
          adminEmail: admin.email,
          totalBookings: totalB,
          totalNoShows: totalNS,
          noShowRate: rate,
          mostUnusedResource: 'Conference Room B',
        });
      }
    }
  }
}
