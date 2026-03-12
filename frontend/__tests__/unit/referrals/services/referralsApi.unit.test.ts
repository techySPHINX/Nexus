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

describe('unit referrals apiService contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    localStorage.clear();
  });

  it('creates referral with provided payload', async () => {
    const { apiService } = await import('@/services/api');
    const payload = { company: 'Nexus', jobTitle: 'SDE Intern' };

    await apiService.referrals.create(payload);

    expect(mockApi.post).toHaveBeenCalledWith('/referral', payload);
  });

  it('fetches referral by id', async () => {
    const { apiService } = await import('@/services/api');

    await apiService.referrals.getById('ref-11');

    expect(mockApi.get).toHaveBeenCalledWith('/referral/ref-11');
  });

  it('updates referral with id and payload', async () => {
    const { apiService } = await import('@/services/api');
    const payload = { location: 'Bangalore' };

    await apiService.referrals.update('ref-11', payload);

    expect(mockApi.put).toHaveBeenCalledWith('/referral/ref-11', payload);
  });

  it('deletes referral by id', async () => {
    const { apiService } = await import('@/services/api');

    await apiService.referrals.delete('ref-22');

    expect(mockApi.delete).toHaveBeenCalledWith('/referral/ref-22');
  });

  it('submits referral application with normalized body', async () => {
    const { apiService } = await import('@/services/api');

    await apiService.referrals.apply({
      referralId: 'ref-31',
      resumeUrl: 'https://drive.google.com/file/d/abc',
      coverLetter: 'Interested in this role',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/referral/apply', {
      referralId: 'ref-31',
      resumeUrl: 'https://drive.google.com/file/d/abc',
      coverLetter: 'Interested in this role',
    });
  });

  it('updates application status payload shape', async () => {
    const { apiService } = await import('@/services/api');

    await apiService.referrals.updateApplicationStatus('app-41', 'REVIEWED');

    expect(mockApi.put).toHaveBeenCalledWith(
      '/referral/applications/app-41/status',
      {
        status: 'REVIEWED',
      }
    );
  });
});
