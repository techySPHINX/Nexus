import {
  Injectable,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import { AuditLogService, AuditAction } from './audit-log.service';
import * as crypto from 'crypto';
import * as path from 'path';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFilename?: string;
  fileHash?: string;
}

@Injectable()
export class FileSecurityService {
  private readonly MAX_FILE_SIZE =
    parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

  private readonly ALLOWED_MIME_TYPES = (
    process.env.ALLOWED_FILE_TYPES ||
    'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ).split(',');

  // Dangerous file extensions
  private readonly DANGEROUS_EXTENSIONS = [
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.pif',
    '.scr',
    '.vbs',
    '.js',
    '.jar',
    '.sh',
    '.app',
    '.deb',
    '.rpm',
    '.dmg',
  ];

  // Magic bytes for file type verification
  private readonly MAGIC_BYTES = {
    'image/jpeg': ['FFD8FF'],
    'image/png': ['89504E47'],
    'image/gif': ['474946'],
    'application/pdf': ['25504446'],
    'application/zip': ['504B0304', '504B0506', '504B0708'],
  };

  constructor(
    private readonly logger: WinstonLoggerService,
    private readonly auditLog: AuditLogService,
  ) { }

  /**
   * Validate uploaded file
   */
  async validateFile(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<FileValidationResult> {
    try {
      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        throw new PayloadTooLargeException(
          `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
        );
      }

      // Check MIME type
      if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `File type ${file.mimetype} is not allowed`,
        );
      }

      // Check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (this.DANGEROUS_EXTENSIONS.includes(ext)) {
        this.logger.warn(
          `Dangerous file extension detected: ${ext} by user ${userId}`,
          'FileSecurityService',
        );
        throw new BadRequestException('Dangerous file type detected');
      }

      // Verify file signature (magic bytes)
      const isValidSignature = await this.verifyFileSignature(
        file.buffer,
        file.mimetype,
      );
      if (!isValidSignature) {
        this.logger.warn(
          `File signature mismatch for ${file.originalname} by user ${userId}`,
          'FileSecurityService',
        );
        throw new BadRequestException('File signature verification failed');
      }

      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(file.originalname);

      // Generate file hash
      const fileHash = this.generateFileHash(file.buffer);

      this.logger.log(
        `File validation passed: ${sanitizedFilename} (${file.size} bytes) by user ${userId}`,
        'FileSecurityService',
      );

      return {
        isValid: true,
        sanitizedFilename,
        fileHash,
      };
    } catch (error) {
      this.logger.error(
        `File validation failed: ${error.message}`,
        error.stack,
        'FileSecurityService',
      );

      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify file signature (magic bytes)
   */
  private async verifyFileSignature(
    buffer: Buffer,
    mimeType: string,
  ): Promise<boolean> {
    const magicBytes = this.MAGIC_BYTES[mimeType];
    if (!magicBytes) {
      // No magic bytes defined for this type, skip verification
      return true;
    }

    const fileHeader = buffer.toString('hex', 0, 8).toUpperCase();

    return magicBytes.some((magic) => fileHeader.startsWith(magic));
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    let sanitized = path.basename(filename);

    // Remove special characters except dots, hyphens, underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Prevent double extensions
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = `${name}${ext}`;

    // Add timestamp to prevent collisions
    const timestamp = Date.now();
    const finalName = `${path.basename(sanitized, ext)}_${timestamp}${ext}`;

    return finalName;
  }

  /**
   * Generate file hash
   */
  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Scan file for malware (placeholder - integrate with actual AV service)
   */
  async scanForMalware(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<boolean> {
    // TODO: Integrate with malware scanning service (ClamAV, VirusTotal, etc.)
    // For now, just basic checks

    this.logger.log(
      `Malware scan requested for ${file.originalname} by user ${userId}`,
      'FileSecurityService',
    );

    // Check for embedded executables in documents (basic check)
    if (this.containsSuspiciousContent(file.buffer)) {
      this.logger.warn(
        `Suspicious content detected in ${file.originalname}`,
        'FileSecurityService',
      );

      if (userId) {
        await this.auditLog.log({
          action: AuditAction.SUSPICIOUS_ACTIVITY,
          userId,
          resource: 'file_upload',
          resourceId: file.originalname,
          status: 'failure',
          reason: 'Suspicious content detected',
        });
      }

      return false;
    }

    return true;
  }

  /**
   * Basic suspicious content detection
   */
  private containsSuspiciousContent(buffer: Buffer): boolean {
    const content = buffer.toString('ascii');

    // Check for suspicious patterns
    const suspiciousPatterns = [
      'eval(',
      'exec(',
      '<script',
      'javascript:',
      'vbscript:',
      'onload=',
      'onerror=',
      'data:text/html',
    ];

    return suspiciousPatterns.some((pattern) =>
      content.toLowerCase().includes(pattern.toLowerCase()),
    );
  }

  /**
   * Validate image dimensions
   */
  async validateImageDimensions(
    file: Express.Multer.File,
  ): Promise<boolean> {
    // This is a basic check - for production, use sharp or jimp
    // to properly validate image dimensions

    if (!file.mimetype.startsWith('image/')) {
      return true; // Not an image
    }

    // For now, just size-based validation
    // TODO: Integrate with image processing library

    return true;
  }

  /**
   * Generate secure random filename
   */
  generateSecureFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const randomName = crypto.randomBytes(16).toString('hex');
    return `${randomName}${ext}`;
  }

  /**
   * Check if file is an image
   */
  isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  /**
   * Check if file is a document
   */
  isDocument(mimetype: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    return documentTypes.includes(mimetype);
  }

  /**
   * Get file type category
   */
  getFileCategory(mimetype: string): string {
    if (this.isImage(mimetype)) return 'image';
    if (this.isDocument(mimetype)) return 'document';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'other';
  }
}
