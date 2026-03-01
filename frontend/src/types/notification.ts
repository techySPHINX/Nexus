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
  POST_VOTE = 'POST_VOTE',
  POST_COMMENT = 'POST_COMMENT',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  EVENT = 'EVENT',
  REFERRAL_APPLICATION = 'REFERRAL_APPLICATION',
  REFERRAL_STATUS_UPDATE = 'REFERRAL_STATUS_UPDATE',
  REFERRAL_APPLICATION_STATUS_UPDATE = 'REFERRAL_APPLICATION_STATUS_UPDATE',
}

export const notificationTypeEmoji: Record<NotificationType, string> = {
  [NotificationType.CONNECTION_REQUEST]: '🤝',
  [NotificationType.CONNECTION_ACCEPTED]: '✅',
  [NotificationType.POST_VOTE]: '❤️',
  [NotificationType.POST_COMMENT]: '💬',
  [NotificationType.MESSAGE]: '✉️',
  [NotificationType.SYSTEM]: '⚙️',
  [NotificationType.EVENT]: '📅',
  [NotificationType.REFERRAL_APPLICATION]: '📨',
  [NotificationType.REFERRAL_STATUS_UPDATE]: '🔄',
  [NotificationType.REFERRAL_APPLICATION_STATUS_UPDATE]: '🧾',
};

export const getNotificationEmoji = (type: NotificationType): string => {
  return notificationTypeEmoji[type] ?? '🔔';
};

export const categoryToTypes: Record<string, string[]> = {
  CONNECTION: ['CONNECTION_REQUEST', 'CONNECTION_ACCEPTED'],
  POST: ['POST_VOTE', 'POST_COMMENT'],
  MESSAGE: ['MESSAGE'],
  SYSTEM: ['SYSTEM'],
  EVENT: ['EVENT'],
  REFERRAL: [
    'REFERRAL_APPLICATION',
    'REFERRAL_STATUS_UPDATE',
    'REFERRAL_APPLICATION_STATUS_UPDATE',
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

export interface pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
