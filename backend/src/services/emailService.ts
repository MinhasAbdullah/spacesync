import { getResendClient } from '../config/resend.js';
import { config, isResendConfigured } from '../config/env.js';
import {
  BookingEmailData,
  WeeklyDigestData,
  bookingConfirmationTemplate,
  reminder24hTemplate,
  reminder10mTemplate,
  autoReleaseNoticeTemplate,
  weeklyNoShowDigestTemplate,
} from '../templates/emails.js';

export class EmailService {
  private static async send(to: string, subject: string, html: string) {
    const resend = getResendClient();

    if (!isResendConfigured() || !resend) {
      console.log(`\n[MOCK EMAIL SERVICE] Resend API key not set. Simulating email send:`);
      console.log(`  To: ${to}`);
      console.log(`  From: ${config.resend.senderEmail}`);
      console.log(`  Subject: ${subject}\n`);
      return { success: true, mock: true, messageId: `mock_${Date.now()}` };
    }

    try {
      const response = await resend.emails.send({
        from: config.resend.senderEmail,
        to,
        subject,
        html,
      });
      console.log(`[Resend Email Sent] ID: ${response.data?.id} to ${to}`);
      return { success: true, mock: false, data: response.data };
    } catch (error: any) {
      console.error(`[Resend Email Error] Failed to send to ${to}:`, error?.message || error);
      return { success: false, error: error?.message || error };
    }
  }

  // 1. Send Booking Confirmation
  static async sendBookingConfirmation(data: BookingEmailData) {
    const { subject, html } = bookingConfirmationTemplate(data);
    return this.send(data.userEmail, subject, html);
  }

  // 2. Send 24-Hour Reminder
  static async send24hReminder(data: BookingEmailData) {
    const { subject, html } = reminder24hTemplate(data);
    return this.send(data.userEmail, subject, html);
  }

  // 3. Send 10-Minute Reminder + Check-in Nudge
  static async send10mReminder(data: BookingEmailData) {
    const { subject, html } = reminder10mTemplate(data);
    return this.send(data.userEmail, subject, html);
  }

  // 4. Send Auto-Release Notification
  static async sendAutoReleaseNotice(data: BookingEmailData) {
    const { subject, html } = autoReleaseNoticeTemplate(data);
    return this.send(data.userEmail, subject, html);
  }

  // 5. Send Weekly Digest to Admin
  static async sendWeeklyDigest(data: WeeklyDigestData) {
    const { subject, html } = weeklyNoShowDigestTemplate(data);
    return this.send(data.adminEmail, subject, html);
  }
}
