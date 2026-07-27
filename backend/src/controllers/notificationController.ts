import { Request, Response } from 'express';
import { EmailService } from '../services/emailService.js';
import { config } from '../config/env.js';

export class NotificationController {
  // POST /api/notifications/send-confirmation
  static async sendConfirmation(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId, title, userName, userEmail, resourceName, location, startTime, endTime } = req.body;

      if (!bookingId || !userEmail || !title || !startTime || !endTime) {
        res.status(400).json({ success: false, error: 'Missing required parameters: bookingId, userEmail, title, startTime, endTime' });
        return;
      }

      const result = await EmailService.sendBookingConfirmation({
        bookingId,
        title,
        userName: userName || 'Member',
        userEmail,
        resourceName: resourceName || 'Resource',
        location,
        startTime,
        endTime,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST /api/notifications/send-reminder
  static async sendReminder(req: Request, res: Response): Promise<void> {
    try {
      const { type, bookingId, title, userName, userEmail, resourceName, startTime, endTime } = req.body;

      if (!bookingId || !userEmail || !title || !startTime) {
        res.status(400).json({ success: false, error: 'Missing required parameters: bookingId, userEmail, title, startTime' });
        return;
      }

      let result;
      if (type === '24h') {
        result = await EmailService.send24hReminder({
          bookingId,
          title,
          userName: userName || 'Member',
          userEmail,
          resourceName: resourceName || 'Resource',
          startTime,
          endTime: endTime || startTime,
        });
      } else {
        const checkInUrl = `${config.frontendUrl}/check-in?bookingId=${bookingId}`;
        result = await EmailService.send10mReminder({
          bookingId,
          title,
          userName: userName || 'Member',
          userEmail,
          resourceName: resourceName || 'Resource',
          startTime,
          endTime: endTime || startTime,
          checkInUrl,
        });
      }

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST /api/notifications/send-weekly-digest
  static async sendWeeklyDigest(req: Request, res: Response): Promise<void> {
    try {
      const { adminName, adminEmail, totalBookings, totalNoShows, noShowRate, mostUnusedResource } = req.body;

      if (!adminEmail) {
        res.status(400).json({ success: false, error: 'adminEmail parameter is required.' });
        return;
      }

      const result = await EmailService.sendWeeklyDigest({
        adminName: adminName || 'Admin',
        adminEmail,
        totalBookings: totalBookings || 0,
        totalNoShows: totalNoShows || 0,
        noShowRate: noShowRate || '0%',
        mostUnusedResource: mostUnusedResource || 'None',
      });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
