import api from '@/services/api';

export interface FrontendErrorReportPayload {
  message: string;
  stack?: string;
  componentStack?: string;
  boundary: 'global' | 'route';
  route: string;
  userAgent: string;
  timestamp: string;
}

export const reportFrontendError = async (
  payload: FrontendErrorReportPayload
): Promise<void> => {
  try {
    await api.post('/monitoring/frontend-errors', payload);
  } catch (error) {
    // Never throw from error reporter; boundary fallback should remain stable.
    console.error('[ErrorReporter] Failed to report frontend error', error);
  }
};
