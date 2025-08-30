import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { subCommunityService } from '../services/subCommunityService';
import {
  SubCommunity,
  SubCommunityMember,
  JoinRequest,
  SubCommunityCreationRequest,
  SubCommunityRole,
  CreateSubCommunityRequestDto,
  ApproveJoinRequestDto,
  SubCommunityTypeResponse,
} from '../types/subCommunity';
import { useAuth } from './AuthContext';

interface SubCommunityContextType {
  // State
  subCommunities: SubCommunity[];
  subCommunitiesByType: SubCommunity[];
  currentSubCommunity: SubCommunity | null;
  subCommunityCache: Record<string, SubCommunityTypeResponse>;
  members: SubCommunityMember[];
  joinRequests: JoinRequest[];
  creationRequests: SubCommunityCreationRequest[];
  loading: boolean;
  error: string;

  // Actions - All return Promise<void>
  getAllSubCommunities: () => Promise<void>;
  getSubCommunity: (id: string) => Promise<void>;
  getSubCommunityByType: (
    type: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  createSubCommunity: (data: {
    name: string;
    description: string;
    isPrivate: boolean;
    ownerId: string;
  }) => Promise<void>;
  updateSubCommunity: (
    id: string,
    data: { name?: string; description?: string; isPrivate?: boolean }
  ) => Promise<void>;
  deleteSubCommunity: (id: string) => Promise<void>;
  requestToJoin: (subCommunityId: string) => Promise<void>;
  getPendingJoinRequests: (subCommunityId: string) => Promise<void>;
  approveJoinRequest: (
    subCommunityId: string,
    joinRequestId: string,
    dto: ApproveJoinRequestDto
  ) => Promise<void>;
  leaveSubCommunity: (subCommunityId: string) => Promise<void>;
  removeMember: (subCommunityId: string, memberId: string) => Promise<void>;
  updateMemberRole: (
    subCommunityId: string,
    memberId: string,
    role: SubCommunityRole
  ) => Promise<void>;
  createSubCommunityRequest: (
    dto: CreateSubCommunityRequestDto,
    documents?: File[]
  ) => Promise<void>;
  getAllSubCommunityRequests: () => Promise<void>;
  approveSubCommunityRequest: (requestId: string) => Promise<void>;
  rejectSubCommunityRequest: (requestId: string) => Promise<void>;

  // Utilities
  setError: (error: string) => void;
  clearError: () => void;
}

const SubCommunityContext = createContext<SubCommunityContextType>({
  // Default state
  subCommunities: [],
  subCommunitiesByType: [],
  currentSubCommunity: null,
  subCommunityCache: {},
  members: [],
  joinRequests: [],
  creationRequests: [],
  loading: false,
  error: '',

  // Default actions - all return void
  getAllSubCommunities: async () => {},
  getSubCommunity: async () => {},
  getSubCommunityByType: async () => {},
  createSubCommunity: async () => {},
  updateSubCommunity: async () => {},
  deleteSubCommunity: async () => {},
  requestToJoin: async () => {},
  getPendingJoinRequests: async () => {},
  approveJoinRequest: async () => {},
  leaveSubCommunity: async () => {},
  removeMember: async () => {},
  updateMemberRole: async () => {},
  createSubCommunityRequest: async () => {},
  getAllSubCommunityRequests: async () => {},
  approveSubCommunityRequest: async () => {},
  rejectSubCommunityRequest: async () => {},

  // Default utilities
  setError: () => {},
  clearError: () => {},
});

export const SubCommunityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [subCommunityCache, setSubCommunityCache] = useState<
    Record<string, SubCommunityTypeResponse>
  >({});
  const [currentSubCommunity, setCurrentSubCommunity] =
    useState<SubCommunity | null>(null);
  const [subCommunitiesByType, setSubCommunitiesByType] = useState<
    SubCommunity[]
  >([]);
  const [members, setMembers] = useState<SubCommunityMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [creationRequests, setCreationRequests] = useState<
    SubCommunityCreationRequest[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState('');

  const { user } = useAuth();

  const setError = useCallback((errorMessage: string) => {
    setErrorState(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setErrorState('');
  }, []);

  const getAllSubCommunities = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await subCommunityService.getAllSubCommunities();
      console.log('Fetched sub-communities:', data);
      setSubCommunities(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch sub-communities');
      } else {
        setError('An unexpected error occurred');
        console.error('Unexpected error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user, setError]);

  const getSubCommunity = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const data = await subCommunityService.getSubCommunity(id);
        setCurrentSubCommunity(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch sub-community');
        } else {
          setError('An unexpected error occurred');
          console.error('Unexpected error:', err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const getSubCommunityByType = useCallback(
    async (
      type: string,
      page: number = 1,
      limit: number = 20,
      forceRefresh = false
    ) => {
      const cacheKey = `${type}-${page}-${limit}`;

      if (!forceRefresh && subCommunityCache[cacheKey]) {
        const cachedData = subCommunityCache[cacheKey];
        const allSubCommunities = cachedData.data.flatMap((typeGroup) =>
          typeGroup.SubCommunity.map((subCom) => ({
            ...subCom,
            type: typeGroup.type,
          }))
        );
        console.log('Using cached data for:', cacheKey);
        console.log(allSubCommunities);
        setSubCommunitiesByType(allSubCommunities);
        return;
      }

      setLoading(true);
      try {
        const response = await subCommunityService.getSubCommunityByType(
          type,
          page,
          limit
        );

        console.log('response:', response);

        setSubCommunityCache((prev) => ({
          ...prev,
          [cacheKey]: response,
        }));

        const allSubCommunities = response.data.flatMap((typeGroup) =>
          typeGroup.SubCommunity.map((subCom) => ({
            ...subCom,
            type: typeGroup.type,
          }))
        );

        setSubCommunitiesByType(allSubCommunities);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch sub-communities');
        } else {
          setError('An unexpected error occurred');
          console.error('Unexpected error:', err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError, subCommunityCache]
  );

  const createSubCommunity = useCallback(
    async (data: {
      name: string;
      description: string;
      isPrivate: boolean;
      ownerId: string;
    }) => {
      setLoading(true);
      try {
        const newSubCommunity =
          await subCommunityService.createSubCommunity(data);
        setSubCommunities((prev) => [...prev, newSubCommunity]);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to create sub-community');
        } else {
          setError('Failed to create sub-community');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const updateSubCommunity = useCallback(
    async (
      id: string,
      data: { name?: string; description?: string; isPrivate?: boolean }
    ) => {
      setLoading(true);
      try {
        const updated = await subCommunityService.updateSubCommunity(id, data);
        setSubCommunities((prev) =>
          prev.map((sc) => (sc.id === id ? updated : sc))
        );
        setCurrentSubCommunity((prev) => (prev?.id === id ? updated : prev));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to update sub-community');
        } else {
          setError('Failed to update sub-community');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const deleteSubCommunity = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        await subCommunityService.deleteSubCommunity(id);
        setSubCommunities((prev) => prev.filter((sc) => sc.id !== id));
        setCurrentSubCommunity((prev) => (prev?.id === id ? null : prev));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to delete sub-community');
        } else {
          setError('Failed to delete sub-community');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const requestToJoin = useCallback(
    async (subCommunityId: string) => {
      setLoading(true);
      try {
        const joinRequest =
          await subCommunityService.requestToJoin(subCommunityId);
        setJoinRequests((prev) => [...prev, joinRequest]);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to request join');
        } else {
          setError('Failed to request join');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const getPendingJoinRequests = useCallback(
    async (subCommunityId: string) => {
      setLoading(true);
      try {
        const requests =
          await subCommunityService.getPendingJoinRequests(subCommunityId);
        setJoinRequests(requests);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch join requests');
        } else {
          setError('Failed to fetch join requests');
        }
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const approveJoinRequest = useCallback(
    async (
      subCommunityId: string,
      joinRequestId: string,
      dto: ApproveJoinRequestDto
    ) => {
      setLoading(true);
      try {
        const updated = await subCommunityService.approveJoinRequest(
          subCommunityId,
          joinRequestId,
          dto
        );
        setJoinRequests((prev) =>
          prev.map((jr) => (jr.id === joinRequestId ? updated : jr))
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to approve join request');
        } else {
          setError('Failed to approve join request');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const leaveSubCommunity = useCallback(
    async (subCommunityId: string) => {
      setLoading(true);
      try {
        await subCommunityService.leaveSubCommunity(subCommunityId);
        setMembers((prev) => prev.filter((m) => m.userId !== user?.id));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to leave sub-community');
        } else {
          setError('Failed to leave sub-community');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, setError]
  );

  const removeMember = useCallback(
    async (subCommunityId: string, memberId: string) => {
      setLoading(true);
      try {
        await subCommunityService.removeMember(subCommunityId, memberId);
        setMembers((prev) => prev.filter((m) => m.userId !== memberId));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to remove member');
        } else {
          setError('Failed to remove member');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const updateMemberRole = useCallback(
    async (
      subCommunityId: string,
      memberId: string,
      role: SubCommunityRole
    ) => {
      setLoading(true);
      try {
        const updated = await subCommunityService.updateMemberRole(
          subCommunityId,
          memberId,
          { role }
        );
        setMembers((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to update member role');
        } else {
          setError('Failed to update member role');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const createSubCommunityRequest = useCallback(
    async (dto: CreateSubCommunityRequestDto, documents?: File[]) => {
      setLoading(true);
      try {
        const request = await subCommunityService.createSubCommunityRequest(
          dto,
          documents
        );
        setCreationRequests((prev) => [...prev, request]);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to create sub-community request');
        } else {
          setError('Failed to create sub-community request');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const getAllSubCommunityRequests = useCallback(async () => {
    setLoading(true);
    try {
      const requests = await subCommunityService.getAllSubCommunityRequests();
      setCreationRequests(requests);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch sub-community requests');
      } else {
        setError('Failed to fetch sub-community requests');
      }
    } finally {
      setLoading(false);
    }
  }, [setError]);

  const approveSubCommunityRequest = useCallback(
    async (requestId: string) => {
      setLoading(true);
      try {
        const updated =
          await subCommunityService.approveSubCommunityRequest(requestId);
        setCreationRequests((prev) =>
          prev.map((cr) => (cr.id === requestId ? updated : cr))
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to approve sub-community request');
        } else {
          setError('Failed to approve sub-community request');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  const rejectSubCommunityRequest = useCallback(
    async (requestId: string) => {
      setLoading(true);
      try {
        const updated =
          await subCommunityService.rejectSubCommunityRequest(requestId);
        setCreationRequests((prev) =>
          prev.map((cr) => (cr.id === requestId ? updated : cr))
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to reject sub-community request');
        } else {
          setError('Failed to reject sub-community request');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setError]
  );

  // Load initial data
  useEffect(() => {
    getAllSubCommunities();
  }, [getAllSubCommunities]);

  const contextValue = useMemo(
    () => ({
      // State
      subCommunities,
      subCommunitiesByType,
      subCommunityCache,
      currentSubCommunity,
      members,
      joinRequests,
      creationRequests,
      loading,
      error,

      // Actions
      getAllSubCommunities,
      getSubCommunity,
      getSubCommunityByType,
      createSubCommunity,
      updateSubCommunity,
      deleteSubCommunity,
      requestToJoin,
      getPendingJoinRequests,
      approveJoinRequest,
      leaveSubCommunity,
      removeMember,
      updateMemberRole,
      createSubCommunityRequest,
      getAllSubCommunityRequests,
      approveSubCommunityRequest,
      rejectSubCommunityRequest,

      // Utilities
      setError,
      clearError,
    }),
    [
      subCommunities,
      subCommunitiesByType,
      subCommunityCache,
      currentSubCommunity,
      members,
      joinRequests,
      creationRequests,
      loading,
      error,
      getAllSubCommunities,
      getSubCommunity,
      getSubCommunityByType,
      createSubCommunity,
      updateSubCommunity,
      deleteSubCommunity,
      requestToJoin,
      getPendingJoinRequests,
      approveJoinRequest,
      leaveSubCommunity,
      removeMember,
      updateMemberRole,
      createSubCommunityRequest,
      getAllSubCommunityRequests,
      approveSubCommunityRequest,
      rejectSubCommunityRequest,
      setError,
      clearError,
    ]
  );

  return (
    <SubCommunityContext.Provider value={contextValue}>
      {children}
    </SubCommunityContext.Provider>
  );
};

export const useSubCommunity = () => {
  const context = useContext(SubCommunityContext);
  if (!context) {
    throw new Error(
      'useSubCommunity must be used within a SubCommunityProvider'
    );
  }
  return context;
};
