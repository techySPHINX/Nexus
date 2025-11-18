import axios from 'axios';
import { UpdateProfileInput } from '../types/profileType';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: BACKEND_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchProfileDataService(userId: string) {
  try {
    const [profileRes, badgesRes] = await Promise.all([
      api.get(`/profile/me`),
      api.get(`/profile/${userId}/badges`),
    ]);
    console.log('profile', profileRes.data);
    console.log('badges', badgesRes.data);
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
