import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
    },
  },
}));

vi.mock('axios', () => {
  const axiosMock = {
    create: vi.fn(() => mockApi),
    isAxiosError: vi.fn(() => false),
  };
  return {
    default: axiosMock,
    ...axiosMock,
  };
});

import {
  fetchNotificationsService,
  readNotificationService,
  unreadNotificationService,
  deleteNotificationService,
} from '@/services/notificationService';

describe('Notification domain behavior', () => {
  beforeEach(() => vi.clearAllMocks());

  it('merges notifications page and unread count responses', async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: {
          notifications: [{ id: 'n1' }],
          pagination: { page: 1, total: 1 },
        },
      } as never)
      .mockResolvedValueOnce({ data: { unreadCount: 4 } } as never);

    const result = await fetchNotificationsService(1, 10, 'ALL');

    expect(mockApi.get).toHaveBeenNthCalledWith(1, '/notifications', {
      params: { page: 1, limit: 10 },
    });
    expect(mockApi.get).toHaveBeenNthCalledWith(
      2,
      '/notifications/count/unread'
    );
    expect(result.unreadCount).toBe(4);
    expect(result.notification).toEqual([{ id: 'n1' }]);
  });

  it('includes type filter when category is not ALL', async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: { notifications: [], pagination: { page: 1, total: 0 } },
      } as never)
      .mockResolvedValueOnce({ data: { unreadCount: 0 } } as never);

    await fetchNotificationsService(2, 20, 'MESSAGE');

    expect(mockApi.get).toHaveBeenNthCalledWith(1, '/notifications', {
      params: { page: 2, limit: 20, type: 'MESSAGE' },
    });
  });

  it('calls mark read/unread endpoints', async () => {
    mockApi.patch.mockResolvedValue({ data: {} } as never);

    await readNotificationService('n7');
    await unreadNotificationService('n7');

    expect(mockApi.patch).toHaveBeenNthCalledWith(1, '/notifications/n7/read');
    expect(mockApi.patch).toHaveBeenNthCalledWith(
      2,
      '/notifications/n7/unread'
    );
  });

  it('throws when delete notification returns non-2xx status', async () => {
    mockApi.delete.mockResolvedValueOnce({ status: 500, data: {} } as never);

    await expect(deleteNotificationService('n3')).rejects.toThrow(
      'Failed to delete notification'
    );
  });
});
