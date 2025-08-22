import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
  profileCompleted: boolean;
  profile?: Profile;
}

interface DecodedToken {
  sub: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN'; // adjust if you have more roles
  profileCompleted: boolean;
  profile?: Profile; // make this stricter if you know its shape
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
  register: (
    email: string,
    password: string,
    name: string,
    role: string
  ) => Promise<void>;
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

  // Configure axios defaults
  axios.defaults.baseURL = 'http://localhost:3000';

  // Check for stored token on app load || app refresh
  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
      try {
        const decoded: DecodedToken = jwtDecode(storedToken);

        const user: User = {
          id: decoded.sub, // ✅ direct mapping
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
          profileCompleted: decoded.profileCompleted,
          profile: decoded.profile,
        };

        setToken(storedToken);
        setUser(user);
        axios.defaults.headers.common['Authorization'] =
          `Bearer ${storedToken}`;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { accessToken } = response.data;
      const decoded: DecodedToken = jwtDecode(accessToken);

      const user: User = {
        id: decoded.sub, // ✅ direct mapping
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        profileCompleted: decoded.profileCompleted,
        profile: decoded.profile,
      };

      setToken(accessToken);
      setUser(user);

      localStorage.setItem('token', accessToken);

      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } catch (error: unknown) {
      console.error('Login error:', error);
      let message = 'Login failed. Please try again.';
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data &&
        typeof error.response.data.message === 'string'
      ) {
        message = error.response.data.message;
      }
      throw new Error(message);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: string
  ) => {
    try {
      const response = await axios.post<AuthResponse>('/auth/register', {
        email,
        password,
        name,
        role,
      });

      const { accessToken } = response.data;
      const decoded: DecodedToken = jwtDecode(accessToken);

      const user: User = {
        id: decoded.sub, // ✅ direct mapping
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        profileCompleted: decoded.profileCompleted,
        profile: decoded.profile,
      };

      setToken(accessToken);
      setUser(user);

      localStorage.setItem('token', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } catch (error: unknown) {
      console.error('Register error:', error);
      let message = 'Registration failed. Please try again.';
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data &&
        typeof error.response.data.message === 'string'
      ) {
        message = error.response.data.message;
      }
      throw new Error(message);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
