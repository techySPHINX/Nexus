import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LegacyFilesService {
  private readonly uploadPath = path.join(__dirname, '..', '..', 'uploads');

  constructor(private readonly prisma: PrismaService) {
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, userId: string, description?: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    try {
      const filename = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(this.uploadPath, filename);

      // Save file to local storage
      await fs.promises.writeFile(filePath, file.buffer);

      // Save file metadata to database
      await this.prisma.file.create({
        data: {
          filename: filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: `/uploads/${filename}`,
          uploadedBy: userId,
          userId: userId,
        },
      });

      return `/uploads/${filename}`;
    } catch (error) {
      throw new BadRequestException(`Failed to save file: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(__dirname, '..', '..', filePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
