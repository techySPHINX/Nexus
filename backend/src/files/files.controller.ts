import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Get,
  Delete,
  Param,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';
import { FileUploadValidatorService } from './file-upload-validator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';

/**
 * Controller for handling file upload operations.
 *
 * Google Drive OAuth tokens are accepted via custom HTTP headers
 * (X-Google-Access-Token / X-Google-Refresh-Token) rather than
 * URL query parameters to avoid token exposure in server logs,
 * browser history, and Referer headers (Issue #157).
 *
 * Every upload passes through FileSecurityService (size limit 10 MB,
 * MIME-type allowlist, dangerous-extension check) (Issue #158).
 */
@ApiTags('files')
@ApiBearerAuth('JWT')
@ApiHeader({
  name: 'X-Google-Access-Token',
  description: 'Google Drive OAuth2 access token',
  required: false,
})
@ApiHeader({
  name: 'X-Google-Refresh-Token',
  description: 'Google Drive OAuth2 refresh token',
  required: false,
})
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly fileSecurityService: FileUploadValidatorService,
  ) {}

  /**
   * Uploads a single file.
   * - Multer enforces MAX_FILE_SIZE_BYTES and the MIME allowlist.
   * - FileSecurityService performs additional checks (extension, deep MIME).
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: FileUploadValidatorService.MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (FileUploadValidatorService.ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(null, true);
        } else {
          // Use BadRequestException so Nest maps it to a 400 response (not 500).
          cb(
            new BadRequestException(
              `File type '${file.mimetype}' is not allowed.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUser('sub') userId: string,
    @Headers('x-google-access-token') accessToken: string,
    @Headers('x-google-refresh-token') refreshToken: string | undefined,
    @Body() body: { description?: string; tags?: string },
  ) {
    this.fileSecurityService.validateFile(file);
    const userTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    return this.filesService.saveFile(
      file,
      userId,
      userTokens,
      body.description,
      body.tags,
    );
  }

  @Get()
  async getUserFiles(
    @GetCurrentUser('sub') userId: string,
    @Headers('x-google-access-token') accessToken: string,
    @Headers('x-google-refresh-token') refreshToken: string | undefined,
  ) {
    const userTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    return this.filesService.getUserFiles(userId, userTokens);
  }

  @Get(':id')
  async getFileInfo(
    @Param('id') id: string,
    @GetCurrentUser('sub') _userId: string,
    @Headers('x-google-access-token') accessToken: string,
    @Headers('x-google-refresh-token') refreshToken: string | undefined,
  ) {
    const userTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    return this.filesService.getFileInfo(id, userTokens);
  }

  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Headers('x-google-access-token') accessToken: string,
    @Headers('x-google-refresh-token') refreshToken: string | undefined,
  ) {
    const userTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    await this.filesService.deleteFile(id, userId, userTokens);
    return { message: 'File deleted successfully' };
  }

  @Post(':id/share')
  async shareFile(
    @Param('id') id: string,
    @Body() body: { userEmail: string },
    @GetCurrentUser('sub') userId: string,
    @Headers('x-google-access-token') accessToken: string,
    @Headers('x-google-refresh-token') refreshToken: string | undefined,
  ) {
    const userTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    await this.filesService.shareFile(id, body.userEmail, userId, userTokens);
    return { message: 'File shared successfully' };
  }

  @Get(':id/download')
  async getDownloadUrl(
    @Param('id') id: string,
    @GetCurrentUser('sub') _userId: string,
    @Headers('x-google-access-token') accessToken: string,
    @Headers('x-google-refresh-token') refreshToken: string | undefined,
  ) {
    const userTokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    const downloadUrl = await this.filesService.getDownloadUrl(id, userTokens);
    return { downloadUrl };
  }

  // Google OAuth endpoints
  @Get('auth/google')
  async getGoogleAuthUrl() {
    const authUrl = this.filesService.generateGoogleAuthUrl();
    return { authUrl };
  }

  @Post('auth/google/callback')
  async handleGoogleCallback(@Body() body: { code: string }) {
    const tokens = await this.filesService.getTokensFromCode(body.code);
    return tokens;
  }

  @Post('auth/google/refresh')
  async refreshGoogleToken(@Body() body: { refresh_token: string }) {
    const tokens = await this.filesService.refreshAccessToken(
      body.refresh_token,
    );
    return tokens;
  }

  @Post('auth/google/validate')
  async validateGoogleTokens(
    @Headers('x-google-access-token') accessToken: string,
    @Headers('x-google-refresh-token') refreshToken: string | undefined,
  ) {
    const isValid = await this.filesService.validateTokens({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return { isValid };
  }
}
