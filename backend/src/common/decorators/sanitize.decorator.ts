import { Transform } from 'class-transformer';

/**
 * Sanitize string input to prevent XSS attacks
 * Removes potentially dangerous HTML/script content
 */
export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      // Remove script tags and their content
      value = value.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        '',
      );

      value = value.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
      value = value.replace(/javascript:/gi, '');
      value = value.trim();
    }
    return value;
  });
}

/**
 * Trim whitespace from string values
 */
export function Trim() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  });
}

/**
 * Convert to lowercase
 */
export function ToLowerCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  });
}

/**
 * Sanitize email input
 */
export function SanitizeEmail() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return value;
  });
}
