import axios from 'axios';

// utils/errorHandler.ts
export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || 'An error occurred';
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unknown error occurred';
};
