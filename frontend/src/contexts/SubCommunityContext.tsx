import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface SubCommunity {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  creatorId: string;
}

interface SubCommunityContextType {
  subCommunities: SubCommunity[];
  loading: boolean;
  error: string | null;
  createSubCommunity: (data: {
    name: string;
    description: string;
  }) => Promise<void>;
  getSubCommunity: (id: string) => Promise<SubCommunity | null>;
  clearError: () => void;
}

const SubCommunityContext = createContext<SubCommunityContextType | undefined>(
  undefined
);

export const SubCommunityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const clearError = () => setError(null);

  const createSubCommunity = async (data: {
    name: string;
    description: string;
  }) => {
    try {
      setLoading(true);
      const { data: newSubCommunity } = await axiosInstance.post(
        '/subcommunities',
        data
      );
      setSubCommunities((prev) => [...prev, newSubCommunity]);
      setLoading(false);
    } catch (err: unknown) {
      let message = 'Failed to create sub-community';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || err.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      setLoading(false);
      throw err;
    }
  };

  const getSubCommunity = async (id: string): Promise<SubCommunity | null> => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/subcommunities/${id}`);
      setLoading(false);
      return data;
    } catch (err: unknown) {
      let message = 'Failed to fetch sub-community';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || err.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    const fetchSubCommunities = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get('/subcommunities');
        setSubCommunities(data);
        setLoading(false);
      } catch (err: unknown) {
        let message = 'Failed to fetch sub-communities';
        if (axios.isAxiosError(err)) {
          message = err.response?.data?.message || err.message || message;
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
        setLoading(false);
      }
    };

    fetchSubCommunities();
  }, [token, axiosInstance]);

  return (
    <SubCommunityContext.Provider
      value={{
        subCommunities,
        loading,
        error,
        createSubCommunity,
        getSubCommunity,
        clearError,
      }}
    >
      {children}
    </SubCommunityContext.Provider>
  );
};

export const useSubCommunities = () => {
  const context = useContext(SubCommunityContext);
  if (context === undefined) {
    throw new Error(
      'useSubCommunities must be used within a SubCommunityProvider'
    );
  }
  return context;
};
