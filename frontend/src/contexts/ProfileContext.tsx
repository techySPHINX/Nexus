import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import axios from 'axios';
// import { useAuth } from '../contexts/AuthContext';

// Export enums and types that will be used in other files
export enum Role {
  STUDENT = 'STUDENT',
  ALUM = 'ALUM',
  ADMIN = 'ADMIN',
}

export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
  role: Role;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  endorsements: Endorsement[];
}

export interface Endorsement {
  id: string;
  endorser: User;
  createdAt: string;
}

export interface ProfileBadge {
  badge: {
    id: string;
    name: string;
    icon: string;
    assignedAt?: string;
  };
}

export interface Connection {
  id: string;
  status: ConnectionStatus;
  createdAt: string;
  recipient: User;
  requester: User;
}

export interface Profile {
  id: string;
  bio?: string | null;
  location?: string | null;
  interests?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  skills: Skill[];
  endorsements: Endorsement[];
  user: User;
}

// Context
interface ProfileContextType {
  user: User | null;
  profile: Profile | null;
  badges: ProfileBadge[];
  //   connections: Connection[];
  loading: boolean;
  error: string;
  fetchProfileData: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  endorseSkill: (skillId: string) => Promise<void>;
  awardBadge: (userId: string, badgeId: string) => Promise<void>;
  //   handleConnection: (userId: string, action: 'accept' | 'reject') => Promise<void>;
  setError: (error: string) => void;
  login: (userData: User) => void;
  logout: () => void;
}

const ProfileContext = createContext<ProfileContextType>({
  user: null,
  profile: null,
  badges: [],
  //   connections: [],
  loading: false,
  error: '',
  fetchProfileData: async () => {},
  refreshProfile: async () => {},
  endorseSkill: async () => {},
  awardBadge: async () => {},
  //   handleConnection: async () => {},
  setError: () => {},
  login: () => {},
  logout: () => {},
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<ProfileBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: 'http://localhost:3000',
    });
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return instance;
  }, []);

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [profileRes, badgesRes] = await Promise.all([
        api.get(`/profile/me`),
        api.get(`/profile/${user.id}/badges`),
      ]);
      setProfile(profileRes.data);
      setBadges(badgesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id, api]);

  const refreshProfile = useCallback(async () => {
    await fetchProfileData();
  }, [fetchProfileData]);

  const endorseSkill = useCallback(
    async (skillId: string) => {
      if (!profile) return;
      try {
        await api.post(`/profile/${profile.id}/endorse`, { skillId });
        await refreshProfile();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to endorse skill');
      }
    },
    [profile, api, refreshProfile]
  );

  const awardBadge = useCallback(
    async (userId: string, badgeId: string) => {
      try {
        await api.post(`/profile/${userId}/award-badge`, { badgeId });
        await refreshProfile();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to award badge');
      }
    },
    [api, refreshProfile]
  );

  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token || '');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setProfile(null);
    setBadges([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Memoize the entire context value
  const contextValue = useMemo(
    () => ({
      user,
      profile,
      badges,
      loading,
      error,
      fetchProfileData,
      refreshProfile,
      endorseSkill,
      awardBadge,
      setError,
      login,
      logout,
    }),
    [
      user,
      profile,
      badges,
      loading,
      error,
      fetchProfileData,
      refreshProfile,
      endorseSkill,
      awardBadge,
    ]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
