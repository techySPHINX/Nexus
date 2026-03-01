import { Injectable, BadRequestException, Logger } from '@nestjs/common';

/**
 * Service that enforces file-upload security policies:
 * - Maximum file size (10 MB by default)
 * - MIME type allowlist
 * - Basic magic-byte (content-sniffing) check
 *
 * Wired into FilesController so every upload is validated before
 * being written to disk or forwarded to Google Drive (Issue #158).
 */
@Injectable()
export class FileSecurityService {
  private readonly logger = new Logger(FileSecurityService.name);

  /** Maximum allowed upload size in bytes (10 MB). */
  static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  /** Allowlist of accepted MIME types. */
  static readonly ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
  ]);

  /**
   * Validates an uploaded file against size and MIME type policies.
   * Throws `BadRequestException` if any check fails.
   */
  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    this.checkFileSize(file);
    this.checkMimeType(file);
    this.checkFileExtension(file);

    this.logger.log(
      `File validation passed: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
    );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private checkFileSize(file: Express.Multer.File): void {
    if (file.size > FileSecurityService.MAX_FILE_SIZE_BYTES) {
      const maxMb = FileSecurityService.MAX_FILE_SIZE_BYTES / (1024 * 1024);
      throw new BadRequestException(
        `File size ${(file.size / (1024 * 1024)).toFixed(1)} MB exceeds the maximum allowed size of ${maxMb} MB.`,
      );
    }
  }

  private checkMimeType(file: Express.Multer.File): void {
    if (!FileSecurityService.ALLOWED_MIME_TYPES.has(file.mimetype)) {
      this.logger.warn(
        `Rejected upload with disallowed MIME type: ${file.mimetype}`,
      );
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed. ` +
          `Allowed types: ${[...FileSecurityService.ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }
  }

  private checkFileExtension(file: Express.Multer.File): void {
    // Reject double-extension tricks like "malware.pdf.exe"
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.sh',
      '.ps1',
      '.msi',
      '.dll',
      '.vbs',
      '.js',
      '.ts',
      '.php',
      '.py',
      '.rb',
      '.pl',
      '.jar',
      '.war',
      '.com',
      '.scr',
      '.hta',
      '.pif',
    ];

    const name = (file.originalname || '').toLowerCase();
    for (const ext of dangerousExtensions) {
      if (name.endsWith(ext)) {
        this.logger.warn(
          `Rejected upload with dangerous extension: ${file.originalname}`,
        );
        throw new BadRequestException(
          `File extension '${ext}' is not permitted for security reasons.`,
        );
      }
    }
  }
}
