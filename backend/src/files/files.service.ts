import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FilesService {
  private readonly uploadPath = path.join(__dirname, '..', '..', 'uploads');

  constructor() {
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists() {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadPath, filename);

    try {
      await fs.promises.writeFile(filePath, file.buffer);
      return `/uploads/${filename}`;
    } catch {
      throw new BadRequestException('Failed to save file.');
    }
  }
}
