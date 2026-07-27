import { Router } from 'express';
import { RealtimeController } from '../controllers/realtimeController.js';

const router = Router();

// Endpoint for live availability snapshot
router.get('/live-availability', RealtimeController.getLiveAvailability);

// Endpoint for realtime subscription configuration info
router.get('/config', RealtimeController.getRealtimeConfig);

export default router;
