export enum NotificationCategory {
  CONNECTION = 'CONNECTION',
  POST = 'POST',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  EVENT = 'EVENT',
  REFERRAL = 'REFERRAL',
}

export enum NotificationType {
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  EVENT = 'EVENT',
  REFERRAL_APPLICATION = 'REFERRAL_APPLICATION',
  REFERRAL_STATUS_UPDATE = 'REFERRAL_STATUS_UPDATE',
  REFERRAL_APPLICATION_STATUS_UPDATE = 'REFERRAL_APPLICATION_STATUS_UPDATE',
}

export const categoryToTypes: Record<string, NotificationType[]> = {
  CONNECTION: [NotificationType.CONNECTION_REQUEST, NotificationType.CONNECTION_ACCEPTED],
  POST: [NotificationType.POST_LIKE, NotificationType.POST_COMMENT],
  MESSAGE: [NotificationType.MESSAGE],
  SYSTEM: [NotificationType.SYSTEM],
  EVENT: [NotificationType.EVENT],
  REFERRAL: [
    NotificationType.REFERRAL_APPLICATION,
    NotificationType.REFERRAL_STATUS_UPDATE,
    NotificationType.REFERRAL_APPLICATION_STATUS_UPDATE,
  ],
  ALL: [],
};

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: Date;
  read: boolean;
}
