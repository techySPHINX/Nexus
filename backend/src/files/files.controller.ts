import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';

/**
 * Controller for handling file upload operations.
 */
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Uploads a single file.
   * @param file - The file to be uploaded.
   * @returns A promise that resolves to an object containing the URL of the uploaded file.
   * @throws {BadRequestException} If no file is uploaded.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    const filePath = await this.filesService.saveFile(file);
    return { url: filePath };
  }
}
