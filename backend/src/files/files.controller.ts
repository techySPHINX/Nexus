import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Get, Delete, Param, Body, Req, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUser('sub') userId: string,
    @Body() body: { description?: string; tags?: string; access_token: string; refresh_token?: string },
  ) {
    const userTokens = {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    };

    return this.filesService.saveFile(file, userId, userTokens, body.description, body.tags);
  }

  @Get()
  async getUserFiles(
    @GetCurrentUser('sub') userId: string,
    @Query('access_token') accessToken: string,
    @Query('refresh_token') refreshToken?: string,
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
    @GetCurrentUser('sub') userId: string,
    @Query('access_token') accessToken: string,
    @Query('refresh_token') refreshToken?: string,
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
    @Body() body: { access_token: string; refresh_token?: string },
  ) {
    const userTokens = {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    };

    await this.filesService.deleteFile(id, userId, userTokens);
    return { message: 'File deleted successfully' };
  }

  @Post(':id/share')
  async shareFile(
    @Param('id') id: string,
    @Body() body: { userEmail: string; access_token: string; refresh_token?: string },
    @GetCurrentUser('sub') userId: string,
  ) {
    const userTokens = {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    };

    await this.filesService.shareFile(id, body.userEmail, userId, userTokens);
    return { message: 'File shared successfully' };
  }

  @Get(':id/download')
  async getDownloadUrl(
    @Param('id') id: string, 
    @GetCurrentUser('sub') userId: string,
    @Query('access_token') accessToken: string,
    @Query('refresh_token') refreshToken?: string,
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
    const tokens = await this.filesService.refreshAccessToken(body.refresh_token);
    return tokens;
  }

  @Post('auth/google/validate')
  async validateGoogleTokens(@Body() body: { access_token: string; refresh_token?: string }) {
    const isValid = await this.filesService.validateTokens(body);
    return { isValid };
  }
}
