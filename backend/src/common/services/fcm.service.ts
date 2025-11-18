import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Message as FCMMessage } from 'firebase-admin/messaging';

/**
 * Firebase Cloud Messaging (FCM) Service for Push Notifications
 *
 * Sends push notifications to offline users when they receive messages.
 * Integrates with Firebase Cloud Messaging to deliver notifications to mobile and web clients.
 *
 * Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Go to Project Settings > Service Accounts
 * 3. Click "Generate New Private Key" and download the JSON file
 * 4. Store the JSON content in environment variable FCM_SERVICE_ACCOUNT_JSON
 * 5. Or store individual fields: FCM_PROJECT_ID, FCM_PRIVATE_KEY, FCM_CLIENT_EMAIL
 */
@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    try {
      // Try to initialize with service account JSON
      const serviceAccountJson = this.configService.get<string>(
        'FCM_SERVICE_ACCOUNT_JSON',
      );

      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.logger.log('✅ Firebase Admin initialized with service account JSON');
      } else {
        // Try individual credentials
        const projectId = this.configService.get<string>('FCM_PROJECT_ID');
        const privateKey = this.configService
          .get<string>('FCM_PRIVATE_KEY')
          ?.replace(/\\n/g, '\n'); // Handle escaped newlines
        const clientEmail = this.configService.get<string>('FCM_CLIENT_EMAIL');

        if (projectId && privateKey && clientEmail) {
          this.app = admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              privateKey,
              clientEmail,
            }),
          });
          this.logger.log('✅ Firebase Admin initialized with individual credentials');
        } else {
          this.logger.warn(
            '⚠️ Firebase Admin not initialized - FCM credentials not found. Push notifications will be disabled.',
          );
          this.logger.warn(
            '💡 Set FCM_SERVICE_ACCOUNT_JSON or (FCM_PROJECT_ID, FCM_PRIVATE_KEY, FCM_CLIENT_EMAIL) in .env',
          );
          return;
        }
      }

      this.logger.log('🔔 FCM service ready to send push notifications');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Firebase Admin:', error);
      this.logger.warn('⚠️ Push notifications will be disabled');
    }
  }

  /**
   * Sends a push notification to a device
   * @param deviceToken - The FCM device token
   * @param notification - The notification payload
   * @param data - Optional data payload
   * @returns Promise<string> - The message ID if successful
   */
  async sendNotification(
    deviceToken: string,
    notification: {
      title: string;
      body: string;
    },
    data?: Record<string, string>,
  ): Promise<string | null> {
    if (!this.app) {
      this.logger.warn('⚠️ FCM not initialized, skipping notification');
      return null;
    }

    try {
      const message: FCMMessage = {
        token: deviceToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            icon: '/icon.png',
            badge: '/badge.png',
            vibrate: [200, 100, 200],
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`✅ Notification sent successfully: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('❌ Error sending notification:', error);
      // If token is invalid, it should be removed from the database
      if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`⚠️ Invalid device token detected: ${deviceToken.substring(0, 20)}...`);
        // Return special code to indicate token should be removed
        throw new Error('INVALID_TOKEN');
      }
      return null;
    }
  }

  /**
   * Sends a notification about a new message
   * @param deviceToken - The recipient's FCM device token
   * @param senderName - The name of the message sender
   * @param messageContent - The message content (truncated if too long)
   * @param messageId - The ID of the message
   */
  async sendMessageNotification(
    deviceToken: string,
    senderName: string,
    messageContent: string,
    messageId: string,
  ): Promise<string | null> {
    const truncatedContent =
      messageContent.length > 100
        ? `${messageContent.substring(0, 100)}...`
        : messageContent;

    return this.sendNotification(
      deviceToken,
      {
        title: `New message from ${senderName}`,
        body: truncatedContent,
      },
      {
        type: 'new_message',
        messageId,
        senderName,
        clickAction: '/messages', // Frontend route to navigate to
      },
    );
  }

  /**
   * Sends a notification to multiple devices
   * @param deviceTokens - Array of FCM device tokens
   * @param notification - The notification payload
   * @param data - Optional data payload
   * @returns Promise<number> - The number of successful sends
   */
  async sendMulticastNotification(
    deviceTokens: string[],
    notification: {
      title: string;
      body: string;
    },
    data?: Record<string, string>,
  ): Promise<number> {
    if (!this.app || deviceTokens.length === 0) {
      this.logger.warn('⚠️ FCM not initialized or no device tokens provided');
      return 0;
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: data || {},
        tokens: deviceTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(
        `✅ Multicast notification: ${response.successCount}/${deviceTokens.length} sent successfully`,
      );

      // Log failed tokens
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.warn(
              `⚠️ Failed to send to token ${deviceTokens[idx].substring(0, 20)}...: ${resp.error?.message}`,
            );
          }
        });
      }

      return response.successCount;
    } catch (error) {
      this.logger.error('❌ Error sending multicast notification:', error);
      return 0;
    }
  }

  /**
   * Validates if a device token is valid
   * @param deviceToken - The FCM device token to validate
   * @returns Promise<boolean> - True if valid, false otherwise
   */
  async validateDeviceToken(deviceToken: string): Promise<boolean> {
    if (!this.app) {
      return false;
    }

    try {
      // Try to send a dry run message to validate the token
      await admin.messaging().send({
        token: deviceToken,
        data: { test: 'validation' },
      }, true); // dry run = true

      return true;
    } catch (error) {
      this.logger.warn(`⚠️ Invalid device token: ${error.message}`);
      return false;
    }
  }
}
