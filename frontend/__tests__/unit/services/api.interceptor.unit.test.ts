import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestUse = vi.fn();
const responseUse = vi.fn();

const mockAxiosInstance = {
  interceptors: {
    request: { use: requestUse },
    response: { use: responseUse },
  },
};

const mockAxios = {
  create: vi.fn(() => mockAxiosInstance),
  post: vi.fn(),
  isAxiosError: vi.fn((value: unknown) =>
    Boolean(
      value &&
        typeof value === 'object' &&
        (value as { isAxiosError?: boolean }).isAxiosError
    )
  ),
};

vi.mock('axios', () => ({
  default: mockAxios,
}));

describe('api request interceptor', () => {
  beforeEach(() => {
    vi.resetModules();
    requestUse.mockClear();
    responseUse.mockClear();
    mockAxios.create.mockClear();
    mockAxios.post.mockReset();
  });

  it('attaches bearer token and CSRF header', async () => {
    document.cookie = 'csrf-token=test-csrf-token';

    const { setApiAccessToken } = await import('@/services/api');
    const interceptor = requestUse.mock.calls[0][0] as (config: {
      headers?: Record<string, string>;
    }) => { headers: Record<string, string> };

    setApiAccessToken('access-token-123');
    const config = interceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer access-token-123');
    expect(config.headers['X-CSRF-Token']).toBe('test-csrf-token');
  });

  it('does not attach authorization header when token is missing', async () => {
    const { setApiAccessToken } = await import('@/services/api');
    const interceptor = requestUse.mock.calls[0][0] as (config: {
      headers?: Record<string, string>;
    }) => { headers: Record<string, string> };

    setApiAccessToken(null);
    const config = interceptor({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });
});
