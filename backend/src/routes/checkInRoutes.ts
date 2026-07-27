import { Router } from 'express';
import { CheckInController } from '../controllers/checkInController.js';

const router = Router();

// Endpoint for user to confirm check-in ("I'm here")
router.post('/:bookingId', CheckInController.checkIn);

// Endpoint to fetch check-in status & grace window expiration
router.get('/status/:bookingId', CheckInController.getStatus);

// Endpoint to manually/programmatically trigger auto-release scan
router.post('/trigger/auto-release', CheckInController.triggerAutoRelease);

export default router;
