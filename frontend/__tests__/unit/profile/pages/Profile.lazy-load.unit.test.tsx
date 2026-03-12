import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => {
  const mockFetchAllSkills = vi.fn().mockResolvedValue(undefined);
  const mockFetchAllBadges = vi.fn().mockResolvedValue(undefined);
  const mockRefreshProfile = vi.fn().mockResolvedValue(undefined);
  const mockSearchedProfile = vi.fn().mockResolvedValue(undefined);
  const mockFetchMemberExperience = vi.fn().mockResolvedValue(undefined);
  const mockFetchFlairs = vi.fn().mockResolvedValue(undefined);
  const mockFetchMemberSettings = vi.fn().mockResolvedValue(undefined);
  const mockFetchNotificationPreference = vi.fn().mockResolvedValue(undefined);

  const makeProfileState = () => ({
    profile: {
      id: 'profile-1',
      userId: 'user-1',
      bio: 'bio',
      location: 'city',
      interests: 'AI,ML',
      avatarUrl: '',
      dept: '',
      year: '',
      branch: '',
      course: '',
      skills: [{ id: 'skill-1', name: 'TypeScript', endorsements: [] }],
      user: {
        id: 'user-1',
        name: 'User One',
        email: 'u1@example.com',
        role: 'ALUM',
        _count: {
          Post: 0,
          Comment: 0,
          projects: 0,
          startups: 0,
          postedReferrals: 0,
          events: 0,
          ownedSubCommunities: 0,
          subCommunityMemberships: 0,
        },
      },
    },
    badges: [],
    allSkills: [],
    allBadges: [],
    loading: false,
    error: '',
    refreshProfile: mockRefreshProfile,
    searchedProfile: mockSearchedProfile,
    endorseSkill: vi.fn(),
    removeEndorsement: vi.fn(),
    awardBadge: vi.fn().mockResolvedValue(undefined),
    setError: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    fetchAllSkills: mockFetchAllSkills,
    fetchAllBadges: mockFetchAllBadges,
    memberExperience: {
      activeFlair: null,
      follow: { isFollowing: false, canFollow: false, followersCount: 0 },
      badges: [],
      recentActivity: [],
      privacy: {
        showBadges: true,
        showRecentActivity: true,
        allowDirectMessage: true,
      },
    },
    memberSettings: null,
    flairs: [],
    notificationPreference: null,
    fetchMemberExperience: mockFetchMemberExperience,
    followMember: vi.fn(),
    unfollowMember: vi.fn(),
    fetchMemberSettings: mockFetchMemberSettings,
    updateMemberSettings: vi.fn(),
    fetchFlairs: mockFetchFlairs,
    createFlair: vi.fn(),
    activateFlair: vi.fn(),
    deleteFlair: vi.fn(),
    fetchNotificationPreference: mockFetchNotificationPreference,
    updateNotificationPreference: vi.fn(),
  });

  return {
    mockFetchAllSkills,
    mockFetchAllBadges,
    authState: { user: { id: 'user-1', role: 'ALUM' } },
    profileState: { value: makeProfileState() },
    makeProfileState,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => state.authState,
}));

vi.mock('@/contexts/ProfileContext', () => ({
  useProfile: () => state.profileState.value,
}));

vi.mock('@/utils/loader', () => ({
  default: () => <div data-testid="loader" />,
}));

import Profile from '@/pages/Profile';

describe('Profile page lazy loading behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.authState.user = { id: 'user-1', role: 'ALUM' };
    state.profileState.value = state.makeProfileState();
  });

  it('does not fetch skills and badges lists on initial mount', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('My Profile')).toBeInTheDocument();
    });

    expect(state.mockFetchAllSkills).not.toHaveBeenCalled();
    expect(state.mockFetchAllBadges).not.toHaveBeenCalled();
  });

  it('fetches skills list when user opens Edit Profile dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /edit profile/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    await waitFor(() => {
      expect(state.mockFetchAllSkills).toHaveBeenCalledTimes(1);
    });
  });

  it('fetches badge list when admin opens Award Badge dialog', async () => {
    state.authState.user = { id: 'admin-1', role: 'ADMIN' };
    state.profileState.value = {
      ...state.makeProfileState(),
      profile: {
        ...state.makeProfileState().profile,
        user: {
          ...state.makeProfileState().profile.user,
          id: 'another-user',
          role: 'STUDENT',
        },
      },
    };

    render(
      <MemoryRouter initialEntries={['/profile/another-user']}>
        <Routes>
          <Route path="/profile/:userId" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /award badge/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /award badge/i }));

    await waitFor(() => {
      expect(state.mockFetchAllBadges).toHaveBeenCalledTimes(1);
    });
  });
});
