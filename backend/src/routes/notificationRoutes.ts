import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';

const router = Router();

// Trigger booking confirmation email
router.post('/send-confirmation', NotificationController.sendConfirmation);

// Trigger 24h or 10m reminder email
router.post('/send-reminder', NotificationController.sendReminder);

// Trigger weekly admin digest email
router.post('/send-weekly-digest', NotificationController.sendWeeklyDigest);

export default router;
