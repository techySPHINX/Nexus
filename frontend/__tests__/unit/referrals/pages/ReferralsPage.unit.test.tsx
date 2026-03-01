import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockUserState,
  mockGetAll,
  mockGetAnalytics,
  mockGetMyApplications,
  mockCreate,
  mockApply,
  mockUpdateApplicationStatus,
  mockGetApplications,
  mockDelete,
  mockApprove,
  mockReject,
  mockSocketOn,
  mockSocketDisconnect,
} = vi.hoisted(() => ({
  mockUserState: {
    user: null as {
      id: string;
      role: string;
      name: string;
      email: string;
    } | null,
  },
  mockGetAll: vi.fn(),
  mockGetAnalytics: vi.fn(),
  mockGetMyApplications: vi.fn(),
  mockCreate: vi.fn(),
  mockApply: vi.fn(),
  mockUpdateApplicationStatus: vi.fn(),
  mockGetApplications: vi.fn(),
  mockDelete: vi.fn(),
  mockApprove: vi.fn(),
  mockReject: vi.fn(),
  mockSocketOn: vi.fn(),
  mockSocketDisconnect: vi.fn(),
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: mockSocketOn,
    disconnect: mockSocketDisconnect,
  })),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUserState.user }),
}));

vi.mock('@/services/api', () => ({
  apiService: {
    referrals: {
      getAll: mockGetAll,
      getAnalytics: mockGetAnalytics,
      getMyApplications: mockGetMyApplications,
      create: mockCreate,
      apply: mockApply,
      updateApplicationStatus: mockUpdateApplicationStatus,
      getApplications: mockGetApplications,
      delete: mockDelete,
      approve: mockApprove,
      reject: mockReject,
    },
  },
}));

import Referrals from '@/pages/Referrals';

const referralsData = [
  {
    id: 'ref-1',
    company: 'Nexus Labs',
    jobTitle: 'Frontend Intern',
    description: 'Work on modern React UI',
    requirements: 'React, TypeScript',
    location: 'Bangalore',
    deadline: '2030-04-01T10:00:00.000Z',
    referralLink: 'https://example.com/job/1',
    status: 'APPROVED',
    postedBy: { id: 'u-admin', name: 'Admin', email: 'a@nexus.io' },
    alumniId: 'u-admin',
    createdAt: '2030-03-01T10:00:00.000Z',
    updatedAt: '2030-03-01T10:00:00.000Z',
    applications: [],
  },
  {
    id: 'ref-2',
    company: 'Hidden Corp',
    jobTitle: 'Backend Engineer',
    description: 'Confidential pending referral',
    requirements: 'Node.js',
    location: 'Remote',
    deadline: '2030-05-01T10:00:00.000Z',
    status: 'PENDING',
    postedBy: { id: 'u-alum', name: 'Alum', email: 'alum@nexus.io' },
    alumniId: 'u-alum',
    createdAt: '2030-03-02T10:00:00.000Z',
    updatedAt: '2030-03-02T10:00:00.000Z',
    applications: [],
  },
] as const;

