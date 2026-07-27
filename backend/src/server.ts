import express, { Request, Response } from 'express';
import cors from 'cors';
import { config, isSupabaseConfigured, isResendConfigured } from './config/env.js';
import checkInRoutes from './routes/checkInRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import realtimeRoutes from './routes/realtimeRoutes.js';
import { CronScheduler } from './services/cronService.js';

const app = express();

// Middleware
app.use(cors({ origin: config.frontendUrl || '*' }));
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'SpaceSync Backend API',
    version: '1.0.0',
    integrations: {
      supabase: isSupabaseConfigured() ? 'configured' : 'mock_mode',
      resend: isResendConfigured() ? 'configured' : 'mock_mode',
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/check-in', checkInRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/realtime', realtimeRoutes);

// Start Cron Scheduler for automated reminders & auto-releases
CronScheduler.start();

// Start Server
app.listen(config.port, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 SpaceSync Backend Service running on port ${config.port}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`⚡ Supabase Integration: ${isSupabaseConfigured() ? '✅ Live' : '⚠️  Mock Mode (Provide credentials in .env)'}`);
  console.log(`✉️  Resend Email Service: ${isResendConfigured() ? '✅ Live' : '⚠️  Mock Mode (Provide API key in .env)'}`);
  console.log(`==================================================\n`);
});

export default app;
