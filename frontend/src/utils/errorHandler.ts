import axios, { AxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ field?: string; message: string }>;
  statusCode?: number;
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Always prefer backend message/error/errors
const extractBackendMessage = (data?: ApiErrorResponse): string | undefined => {
  if (!data) return undefined;
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (data.errors?.length) return data.errors.map((e) => e.message).join(', ');
  return undefined;
};

export const getErrorMessage = (err: unknown): string => {
  const dbMsg = "Can't reach database server";

  const containsDbMsg = (e: unknown): boolean => {
    if (typeof e === 'string') return e.includes(dbMsg);
    if (e instanceof Error && typeof e.message === 'string')
      return e.message.includes(dbMsg);
    if (axios.isAxiosError(e)) {
      if (typeof e.message === 'string' && e.message.includes(dbMsg))
        return true;
      const respData = e.response?.data as ApiErrorResponse | undefined;
      const backend = extractBackendMessage(respData);
      if (backend && backend.includes(dbMsg)) return true;
    }
    if (typeof e === 'object' && e !== null) {
      const obj = e as { message?: unknown; details?: unknown };
      if (typeof obj.message === 'string' && obj.message.includes(dbMsg))
        return true;
      if (obj.details && typeof obj.details === 'object') {
        const backend = extractBackendMessage(obj.details as ApiErrorResponse);
        if (backend && backend.includes(dbMsg)) return true;
      }
    }
    return false;
  };

  if (containsDbMsg(err)) return dbMsg;

  if (axios.isAxiosError(err)) {
    const responseData = err.response?.data as ApiErrorResponse | undefined;
    const backendMsg = extractBackendMessage(responseData);
    if (backendMsg) return backendMsg;
    return getAxiosErrorMessage(err);
  }

  if (
    err instanceof ApiError &&
    err.details &&
    typeof err.details === 'object'
  ) {
    const backendMsg = extractBackendMessage(err.details as ApiErrorResponse);
    if (backendMsg) return backendMsg;
    return err.message;
  }

  if (err instanceof ValidationError && err.fieldErrors?.length) {
    return err.fieldErrors.map((e) => e.message).join(', ') || err.message;
  }

  if (err instanceof ValidationError) return err.message;
  if (err instanceof NetworkError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;

  if (typeof err === 'object' && err !== null && 'message' in err) {
    const errorObj = err as { message: unknown };
    if (typeof errorObj.message === 'string') return errorObj.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

export const getErrorDetails = (
  err: unknown
): {
  message: string;
  statusCode?: number;
  fieldErrors?: Array<{ field?: string; message: string }>;
  timestamp?: string;
  path?: string;
} => {
  if (axios.isAxiosError(err)) {
    const response = err.response?.data as ApiErrorResponse;
    return {
      message:
        extractBackendMessage(response) || err.message || 'API request failed',
      statusCode: err.response?.status,
      fieldErrors: response?.errors,
      timestamp: response?.timestamp,
      path: response?.path,
    };
  }

  if (
    err instanceof ApiError &&
    err.details &&
    typeof err.details === 'object'
  ) {
    const details = err.details as ApiErrorResponse;
    return {
      message: extractBackendMessage(details) || err.message,
      statusCode: err.statusCode,
      fieldErrors: details.errors,
      timestamp: details.timestamp,
      path: details.path,
    };
  }

  if (err instanceof ValidationError) {
    return {
      message: err.fieldErrors?.map((e) => e.message).join(', ') || err.message,
      statusCode: 400,
      fieldErrors: err.fieldErrors,
    };
  }

  return {
    message: getErrorMessage(err),
    statusCode: 500,
  };
};

export const isNetworkError = (err: unknown): boolean => {
  if (axios.isAxiosError(err)) {
    return !err.response && err.request && !navigator.onLine;
  }
  return err instanceof NetworkError;
};

export const isValidationError = (err: unknown): err is ValidationError => {
  return err instanceof ValidationError;
};

export const isApiError = (err: unknown): err is ApiError => {
  return err instanceof ApiError;
};

const getAxiosErrorMessage = (err: AxiosError): string => {
  if (!err.response) {
    if (!navigator.onLine)
      return 'You are offline. Please check your internet connection.';
    if (err.code === 'ECONNABORTED')
      return 'Request timeout. Please try again.';
    return 'Network error. Please check your connection and try again.';
  }

  const status = err.response.status;
  const responseData = err.response.data as ApiErrorResponse;
  const backendMsg = extractBackendMessage(responseData);

  if (backendMsg) return backendMsg;

  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'Conflict occurred. This resource already exists.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return `Error: ${status}`;
  }
};

export const createApiError = (
  message: string,
  statusCode?: number,
  details?: unknown
): ApiError => {
  return new ApiError(message, statusCode, details);
};

export const createValidationError = (
  message: string,
  fieldErrors?: Array<{ field?: string; message: string }>
): ValidationError => {
  return new ValidationError(message, fieldErrors);
};

export const createNetworkError = (message?: string): NetworkError => {
  return new NetworkError(message);
};

export const useErrorHandler = () => {
  return {
    getErrorMessage,
    getErrorDetails,
    isNetworkError,
    isValidationError,
    isApiError,
    createApiError,
    createValidationError,
    createNetworkError,
  };
};
