/**
 * Environment variable validation schema using Joi.
 *
 * The application will **fail fast** at startup with a clear error message if
 * any required environment variable is absent or has an invalid value.
 * This prevents cryptic runtime failures minutes after a bad deploy.
 *
 * Required variables:   DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, REDIS_URL
 * Optional with defaults: PORT, NODE_ENV, FRONTEND_URL, JWT_ACCESS_EXPIRY, …
 */
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // ─── Application ───────────────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),

  PORT: Joi.number().integer().min(1).max(65535).default(3000),

  FRONTEND_URL: Joi.string().uri().default('http://localhost:3001'),

  // ─── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: Joi.string()
    .required()
    .description(
      'PostgreSQL connection string, e.g. postgresql://user:pass@host:5432/db',
    ),

  // ─── JWT / Authentication ──────────────────────────────────────────────────
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('Primary JWT signing secret — must be at least 32 characters'),

  JWT_ACCESS_SECRET: Joi.string().min(32).optional(),

  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description(
      'JWT refresh-token signing secret — must be at least 32 characters',
    ),

  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),

  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  // ─── Redis ─────────────────────────────────────────────────────────────────
  REDIS_URL: Joi.string()
    .required()
    .description('Redis connection URL, e.g. redis://localhost:6379'),

  REDIS_TTL: Joi.number().integer().positive().default(3600),

  // ─── Security / Rate-Limiting ──────────────────────────────────────────────
  THROTTLE_TTL: Joi.number().integer().positive().default(60),

  THROTTLE_LIMIT: Joi.number().integer().positive().default(100),

  AUTH_RATE_LIMIT_TTL: Joi.number().integer().positive().default(60),

  AUTH_RATE_LIMIT_MAX: Joi.number().integer().positive().default(5),

  // ─── Email (optional) ──────────────────────────────────────────────────────
  SENDGRID_API_KEY: Joi.string().optional(),

  SENDGRID_FROM_EMAIL: Joi.string().email().optional(),

  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().integer().optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().optional(),

  // ─── File Uploads (optional) ───────────────────────────────────────────────
  MAX_FILE_SIZE: Joi.number().integer().positive().default(10485760),

  ALLOWED_FILE_TYPES: Joi.string().optional(),

  // ─── AWS / S3 (optional) ───────────────────────────────────────────────────
  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  AWS_S3_BUCKET: Joi.string().optional(),

  // ─── Firebase / FCM (optional) ─────────────────────────────────────────────
  FCM_SERVICE_ACCOUNT_JSON: Joi.string().optional(),
  FCM_PROJECT_ID: Joi.string().optional(),
  FCM_PRIVATE_KEY: Joi.string().optional(),
  FCM_CLIENT_EMAIL: Joi.string().email().optional(),

  // ─── Google Drive (optional) ───────────────────────────────────────────────
  GOOGLE_DRIVE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_DRIVE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_DRIVE_REDIRECT_URI: Joi.string().uri().optional(),
  GOOGLE_DRIVE_FOLDER_ID: Joi.string().optional(),

  // ─── Monitoring / Observability (optional) ─────────────────────────────────
  SENTRY_DSN: Joi.string().uri().optional(),
  METRICS_ENABLED: Joi.boolean().default(false),
  METRICS_PORT: Joi.number().integer().optional(),

  // ─── WebSocket / Socket.IO (optional) ─────────────────────────────────────
  SOCKET_IO_CORS_ORIGIN: Joi.string().optional(),
  SOCKET_IO_PING_TIMEOUT: Joi.number().integer().positive().default(60000),
  SOCKET_IO_PING_INTERVAL: Joi.number().integer().positive().default(25000),
  RATE_LIMIT_MESSAGES_PER_MINUTE: Joi.number()
    .integer()
    .positive()
    .default(100),
}).options({
  // Allow any extra keys (e.g. CI-injected vars) without throwing
  allowUnknown: true,
  // Stop validation on the first error for clear messaging
  abortEarly: false,
});
