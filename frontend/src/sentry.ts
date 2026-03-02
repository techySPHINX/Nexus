/**
 * Sentry initialisation for the Nexus React frontend.
 *
 * This file must be imported ONCE, as early as possible in the application
 * entry-point (index.tsx), before any React component tree is rendered.
 *
 * Configuration is driven by Vite build-time environment variables:
 *   VITE_SENTRY_DSN   — Sentry project DSN.  When absent, Sentry is disabled
 *                       (safe default for local development).
 *   VITE_SENTRY_ENV   — Override the environment label (defaults to
 *                       import.meta.env.MODE, i.e. "development" or
 *                       "production").
 *
 * Set these in .env.production (or as Vercel / Docker build-args).
 */

import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      (import.meta.env.VITE_SENTRY_ENV as string | undefined) ??
      import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,

    // Capture 100 % of sessions in dev; tune via VITE_SENTRY_TRACES_RATE in prod.
    tracesSampleRate: parseFloat(
      (import.meta.env.VITE_SENTRY_TRACES_RATE as string | undefined) ?? '0.1'
    ),

    integrations: [
      // Automatically trace route changes in React Router v6 / client-side nav.
      Sentry.browserTracingIntegration(),
      // Capture a video replay of user interactions around each error.
      Sentry.replayIntegration({
        maskAllText: true, // PII protection: mask all text in replays
        blockAllMedia: true, // PII protection: block embedded images/video
      }),
    ],

    // Replay 5 % of normal sessions, 100 % of error sessions.
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  });
}
