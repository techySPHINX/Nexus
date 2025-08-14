import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleDriveService } from './google-drive.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service for handling file operations, specifically saving uploaded files.
 */
@Injectable()
export class FilesService {
// Defines the directory where uploaded files will be stored.
  // It resolves to a 'uploads' folder at the root of the project.
  private readonly uploadPath = path.join(__dirname, '..', '..', 'uploads');  

constructor(
    private readonly prisma: PrismaService,
    private readonly googleDriveService: GoogleDriveService,
    private readonly configService: ConfigService,
  ) {
    this.ensureUploadDirectoryExists();
  }

  /**
   * Ensures that the designated upload directory exists.
   * If it doesn't, it creates the directory recursively.
   */
  private ensureUploadDirectoryExists() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * Saves an uploaded file to the file system.
   * Generates a unique filename to prevent collisions.
   * @param file - The file object provided by Multer (Express.Multer.File).
   * @returns A promise that resolves to the relative URL of the saved file.
   * @throws {BadRequestException} If no file is provided or if saving the file fails.
   */

  async saveFile(
    file: Express.Multer.File, 
    userId: string, 
    userTokens: { access_token: string; refresh_token?: string },
    description?: string, 
    tags?: string
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    if (!userTokens?.access_token) {
      throw new UnauthorizedException('Google Drive access not authorized.');
    }

    // Create a unique filename using a timestamp and the original filename.
    const filename = `${Date.now()}-${file.originalname}`;
    // Construct the full path where the file will be saved.
    const filePath = path.join(this.uploadPath, filename);

    try {

      // Write the file buffer to the specified path.
      await fs.promises.writeFile(filePath, file.buffer);
      // Return the URL that can be used to access the file.
      return `/uploads/${filename}`;

      
      // Upload to user's Google Drive
      const driveResult = await this.googleDriveService.uploadFile(
        userTokens,
        file.originalname,
file.mimetype,
        file.buffer,
        description,
        tags
      );

      // Save file metadata to database
      const savedFile = await this.prisma.file.create({
        data: {
          filename: driveResult.fileId,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: driveResult.size,
          path: driveResult.webViewLink,
          uploadedBy: userId,
          userId: userId,
        },
      });

      return {
        id: savedFile.id,
        filename: savedFile.originalName,
        googleDriveId: driveResult.fileId,
        webViewLink: driveResult.webViewLink,
        downloadLink: driveResult.downloadLink,
        size: driveResult.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to save file: ${error.message}`);
    }
  }

  async getUserFiles(userId: string, userTokens: { access_token: string; refresh_token?: string }): Promise<any[]> {
    try {
      if (!userTokens?.access_token) {
        throw new UnauthorizedException('Google Drive access not authorized.');
      }

      // Get files from database
      const dbFiles = await this.prisma.file.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Get additional info from Google Drive
      const driveResult = await this.googleDriveService.listUserFiles(userTokens);
      
      // Merge database and drive information
      const enrichedFiles = dbFiles.map(dbFile => {
        const driveFile = driveResult.files.find(df => df.id === dbFile.filename);
        return {
          ...dbFile,
          webViewLink: driveFile?.webViewLink || dbFile.path,
          downloadLink: driveFile?.webContentLink,
          driveId: dbFile.filename,
          description: driveFile?.description || '',
          tags: driveFile?.properties?.tags || '',
        };
      });

      return enrichedFiles;
    } catch (error) {
      throw new BadRequestException(`Failed to get user files: ${error.message}`);
    }
  }

  async deleteFile(fileId: string, userId: string, userTokens: { access_token: string; refresh_token?: string }): Promise<void> {
    try {
      if (!userTokens?.access_token) {
        throw new UnauthorizedException('Google Drive access not authorized.');
      }

      // Get file info from database
      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('File not found.');
      }

      if (file.userId !== userId) {
        throw new BadRequestException('You can only delete your own files.');
      }

      // Delete from Google Drive
      await this.googleDriveService.deleteFile(userTokens, file.filename);

      // Delete from database
      await this.prisma.file.delete({
        where: { id: fileId },
      });
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async getFileInfo(fileId: string, userTokens: { access_token: string; refresh_token?: string }): Promise<any> {
    try {
      if (!userTokens?.access_token) {
        throw new UnauthorizedException('Google Drive access not authorized.');
      }

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('File not found.');
      }

      // Get additional info from Google Drive
      const driveInfo = await this.googleDriveService.getFileInfo(userTokens, file.filename);

      return {
        ...file,
        webViewLink: driveInfo.webViewLink,
        downloadLink: driveInfo.webContentLink,
        driveId: file.filename,
        description: driveInfo.description || '',
        tags: driveInfo.properties?.tags || '',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get file info: ${error.message}`);
    }
  }

  async shareFile(
    fileId: string, 
    userEmail: string, 
    userId: string, 
    userTokens: { access_token: string; refresh_token?: string }
  ): Promise<void> {
    try {
      if (!userTokens?.access_token) {
        throw new UnauthorizedException('Google Drive access not authorized.');
      }

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('File not found.');
      }

      if (file.userId !== userId) {
        throw new BadRequestException('You can only share your own files.');
      }

      // Share file in Google Drive
      await this.googleDriveService.shareFile(userTokens, file.filename, userEmail);
    } catch (error) {
      throw new BadRequestException(`Failed to share file: ${error.message}`);
    }
  }

  async getDownloadUrl(fileId: string, userTokens: { access_token: string; refresh_token?: string }): Promise<string> {
    try {
      if (!userTokens?.access_token) {
        throw new UnauthorizedException('Google Drive access not authorized.');
      }

      const file = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new BadRequestException('File not found.');
      }

      // Get download URL from Google Drive
      const driveInfo = await this.googleDriveService.getFileInfo(userTokens, file.filename);
      return driveInfo.webContentLink;
    } catch (error) {
      throw new BadRequestException(`Failed to get download URL: ${error.message}`);
    }
  }

  // Generate OAuth URL for user to authorize Google Drive access
  generateGoogleAuthUrl(): string {
    return this.googleDriveService.generateAuthUrl();
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
    return this.googleDriveService.getTokensFromCode(code);
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    return this.googleDriveService.refreshAccessToken(refreshToken);
  }

  // Validate user's tokens
  async validateTokens(userTokens: { access_token: string; refresh_token?: string }): Promise<boolean> {
    return this.googleDriveService.validateTokens(userTokens);
  }
}
