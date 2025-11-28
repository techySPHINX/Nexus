import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  fetchProfileDataService,
  endorseSkillService,
  removeEndorsementService,
  awardBadgeService,
  updateProfileService,
  searchAllProfileDataService,
  searchedProfileDataService,
  getAllSkillsService,
  getAllBadgesService,
} from '../services/profileService';
import {
  Profile,
  ProfileBadge,
  UpdateProfileInput,
  Skill,
  Badge,
} from '../types/profileType';
import { useAuth } from './AuthContext';

// Context
interface ProfileContextType {
  profile: Profile | null;
  badges: ProfileBadge[];
  //   connections: Connection[];
  allSkills: Skill[];
  allBadges: Badge[];
  loading: boolean;
  skillsLoading: boolean;
  error: string;
  fetchProfileData: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  allSearchedProfile: () => Promise<void>;
  searchedProfile: (userId: string) => Promise<void>;
  endorseSkill: (skillId: string) => Promise<void>;
  removeEndorsement: (endorsementId: string) => Promise<void>;
  awardBadge: (userId: string, badgeId: string) => Promise<void>;
  //   handleConnection: (userId: string, action: 'accept' | 'reject') => Promise<void>;
  fetchAllSkills: () => Promise<void>;
  fetchAllBadges: () => Promise<void>;
  updateProfile: (profileData: UpdateProfileInput) => Promise<void>;
  setError: (error: string) => void;
  // Gamification helper
  getUserTransactions?: (
    userId: string,
    limit?: number
  ) => Promise<Array<Record<string, unknown>>>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  badges: [],
  //   connections: [],
  allSkills: [],
  allBadges: [],
  loading: false,
  skillsLoading: false,
  error: '',
  fetchProfileData: async () => {},
  refreshProfile: async () => {},
  allSearchedProfile: async () => {},
  searchedProfile: async () => {},
  endorseSkill: async () => {},
  removeEndorsement: async () => {},
  awardBadge: async () => {},
  fetchAllSkills: async () => {},
  fetchAllBadges: async () => {},
  //   handleConnection: async () => {},
  updateProfile: async () => {},
  setError: () => {},
  getUserTransactions: async () => [],
});

const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<ProfileBadge[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  //   const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { profile, badges } = await fetchProfileDataService(user.id);
      setProfile(profile);
      setBadges(badges);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch profile');
      } else {
        setError('An unexpected error occurred.');
        console.error('Unexpected error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    await fetchProfileData();
  }, [fetchProfileData]);

  const allSearchedProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { AllSearchedProfile } = await searchAllProfileDataService();
      setProfile(AllSearchedProfile);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to search profiles');
      } else {
        setError('An unexpected error occurred.');
        console.error('Unexpected error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const searchedProfile = useCallback(
    async (userId: string) => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { SearchedProfile, Badges } =
          await searchedProfileDataService(userId);
        setProfile(SearchedProfile);
        setBadges(Badges);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to search profile');
        } else {
          setError('An unexpected error occurred.');
          console.error('Unexpected error:', err);
        }
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateProfile = useCallback(
    async (profileData: UpdateProfileInput) => {
      if (!user || !profile) {
        setError('Authentication required');
        return;
      }
      setLoading(true);
      try {
        await updateProfileService(user.id, profileData);
        await refreshProfile();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to update profile');
        } else {
          setError('Failed to update profile');
        }
      } finally {
        setLoading(false);
      }
    },
    [user, profile, refreshProfile]
  );

  const endorseSkill = useCallback(
    async (skillId: string) => {
      if (!profile) return;
      try {
        await endorseSkillService(profile.id, skillId);
        await refreshProfile();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to endorse skill');
        } else {
          setError('An unexpected error occurred.');
          console.error('Unexpected error:', err);
        }
      } finally {
        setLoading(false);
      }
    },
    [profile, refreshProfile]
  );

  const removeEndorsement = useCallback(
    async (endorsementId: string) => {
      try {
        await removeEndorsementService(endorsementId);
        await refreshProfile();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to remove endorsement');
        } else {
          setError('An unexpected error occurred.');
          console.error('Unexpected error:', err);
        }
      } finally {
        setLoading(false);
      }
    },
    [refreshProfile]
  );

  const awardBadge = useCallback(
    async (userId: string, badgeId: string) => {
      try {
        await awardBadgeService(userId, badgeId);
        await refreshProfile();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to award badge');
        } else {
          setError('An unexpected error occurred.');
          console.error('Unexpected error:', err);
        }
      } finally {
        setLoading(false);
      }
    },
    [refreshProfile]
  );

  const [skillsLastFetched, setSkillsLastFetched] = useState<number>(0);

  const fetchAllSkills = useCallback(async () => {
    if (Date.now() - skillsLastFetched < 10 * 60 * 1000) {
      return; // Skip fetching if last fetched within 10 minutes
    }
    setSkillsLoading(true);
    try {
      console.log('Fetching all skills...');
      const skills = await getAllSkillsService();
      setAllSkills(skills);
      setSkillsLastFetched(Date.now());
      console.log('Fetched skills:', skills);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch skills');
      } else {
        setError('An unexpected error occurred.');
        console.error('Unexpected error:', err);
      }
    } finally {
      setSkillsLoading(false);
    }
  }, [skillsLastFetched]);

  const fetchAllBadges = useCallback(async () => {
    try {
      const badges = await getAllBadgesService();
      setAllBadges(badges);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch badges');
      } else {
        setError('An unexpected error occurred.');
        console.error('Unexpected error:', err);
      }
    }
  }, []);

  // Gamification: fetch user transactions
  const getUserTransactions = useCallback(async (userId: string, limit = 5) => {
    if (!userId) return [] as Array<Record<string, unknown>>;
    try {
      const gamify = await import('../services/gamificationService');
      const resp = await gamify.default.getTransactions(userId, limit);
      if (resp && resp.data) return resp.data as Array<Record<string, unknown>>;
      return Array.isArray(resp)
        ? (resp as Array<Record<string, unknown>>)
        : [];
    } catch (err) {
      console.error('getUserTransactions error', err);
      return [];
    }
  }, []);

  // Memoize the entire context value
  const contextValue = useMemo(
    () => ({
      profile,
      badges,
      allSkills,
      allBadges,
      //   connections,
      loading,
      skillsLoading,
      error,
      fetchProfileData,
      refreshProfile,
      allSearchedProfile,
      searchedProfile,
      endorseSkill,
      removeEndorsement,
      awardBadge,
      fetchAllSkills,
      fetchAllBadges,
      //   handleConnection,
      updateProfile,
      setError,
      getUserTransactions,
    }),
    [
      profile,
      badges,
      allSkills,
      allBadges,
      //   connections,
      loading,
      skillsLoading,
      error,
      fetchProfileData,
      refreshProfile,
      allSearchedProfile,
      searchedProfile,
      endorseSkill,
      removeEndorsement,
      fetchAllSkills,
      fetchAllBadges,
      //   handleConnection,
      awardBadge,
      updateProfile,
      getUserTransactions,
    ]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);

export default ProfileProvider;
