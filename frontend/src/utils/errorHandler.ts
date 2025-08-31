import axios, { AxiosError } from 'axios';

// Define a more detailed error response structure
interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ field?: string; message: string }>;
  statusCode?: number;
  path?: string;
  timestamp?: string;
}

// Custom error types for better type safety
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

// Enhanced error handler with better parsing and type safety
export const getErrorMessage = (err: unknown): string => {
  // Handle Axios errors specifically
  if (axios.isAxiosError(err)) {
    return getAxiosErrorMessage(err);
  }

  // Handle custom error types
  if (err instanceof ApiError) {
    return err.message;
  }

  if (err instanceof ValidationError) {
    return err.message;
  }

  if (err instanceof NetworkError) {
    return err.message;
  }

  // Handle standard JavaScript errors
  if (err instanceof Error) {
    return err.message;
  }

  // Handle string errors
  if (typeof err === 'string') {
    return err;
  }

  // Handle objects with message property
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const errorObj = err as { message: unknown };
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }

  // Fallback for completely unknown errors
  return 'An unexpected error occurred. Please try again.';
};

// Extract detailed error information (not just the message)
export const getErrorDetails = (
  err: unknown
): {
  message: string;
  statusCode?: number;
  fieldErrors?: Array<{ field?: string; message: string }>;
  timestamp?: string;
  path?: string;
} => {
  const defaultResponse = {
    message: getErrorMessage(err),
    statusCode: 500,
  };

  if (axios.isAxiosError(err)) {
    const response = err.response?.data as ApiErrorResponse;
    return {
      message:
        response?.message ||
        response?.error ||
        err.message ||
        'API request failed',
      statusCode: err.response?.status,
      fieldErrors: response?.errors,
      timestamp: response?.timestamp,
      path: response?.path,
    };
  }

  if (err instanceof ApiError) {
    return {
      message: err.message,
      statusCode: err.statusCode,
      ...(err.details && typeof err.details === 'object' ? err.details : {}),
    };
  }

  if (err instanceof ValidationError) {
    return {
      message: err.message,
      statusCode: 400,
      fieldErrors: err.fieldErrors,
    };
  }

  return defaultResponse;
};

// Check if error is a specific type
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

// Specific handler for Axios errors
const getAxiosErrorMessage = (err: AxiosError): string => {
  // Network errors (no response received)
  if (!err.response) {
    if (!navigator.onLine) {
      return 'You are offline. Please check your internet connection.';
    }
    if (err.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
    return 'Network error. Please check your connection and try again.';
  }

  // HTTP errors (response received with error status)
  const status = err.response.status;
  const responseData = err.response.data as ApiErrorResponse;

  // Handle different HTTP status codes with specific messages
  switch (status) {
    case 400:
      return (
        responseData?.message || 'Invalid request. Please check your input.'
      );
    case 401:
      return 'Session expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'Conflict occurred. This resource already exists.';
    case 422:
      if (responseData?.errors?.length) {
        return responseData.errors.map((e) => e.message).join(', ');
      }
      return (
        responseData?.message || 'Validation failed. Please check your input.'
      );
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return responseData?.message || responseData?.error || `Error: ${status}`;
  }
};

// Utility to create specific error types
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

// Hook-style function for consistent error handling in components
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

// Example usage in components:
/*
const { getErrorMessage, isNetworkError } = useErrorHandler();

try {
  // API call
} catch (error) {
  const message = getErrorMessage(error);
  if (isNetworkError(error)) {
    // Show offline UI
  }
  // Show error message to user
}
*/
