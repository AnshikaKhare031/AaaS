import dotenv from 'dotenv';
dotenv.config();

export const settings = {
  PROJECT_NAME: process.env.PROJECT_NAME || 'AaaS Handmade Crochet API',
  VERSION: '1.0.0',
  API_PREFIX: '/api',
  ENVIRONMENT: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',

  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long',
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Security & Admin Session Strategy
  ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY || 'aaas_crochet_admin_secret_2026',
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || 'admin@aaascrochet.com').trim().toLowerCase(),
  ADMIN_SECRET: process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin123',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin123',
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || '',
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'super-secret-admin-session-hmac-sha256-key-32chars',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'orders@aaascrochet.com',

  // Payment Gateway (Razorpay)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder_key_32chars_aaas',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_key_32chars_aaas',

  // Server
  PORT: parseInt(process.env.PORT || '8000', 10),
  CORS_ORIGINS: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ],
};
