import axios from 'axios';
import {
  UpdateProfileInput,
  MemberExperience,
  MemberFlair,
  MemberProfileSettings,
} from '../types/profileType';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// withCredentials ensures the httpOnly access_token cookie is sent
// automatically — no manual Authorization header needed (Issue #164).
const api = axios.create({ baseURL: BACKEND_URL, withCredentials: true });

export async function fetchProfileDataService(userId: string) {
  try {
    const [profileRes, badgesRes] = await Promise.all([
      api.get(`/profile/me`),
      api.get(`/profile/${userId}/badges`),
    ]);
    return { profile: profileRes.data, badges: badgesRes.data };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to fetch profile');
    }
    throw new Error('Failed to fetch profile');
  }
}

export async function searchAllProfileDataService() {
  try {
    const [profileSearchRes] = await Promise.all([api.get(`/profile/search`)]);
    return { AllSearchedProfile: profileSearchRes.data };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to search profile'
      );
    }
    throw new Error('Failed to search profile');
  }
}

export async function searchedProfileDataService(userId: string) {
  try {
    const [profileSearchRes, badgesSearchRes] = await Promise.all([
      api.get(`/profile/${userId}`),
      api.get(`/profile/${userId}/badges`),
    ]);
    console.log(profileSearchRes.data);
    return {
      SearchedProfile: profileSearchRes.data,
      Badges: badgesSearchRes.data,
    };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to search profile'
      );
    }
    throw new Error('Failed to search profile');
  }
}

export interface ProfilePreviewResponse {
  user?: {
    id?: string;
    name?: string;
    role?: string;
    _count?: {
      Post?: number;
      projects?: number;
    };
  };
  bio?: string;
  location?: string;
  dept?: string;
  year?: string;
  avatarUrl?: string;
  skills?: Array<{ id?: string; name?: string }>;
}

export async function getProfilePreviewService(
  userId: string,
  avatarUrl: boolean = false
): Promise<ProfilePreviewResponse> {
  try {
    console.log(
      `Requesting profile preview for userId: ${userId} with avatarUrl: ${avatarUrl}`
    );
    const response = await api.get(`/profile/${userId}/preview`, {
      params: { avatarUrl },
    });
    console.log('Profile preview data:', response.data);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch profile preview'
      );
    }
    throw new Error('Failed to fetch profile preview');
  }
}

export async function updateProfileService(
  userId: string,
  profileData: UpdateProfileInput
) {
  try {
    await api.put(`/profile/${userId}`, profileData);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to update profile'
      );
    }
    throw new Error('Failed to update profile');
  }
}

export async function endorseSkillService(profileId: string, skillId: string) {
  try {
    await api.post(`/profile/${profileId}/endorse`, { skillId });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to endorse skill');
    }
    throw new Error('Failed to endorse skill');
  }
}

export async function removeEndorsementService(endorsementId: string) {
  try {
    await api.delete('/profile/endorsement', {
      data: { endorsementId },
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to remove endorsement'
      );
    }
    throw new Error('Failed to remove endorsement');
  }
}

export async function awardBadgeService(userId: string, badgeId: string) {
  try {
    await api.post(`/profile/${userId}/award-badge`, { badgeId });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to award badge');
    }
    throw new Error('Failed to award badge');
  }
}

export async function getAllSkillsService() {
  try {
    const response = await api.get('/profile/skills/all');
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to fetch skills');
    }
    throw new Error('Failed to fetch skills');
  }
}

export async function getAllBadgesService() {
  try {
    const response = await api.get('profile/badges/all');
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to fetch badges');
    }
    throw new Error('Failed to fetch badges');
  }
}

export async function getMemberExperienceService(
  userId: string
): Promise<MemberExperience> {
  try {
    const response = await api.get(`/profile/${userId}/experience`);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch member experience'
      );
    }
    throw new Error('Failed to fetch member experience');
  }
}

export async function getMemberSettingsService(): Promise<MemberProfileSettings> {
  try {
    const response = await api.get('/profile/member-settings/me');
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch member settings'
      );
    }
    throw new Error('Failed to fetch member settings');
  }
}

export async function updateMemberSettingsService(
  settings: Partial<MemberProfileSettings>
): Promise<MemberProfileSettings> {
  try {
    const response = await api.put('/profile/member-settings/me', settings);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to update member settings'
      );
    }
    throw new Error('Failed to update member settings');
  }
}

export async function followMemberService(userId: string) {
  try {
    const response = await api.post(`/profile/${userId}/follow`);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to follow member');
    }
    throw new Error('Failed to follow member');
  }
}

export async function unfollowMemberService(userId: string) {
  try {
    const response = await api.delete(`/profile/${userId}/follow`);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to unfollow member'
      );
    }
    throw new Error('Failed to unfollow member');
  }
}

export async function getMemberFlairsService(
  userId: string
): Promise<MemberFlair[]> {
  try {
    const response = await api.get(`/profile/${userId}/flairs`);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to fetch flairs');
    }
    throw new Error('Failed to fetch flairs');
  }
}

export async function createMemberFlairService(
  userId: string,
  payload: Pick<MemberFlair, 'label' | 'color' | 'backgroundColor'> & {
    isActive?: boolean;
  }
): Promise<MemberFlair> {
  try {
    const response = await api.post(`/profile/${userId}/flairs`, payload);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to create flair');
    }
    throw new Error('Failed to create flair');
  }
}

export async function activateMemberFlairService(flairId: string) {
  try {
    const response = await api.put(`/profile/flairs/${flairId}/activate`);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to activate flair'
      );
    }
    throw new Error('Failed to activate flair');
  }
}

export async function deleteMemberFlairService(flairId: string) {
  try {
    const response = await api.delete(`/profile/flairs/${flairId}`);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to delete flair');
    }
    throw new Error('Failed to delete flair');
  }
}
