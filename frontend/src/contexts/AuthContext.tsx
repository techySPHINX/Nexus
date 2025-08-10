import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, handleApiError } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
  profileCompleted: boolean;
  profile?: Profile;
}

export interface Profile {
  id: string;
  userId: string;
  bio?: string;
  location?: string;
  interests?: string;
  avatarUrl?: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app load
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.auth.login(email, password);
      const { accessToken, user } = response.data;
      
      setToken(accessToken);
      setUser(user);
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(handleApiError(error));
    }
  };

  const register = async (email: string, password: string, name: string, role: string) => {
    try {
      const response = await apiService.auth.register(email, password, name, role);
      const { accessToken, user } = response.data;
      
      setToken(accessToken);
      setUser(user);
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(handleApiError(error));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 