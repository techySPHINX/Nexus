import axios from 'axios';
import { UpdateProfileInput } from '../types/profileType';
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
