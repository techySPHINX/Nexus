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

import { deleteNotificationService } from '@/services/notificationService';

describe('NotificationService edge regressions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('must treat HTTP 204 as successful delete response', async () => {
    mockApi.delete.mockResolvedValueOnce({ status: 204, data: {} } as never);

    await expect(deleteNotificationService('n1')).resolves.toEqual({});
  });
});
