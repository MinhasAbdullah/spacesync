import { Resend } from 'resend';
import { config, isResendConfigured } from './env.js';

let resendClient: Resend | null = null;

export const getResendClient = (): Resend | null => {
  if (!isResendConfigured()) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(config.resend.apiKey);
  }
  return resendClient;
};
