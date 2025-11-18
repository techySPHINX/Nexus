/**
 * Centralized security configuration for the application
 */
export const securityConfig = {
  /**
   * CORS configuration
   */
  cors: {
    development: {
      origin: process.env.ALLOWED_ORIGIN || "https://localhost:3001",
      credentials: true,
    },
    production: {
      origin: process.env.ALLOWED_ORIGIN || "https://localhost:3001",
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 600, // 10 minutes
    },
  },

  /**
   * Helmet configuration for security headers
   */
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin resources
    crossOriginResourcePolicy: { policy: "cross-origin" },
  },

  /**
   * Rate limiting configuration
   */
  rateLimit: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10), // seconds
    limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10), // requests
  },

  /**
   * Validation pipe configuration
   */
  validation: {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: process.env.NODE_ENV === 'production', // Hide detailed errors in production
  },
};

/**
 * Get CORS configuration based on environment
 */
export const getCorsConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production'
    ? securityConfig.cors.production
    : securityConfig.cors.development;
};