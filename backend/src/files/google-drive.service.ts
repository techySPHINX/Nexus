import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);

  constructor(private configService: ConfigService) {}

  // Create OAuth2 client for a specific user
  private createOAuth2Client(userTokens: { access_token: string; refresh_token?: string }) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI')
    );

    oauth2Client.setCredentials({
      access_token: userTokens.access_token,
      refresh_token: userTokens.refresh_token,
    });

    return oauth2Client;
  }

  // Generate Google OAuth URL for user to authorize
  generateAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI')
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent' // Force consent screen to get refresh token
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI')
    );

    try {
      const { tokens } = await oauth2Client.getToken(code);
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
      };
    } catch (error) {
      this.logger.error('Error getting tokens from code:', error);
      throw new Error('Failed to get access tokens from Google');
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI')
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      return {
        access_token: credentials.access_token,
        expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
      };
    } catch (error) {
      this.logger.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Upload file to user's Google Drive
  async uploadFile(
    userTokens: { access_token: string; refresh_token?: string },
    fileName: string,
    mimeType: string,
    fileBuffer: Buffer,
    description?: string,
    tags?: string
  ): Promise<{ fileId: string; webViewLink: string; downloadLink: string; size: number }> {
    try {
      const oauth2Client = this.createOAuth2Client(userTokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Create file metadata
      const fileMetadata = {
        name: fileName,
        description: description || '',
        properties: {
          tags: tags || '',
          uploadedVia: 'Nexus Platform'
        }
      };

      // Upload file
      const media = {
        mimeType,
        body: fileBuffer,
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id,name,size,webViewLink,webContentLink,createdTime',
      });

      this.logger.log(`File uploaded to user's Google Drive: ${file.data.id}`);

      return {
        fileId: file.data.id,
        webViewLink: file.data.webViewLink,
        downloadLink: file.data.webContentLink,
        size: typeof file.data.size === 'number' ? file.data.size : 0
      };
    } catch (error) {
      this.logger.error('Error uploading file to Google Drive:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }

  // Get file info from user's Google Drive
  async getFileInfo(
    userTokens: { access_token: string; refresh_token?: string },
    fileId: string
  ): Promise<any> {
    try {
      const oauth2Client = this.createOAuth2Client(userTokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const file = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,createdTime,webViewLink,webContentLink,description,properties'
      });

      return file.data;
    } catch (error) {
      this.logger.error('Error getting file info from Google Drive:', error);
      throw new Error('Failed to get file information');
    }
  }

  // List files from user's Google Drive
  async listUserFiles(
    userTokens: { access_token: string; refresh_token?: string },
    pageSize: number = 50,
    pageToken?: string
  ): Promise<{ files: any[]; nextPageToken?: string }> {
    try {
      const oauth2Client = this.createOAuth2Client(userTokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const response = await drive.files.list({
        pageSize,
        pageToken,
        fields: 'nextPageToken, files(id,name,mimeType,size,createdTime,webViewLink,webContentLink,description,properties)',
        orderBy: 'createdTime desc',
        q: "trashed=false and 'me' in owners" // Only files owned by the user
      });

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      this.logger.error('Error listing user files from Google Drive:', error);
      throw new Error('Failed to list user files');
    }
  }

  // Delete file from user's Google Drive
  async deleteFile(
    userTokens: { access_token: string; refresh_token?: string },
    fileId: string
  ): Promise<void> {
    try {
      const oauth2Client = this.createOAuth2Client(userTokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      await drive.files.delete({ fileId });
      this.logger.log(`File deleted from user's Google Drive: ${fileId}`);
    } catch (error) {
      this.logger.error('Error deleting file from Google Drive:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  // Share file with another user
  async shareFile(
    userTokens: { access_token: string; refresh_token?: string },
    fileId: string,
    userEmail: string,
    role: 'reader' | 'writer' | 'commenter' = 'reader'
  ): Promise<void> {
    try {
      const oauth2Client = this.createOAuth2Client(userTokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      await drive.permissions.create({
        fileId,
        requestBody: {
          role,
          type: 'user',
          emailAddress: userEmail,
        },
      });

      this.logger.log(`File ${fileId} shared with ${userEmail} as ${role}`);
    } catch (error) {
      this.logger.error('Error sharing file:', error);
      throw new Error('Failed to share file');
    }
  }

  // Get user profile information
  async getUserProfile(
    userTokens: { access_token: string; refresh_token?: string }
  ): Promise<{ email: string; name: string; picture?: string }> {
    try {
      const oauth2Client = this.createOAuth2Client(userTokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

      const profile = await oauth2.userinfo.get();
      
      return {
        email: profile.data.email,
        name: profile.data.name,
        picture: profile.data.picture
      };
    } catch (error) {
      this.logger.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  // Check if user's tokens are still valid
  async validateTokens(
    userTokens: { access_token: string; refresh_token?: string }
  ): Promise<boolean> {
    try {
      const oauth2Client = this.createOAuth2Client(userTokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Try to make a simple API call to test tokens
      await drive.about.get({ fields: 'user' });
      return true;
    } catch (error) {
      this.logger.error('Tokens validation failed:', error);
      return false;
    }
  }
}