describe('Referrals page unit', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUserState.user = {
      id: 'u-admin',
      role: 'ADMIN',
      name: 'Admin',
      email: 'a@nexus.io',
    };

    mockGetAll.mockResolvedValue({ data: referralsData });
    mockGetAnalytics.mockResolvedValue({
      data: {
        totals: { referrals: 2, applications: 4 },
        referralsByStatus: { APPROVED: 1, PENDING: 1, REJECTED: 0 },
        applicationsByStatus: { PENDING: 2 },
      },
    });
    mockGetMyApplications.mockResolvedValue({ data: [] });
    mockCreate.mockResolvedValue({ data: {} });
    mockApply.mockResolvedValue({ data: {} });
    mockGetApplications.mockResolvedValue({ data: [] });
    mockDelete.mockResolvedValue({ data: {} });
    mockApprove.mockResolvedValue({ data: {} });
    mockReject.mockResolvedValue({ data: {} });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('shows auth error when user is not authenticated', async () => {
    mockUserState.user = null;

    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('User not authenticated')
    ).toBeInTheDocument();
  });

  it('renders header stats and referral cards for admin', async () => {
    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    expect(await screen.findByText('Job Referrals')).toBeInTheDocument();
    expect(await screen.findByText('Total: 2')).toBeInTheDocument();
    expect(await screen.findByText('Frontend Intern')).toBeInTheDocument();
    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument();
  });

  it('filters referral cards by search query', async () => {
    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    await screen.findByText('Frontend Intern');
    fireEvent.change(screen.getByPlaceholderText(/Search referrals/i), {
      target: { value: 'Hidden Corp' },
    });

    expect(screen.queryByText('Frontend Intern')).not.toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
  });

  it('shows only approved referrals for student when pending is not owned', async () => {
    mockUserState.user = {
      id: 'u-student',
      role: 'STUDENT',
      name: 'Student',
      email: 's@nexus.io',
    };
    mockGetMyApplications.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    expect(await screen.findByText('Frontend Intern')).toBeInTheDocument();
    expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
  });

  it('disables apply button when already applied', async () => {
    mockUserState.user = {
      id: 'u-student',
      role: 'STUDENT',
      name: 'Student',
      email: 's@nexus.io',
    };
    mockGetMyApplications.mockResolvedValue({
      data: [
        {
          id: 'app-1',
          referralId: 'ref-1',
          applicantId: 'u-student',
          resumeUrl: 'https://drive.google.com/file/d/xyz',
          status: 'PENDING',
          createdAt: '2030-03-02T10:00:00.000Z',
          updatedAt: '2030-03-02T10:00:00.000Z',
          applicant: {
            id: 'u-student',
            name: 'Student',
            email: 's@nexus.io',
            role: 'STUDENT',
          },
        },
      ],
    });

    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    expect(await screen.findByText('Already Applied')).toBeInTheDocument();
  });

  it('calls getAll again when refresh button is clicked', async () => {
    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    await screen.findByText('Frontend Intern');
    const initialCalls = mockGetAll.mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => {
      expect(mockGetAll.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  it('shows admin approve and reject actions for pending referrals', async () => {
    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Approve/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
  });

  it('approves pending referral and calls API', async () => {
    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    await screen.findByText('Backend Engineer');
    await userEvent.click(screen.getByRole('button', { name: /Approve/i }));

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith('ref-2');
    });
  });

  it('rejects pending referral and calls API', async () => {
    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    await screen.findByText('Backend Engineer');
    await userEvent.click(screen.getByRole('button', { name: /Reject/i }));

    await waitFor(() => {
      expect(mockReject).toHaveBeenCalledWith('ref-2');
    });
  });

  it('opens details dialog and closes it', async () => {
    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    await screen.findByText('Frontend Intern');
    await userEvent.click(
      screen.getAllByRole('button', { name: /Details/i })[0]
    );

    expect(await screen.findByText('Job Details')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Close/i }));
  });

  it('shows apply validation error when resume link is missing', async () => {
    mockUserState.user = {
      id: 'u-student',
      role: 'STUDENT',
      name: 'Student',
      email: 's@nexus.io',
    };
    mockGetMyApplications.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    await screen.findByText('Frontend Intern');
    await userEvent.click(screen.getByRole('button', { name: /^Apply$/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /Submit Application/i })
    );

    expect(
      await screen.findByText(
        'Please provide a resume link (Google Drive or URL).'
      )
    ).toBeInTheDocument();
  });

  it('submits application when resume link is valid', async () => {
    mockUserState.user = {
      id: 'u-student',
      role: 'STUDENT',
      name: 'Student',
      email: 's@nexus.io',
    };
    mockGetMyApplications.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    await screen.findByText('Frontend Intern');
    await userEvent.click(screen.getByRole('button', { name: /^Apply$/i }));

    const resumeInput = screen.getByLabelText(/Resume Link/i);
    fireEvent.change(resumeInput, {
      target: { value: 'https://drive.google.com/file/d/valid' },
    });

    await userEvent.click(
      screen.getByRole('button', { name: /Submit Application/i })
    );

    await waitFor(
      () => {
        expect(mockApply).toHaveBeenCalled();
      },
      { timeout: 10000 }
    );
  });

  it('loads referral applications dialog and updates status', async () => {
    mockUserState.user = {
      id: 'u-admin',
      role: 'ALUM',
      name: 'Owner',
      email: 'owner@nexus.io',
    };
    mockGetAll.mockResolvedValue({
      data: [
        {
          ...referralsData[0],
          alumniId: 'u-admin',
          applications: [{ id: 'a1' }],
        },
      ],
    });
    mockGetApplications.mockResolvedValue({
      data: [
        {
          id: 'app-22',
          referralId: 'ref-1',
          applicantId: 'u-student',
          resumeUrl: 'https://drive.google.com/file/d/app22',
          coverLetter: 'I am interested',
          status: 'PENDING',
          createdAt: '2030-03-02T10:00:00.000Z',
          updatedAt: '2030-03-02T10:00:00.000Z',
          applicant: {
            id: 'u-student',
            name: 'Student A',
            email: 's@example.com',
            role: 'STUDENT',
          },
        },
      ],
    });

    render(
      <MemoryRouter>
        <Referrals />
      </MemoryRouter>
    );

    await screen.findByText('Frontend Intern');
    await userEvent.click(
      screen.getByRole('button', { name: /Applications/i })
    );

    expect(await screen.findByText('Applications')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /Mark Reviewed/i })
    );

    await waitFor(() => {
      expect(mockUpdateApplicationStatus).toHaveBeenCalledWith(
        'app-22',
        'REVIEWED'
      );
    });
  });
});
