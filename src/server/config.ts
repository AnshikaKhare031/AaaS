import dotenv from 'dotenv';
dotenv.config();

export const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.ENVIRONMENT === 'production' ||
  process.env.VERCEL_ENV === 'production';

export const settings = {
  PROJECT_NAME: process.env.PROJECT_NAME || 'AaaS Handmade Crochet API',
  VERSION: '1.0.0',
  API_PREFIX: '/api',
  ENVIRONMENT: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',

  // Production Frontend Origin (used for CORS allowlist)
  FRONTEND_URL: (process.env.FRONTEND_URL || '').trim(),

  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL || (!isProduction ? process.env.VITE_SUPABASE_URL || '' : ''),
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || (!isProduction ? process.env.VITE_SUPABASE_ANON_KEY || '' : ''),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || (!isProduction ? 'super-secret-jwt-token-with-at-least-32-characters-long' : ''),
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Security & Admin Session Strategy
  ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY || (!isProduction ? 'aaas_crochet_admin_secret_2026' : ''),
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || (!isProduction ? 'admin@aaascrochet.com' : '')).trim().toLowerCase(),
  ADMIN_SECRET: process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || (!isProduction ? 'admin123' : ''),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || (!isProduction ? 'admin123' : ''),
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || '',
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || (!isProduction ? 'super-secret-admin-session-hmac-sha256-key-32chars' : ''),
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'orders@aaascrochet.com',

  // Payment Gateway (Razorpay)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || (!isProduction ? (process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key') : ''),
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || (!isProduction ? 'secret_placeholder_key_32chars_aaas' : ''),
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || (!isProduction ? 'webhook_secret_key_32chars_aaas' : ''),

  // Server
  PORT: parseInt(process.env.PORT || '8000', 10),
  CORS_ORIGINS: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim().replace(/\/$/, '')] : []),
  ],
};

/**
 * Validates that all required security-sensitive variables are properly configured in production.
 * Strictly fails fast without leaking secret values.
 */
export function validateProductionConfig(): void {
  if (!isProduction) {
    return;
  }

  const requiredVariables: Array<{ name: string; value: string | undefined }> = [
    { name: 'SUPABASE_URL', value: settings.SUPABASE_URL },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: settings.SUPABASE_SERVICE_ROLE_KEY },
    { name: 'SUPABASE_JWT_SECRET', value: settings.SUPABASE_JWT_SECRET },
    { name: 'ADMIN_EMAIL', value: settings.ADMIN_EMAIL },
    { name: 'ADMIN_PASSWORD', value: settings.ADMIN_PASSWORD },
    { name: 'ADMIN_JWT_SECRET', value: settings.ADMIN_JWT_SECRET },
    { name: 'RAZORPAY_KEY_ID', value: settings.RAZORPAY_KEY_ID },
    { name: 'RAZORPAY_KEY_SECRET', value: settings.RAZORPAY_KEY_SECRET },
    { name: 'RAZORPAY_WEBHOOK_SECRET', value: settings.RAZORPAY_WEBHOOK_SECRET },
  ];

  const missing = requiredVariables
    .filter((item) => !item.value || item.value.trim() === '')
    .map((item) => item.name);

  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required production environment variables: [${missing.join(', ')}]. ` +
      `Production fail-fast triggered. Insecure defaults are strictly disabled in production.`
    );
  }

  const insecurePlaceholders = [
    'admin123',
    'super-secret-jwt-token-with-at-least-32-characters-long',
    'super-secret-admin-session-hmac-sha256-key-32chars',
    'secret_placeholder_key_32chars_aaas',
    'webhook_secret_key_32chars_aaas',
    'rzp_test_placeholder_key',
  ];

  const insecure = requiredVariables
    .filter((item) => item.value && insecurePlaceholders.includes(item.value.trim()))
    .map((item) => item.name);

  if (insecure.length > 0) {
    throw new Error(
      `FATAL: Insecure default credentials detected for production environment variables: [${insecure.join(', ')}]. ` +
      `You must configure genuine production secrets in your deployment settings.`
    );
  }
}

// Automatically enforce production configuration validation on startup
if (isProduction) {
  validateProductionConfig();
}
