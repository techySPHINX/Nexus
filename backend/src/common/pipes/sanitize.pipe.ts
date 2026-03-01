import { PipeTransform, Injectable } from '@nestjs/common';

/**
 * SanitizePipe — strips HTML/script tags from all incoming string values to
 * prevent stored XSS attacks (Issue #163).
 *
 * Usage:
 *   @Body(new SanitizePipe()) body: CreatePostDto
 *
 * Or apply globally in main.ts after ValidationPipe:
 *   app.useGlobalPipes(new SanitizePipe());
 *
 * The pipe walks the entire payload tree so nested string fields are also
 * sanitized. Non-string values (numbers, booleans, buffers) are left intact.
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  /**
   * Regex to strip HTML tags, script payloads, and common XSS vectors.
   * This is a defence-in-depth measure; the frontend should also sanitize
   * content before rendering it (see DOMPurify usage in NewsDetail.tsx).
   */
  private static readonly HTML_TAG_REGEX = /<[^>]*>/g;

  /** Dangerous event-handler attributes like `onerror=`, `onload=`. */
  private static readonly EVENT_HANDLER_REGEX = /\bon\w+\s*=/gi;

  /** javascript: URI scheme commonly used in href/src attributes. */
  private static readonly JS_URI_REGEX = /javascript\s*:/gi;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, _metadata: unknown): unknown {
    return this.sanitize(value);
  }

  private sanitize(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(
        value as Record<string, unknown>,
      )) {
        result[key] = this.sanitize(val);
      }
      return result;
    }

    // Numbers, booleans, null, undefined — pass through unchanged.
    return value;
  }

  private sanitizeString(input: string): string {
    return input
      .replace(SanitizePipe.HTML_TAG_REGEX, '')
      .replace(SanitizePipe.EVENT_HANDLER_REGEX, '')
      .replace(SanitizePipe.JS_URI_REGEX, '');
  }
}
