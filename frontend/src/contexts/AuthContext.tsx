import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { getErrorMessage } from '@/utils/errorHandler';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
  profileCompleted: boolean;
  emailVerified: boolean;
  profile?: Profile;
}

interface DecodedToken {
  sub: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN'; // adjust if you have more roles
  emailVerified: boolean;
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
  login: (
    email: string,
    password: string
  ) => Promise<{
    status: 'OK' | 'EMAIL_NOT_VERIFIED' | 'ERROR';
    message?: string;
  }>;
  register: (
    email: string,
    password: string,
    name: string,
    role: string
  ) => Promise<void>;
  logout: () => void;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
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
          emailVerified: decoded.emailVerified,
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

  const login = async (
    email: string,
    password: string
  ): Promise<{
    status: 'OK' | 'EMAIL_NOT_VERIFIED' | 'ERROR';
    message?: string;
  }> => {
    try {
      const response = await axios.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { accessToken } = response.data;
      const decoded: DecodedToken = jwtDecode(accessToken);

      const user: User = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        profileCompleted: decoded.profileCompleted,
        emailVerified: decoded.emailVerified,
        profile: decoded.profile,
      };

      setToken(accessToken);
      setUser(user);

      localStorage.setItem('token', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      return { status: 'OK' };
    } catch (error: unknown) {
      console.error('Login error:', error);

      if (axios.isAxiosError(error)) {
        // Check for email not verified error
        if (error.response?.status === 401) {
          const errorMessage = error.response.data?.message;

          if (errorMessage === 'Email not verified') {
            // Automatically resend verification email
            try {
              await axios.post('/auth/resend-verification', { email });
              return {
                status: 'EMAIL_NOT_VERIFIED',
                message: 'Verification email sent. Please check your inbox.',
              };
            } catch (error) {
              console.log('Error resending verification email:', error);
              return {
                status: 'EMAIL_NOT_VERIFIED',
                message:
                  'Email not verified. Please verify your email to continue.',
              };
            }
          }

          return { status: 'ERROR', message: 'Invalid credentials' };
        }

        if (error.response?.data?.message) {
          return { status: 'ERROR', message: error.response.data.message };
        }
      }

      return { status: 'ERROR', message: 'Login failed. Please try again.' };
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
        emailVerified: decoded.emailVerified,
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

  const verifyEmail = async (email: string, otp: string) => {
    try {
      await axios.post('/auth/verify-email', { email, otp });

      if (user) {
        setUser({ ...user, emailVerified: true });
      }
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error));
    }
  };

  const resendVerification = async (email: string) => {
    try {
      await axios.post('/auth/resend-verification', { email });
    } catch (error: unknown) {
      throw new Error(getErrorMessage(error));
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
    verifyEmail,
    resendVerification,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
