import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileSecurityService } from './file-security.service';
import { GoogleDriveService } from './google-drive.service';
import { LegacyFilesService } from './legacy-files.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    FileSecurityService,
    GoogleDriveService,
    LegacyFilesService,
  ],
  exports: [
    FilesService,
    FileSecurityService,
    GoogleDriveService,
    LegacyFilesService,
  ],
})
export class FilesModule {}
