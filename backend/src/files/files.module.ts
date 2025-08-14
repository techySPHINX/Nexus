import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { GoogleDriveService } from './google-drive.service';
import { LegacyFilesService } from './legacy-files.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FilesController],
  providers: [FilesService, GoogleDriveService, LegacyFilesService],
  exports: [FilesService, GoogleDriveService, LegacyFilesService],
})
export class FilesModule {}
