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

import { fetchNotificationsService } from '@/services/notificationService';

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
});
