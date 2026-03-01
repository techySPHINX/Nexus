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

describe('edge referrals apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    localStorage.clear();
  });

  it('falls back to anon cache bucket when user json is malformed', async () => {
    localStorage.setItem('user', '{bad-json');
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 'r1' }] } as never);

    const { apiService } = await import('@/services/api');

    await apiService.referrals.getAll();
    await apiService.referrals.getAll();

    expect(mockApi.get).toHaveBeenCalledTimes(1);
  });

  it('request interceptor injects bearer token when available', async () => {
    localStorage.setItem('token', 'token-abc');
    await import('@/services/api');

    const requestUseCall = mockApi.interceptors.request.use.mock.calls[0];
    const requestInterceptor = requestUseCall?.[0] as
      | ((config: { headers: Record<string, string> }) => {
          headers: Record<string, string>;
        })
      | undefined;

    expect(typeof requestInterceptor).toBe('function');

    const config = { headers: {} as Record<string, string> };
    const updated = requestInterceptor!(config);

    expect(updated.headers.Authorization).toBe('Bearer token-abc');
  });

  it('response interceptor clears auth state on 401', async () => {
    localStorage.setItem('token', 'token-401');
    localStorage.setItem('user', JSON.stringify({ id: 'u1', role: 'ALUM' }));

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });

    await import('@/services/api');

    const responseUseCall = mockApi.interceptors.response.use.mock.calls[0];
    const errorInterceptor = responseUseCall?.[1] as
      | ((error: { response?: { status?: number } }) => Promise<never>)
      | undefined;

    expect(typeof errorInterceptor).toBe('function');

    await expect(
      errorInterceptor!({ response: { status: 401 } })
    ).rejects.toEqual({ response: { status: 401 } });

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});
