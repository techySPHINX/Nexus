import axios from 'axios';

// error handler for API calls
// error type unknown checked for axios and Error instances
export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || 'An error occurred';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unknown error occurred';
};
