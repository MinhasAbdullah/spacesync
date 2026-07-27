import { Request, Response } from 'express';
import { RealtimeService } from '../services/realtimeService.js';
import { config } from '../config/env.js';

export class RealtimeController {
  // GET /api/realtime/live-availability
  static async getLiveAvailability(req: Request, res: Response): Promise<void> {
    try {
      const resourceId = req.query.resourceId as string | undefined;
      const date = req.query.date as string | undefined;

      const data = await RealtimeService.getLiveAvailability(resourceId, date);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/realtime/config
  static async getRealtimeConfig(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        supabaseUrl: config.supabase.url,
        channelName: 'calendar-updates',
        eventName: 'slot_change',
        table: 'bookings',
        description: 'Subscribe to Supabase Realtime channel `calendar-updates` for live slot updates within ~1 second.',
      },
    });
  }
}
