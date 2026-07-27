import { Request, Response } from 'express';
import { CheckInService } from '../services/checkInService.js';

export class CheckInController {
  // POST /api/check-in/:bookingId
  static async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const rawBookingId = req.params.bookingId;
      const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;
      const { userId } = req.body || {};

      if (!bookingId) {
        res.status(400).json({ success: false, error: 'bookingId parameter is required.' });
        return;
      }

      const result = await CheckInService.performCheckIn(bookingId, userId);
      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  // GET /api/check-in/status/:bookingId
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const rawBookingId = req.params.bookingId;
      const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;

      if (!bookingId) {
        res.status(400).json({ success: false, error: 'bookingId parameter is required.' });
        return;
      }

      const status = await CheckInService.getCheckInStatus(bookingId);
      res.status(200).json({ success: true, data: status });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message || 'Booking status not found.' });
    }
  }

  // POST /api/check-in/auto-release (Manual/Trigger endpoint)
  static async triggerAutoRelease(req: Request, res: Response): Promise<void> {
    try {
      const result = await CheckInService.processAutoReleases();
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Auto-release processing failed' });
    }
  }
}
