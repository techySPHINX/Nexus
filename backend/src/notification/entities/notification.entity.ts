export class Notification {
  id: string;
  userId: string;
  message: string;
  type?: string;
  read: boolean;
  createdAt: Date;
}
