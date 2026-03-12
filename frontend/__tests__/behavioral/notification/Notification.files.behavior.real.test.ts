import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const checks: Array<{ file: string; mustContain: string[] }> = [
  {
    file: 'src/services/notificationService.ts',
    mustContain: ['fetchNotificationsService', 'readNotificationService'],
  },
  {
    file: 'src/contexts/NotificationContext.tsx',
    mustContain: ['NotificationProvider', 'useNotification'],
  },
  { file: 'src/pages/Notification.tsx', mustContain: ['Notification'] },
];

describe('behavior notification: key files', () => {
  it.each(checks)(
    '$file contains key domain symbols',
    ({ file, mustContain }) => {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      mustContain.forEach((token) => {
        expect(source.includes(token)).toBe(true);
      });
    }
  );
});
