import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
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

describe('Referrals domain behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    localStorage.clear();
  });

  it('caches referral list between repeated getAll calls', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u1', role: 'ALUM' }));
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 'r1' }] } as never);

    const { apiService } = await import('@/services/api');

    const first = await apiService.referrals.getAll();
    const second = await apiService.referrals.getAll();

    expect(mockApi.get).toHaveBeenCalledTimes(1);
    expect(first.data).toEqual([{ id: 'r1' }]);
    expect(second.data).toEqual([{ id: 'r1' }]);
  });

  it('bypasses cache when force option is true', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u2', role: 'ALUM' }));
    mockApi.get
      .mockResolvedValueOnce({ data: [{ id: 'r1' }] } as never)
      .mockResolvedValueOnce({ data: [{ id: 'r2' }] } as never);

    const { apiService } = await import('@/services/api');

    await apiService.referrals.getAll();
    const fresh = await apiService.referrals.getAll({ force: true });

    expect(mockApi.get).toHaveBeenCalledTimes(2);
    expect(fresh.data).toEqual([{ id: 'r2' }]);
  });

  it('uses different cache buckets for different users', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: [{ id: 'user-1-data' }] } as never)
      .mockResolvedValueOnce({ data: [{ id: 'user-2-data' }] } as never);

    const { apiService } = await import('@/services/api');

    localStorage.setItem('user', JSON.stringify({ id: 'u1', role: 'ALUM' }));
    await apiService.referrals.getAll();

    localStorage.setItem('user', JSON.stringify({ id: 'u2', role: 'ADMIN' }));
    await apiService.referrals.getAll();

    expect(mockApi.get).toHaveBeenCalledTimes(2);
  });

  it('returns undefined when prefetch fails', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u9', role: 'STUDENT' }));
    mockApi.get.mockRejectedValueOnce(new Error('network fail') as never);

    const { apiService } = await import('@/services/api');

    const result = await apiService.referrals.prefetch();

    expect(result).toBeUndefined();
  });
});
