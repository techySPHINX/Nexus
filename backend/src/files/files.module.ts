import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
// Renamed from FileSecurityService to FileUploadValidatorService to avoid
// collision with the richer common/services/file-security.service.ts
// (Copilot recommendation from PR #210).
import { FileUploadValidatorService } from './file-upload-validator.service';
import { GoogleDriveService } from './google-drive.service';
import { LegacyFilesService } from './legacy-files.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    FileUploadValidatorService,
    GoogleDriveService,
    LegacyFilesService,
  ],
  exports: [
    FilesService,
    FileUploadValidatorService,
    GoogleDriveService,
    LegacyFilesService,
  ],
})
export class FilesModule {}
