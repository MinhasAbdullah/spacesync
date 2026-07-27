import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  supabase: {
    url: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    senderEmail: process.env.SENDER_EMAIL || 'onboarding@resend.dev',
  },
  checkIn: {
    graceMinutes: parseInt(process.env.CHECKIN_GRACE_MINUTES || '10', 10),
  },
};

export const isSupabaseConfigured = () => {
  return (
    config.supabase.url !== 'https://placeholder.supabase.co' &&
    config.supabase.serviceRoleKey !== '' &&
    config.supabase.serviceRoleKey !== 'your_supabase_service_role_key_here'
  );
};

export const isResendConfigured = () => {
  return (
    config.resend.apiKey !== '' &&
    config.resend.apiKey !== 're_your_resend_api_key_here'
  );
};
