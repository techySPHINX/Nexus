import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Service for handling file operations, specifically saving uploaded files.
 */
@Injectable()
export class FilesService {
  // Defines the directory where uploaded files will be stored.
  // It resolves to a 'uploads' folder at the root of the project.
  private readonly uploadPath = path.join(__dirname, '..', '..', 'uploads');

  constructor() {
    // Ensures the upload directory exists when the service is initialized.
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
  async saveFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided.');
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
    } catch {
      // Catch any errors during file writing and throw a BadRequestException.
      throw new BadRequestException('Failed to save file.');
    }
  }
}
