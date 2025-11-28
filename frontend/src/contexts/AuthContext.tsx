import {
  FC,
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import axios from 'axios';
import { clearAllShowcaseCache } from '@/contexts/showcasePersistence';
import { jwtDecode } from 'jwt-decode';
import { Role } from '@/types/profileType';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
axios.defaults.baseURL = BACKEND_URL;

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
  isEmailVerified: boolean;
  accountStatus:
    | 'PENDING_VERIFICATION'
    | 'PENDING_DOCUMENT_REVIEW'
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'BANNED';
  profileCompleted: boolean;
  profile?: Profile;
}

interface DecodedToken {
  sub: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
  isEmailVerified: boolean;
  accountStatus: string;
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

enum DocumentTypes {
  STUDENT_ID = 'STUDENT_ID',
  TRANSCRIPT = 'TRANSCRIPT',
  DEGREE_CERTIFICATE = 'DEGREE_CERTIFICATE',
  ALUMNI_CERTIFICATE = 'ALUMNI_CERTIFICATE',
  EMPLOYMENT_PROOF = 'EMPLOYMENT_PROOF',
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: Role,
    documents: { documentType: DocumentTypes; documentUrl: string }[],
    department?: string,
    graduationYear?: number,
    studentId?: string
  ) => Promise<void>;
  registerWithDocuments: (
    email: string,
    name: string,
    role: Role,
    documents: { documentType: string; documentUrl: string }[],
    department?: string,
    graduationYear?: number,
    studentId?: string
  ) => Promise<string>;
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

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  axios.defaults.baseURL = BACKEND_URL;

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
          isEmailVerified: decoded.isEmailVerified || false,
          accountStatus:
            (decoded.accountStatus as
              | 'PENDING_VERIFICATION'
              | 'PENDING_DOCUMENT_REVIEW'
              | 'ACTIVE'
              | 'SUSPENDED'
              | 'BANNED'
              | undefined) || 'PENDING_VERIFICATION',
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
        // Clear persisted showcase cache if stored token is invalid
        // best-effort; don't block UI
        clearAllShowcaseCache().catch(() => {
          /* ignore */
        });
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
        isEmailVerified: decoded.isEmailVerified || false,
        accountStatus:
          (decoded.accountStatus as
            | 'PENDING_VERIFICATION'
            | 'PENDING_DOCUMENT_REVIEW'
            | 'ACTIVE'
            | 'SUSPENDED'
            | 'BANNED'
            | undefined) || 'PENDING_VERIFICATION',
        profileCompleted: decoded.profileCompleted,
        profile: decoded.profile,
      };

      setToken(accessToken);
      setUser(user);

      localStorage.setItem('token', accessToken);
      console.log('Setting auth header with token:', accessToken);
      console.log('backend url', BACKEND_URL);
      console.log('VITE_BACKEND_URL', import.meta.env.VITE_BACKEND_URL);

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

  const registerWithDocuments = async (
    email: string,
    name: string,
    role: Role,
    documents: { documentType: string; documentUrl: string }[],
    department?: string,
    graduationYear?: number,
    studentId?: string
  ) => {
    try {
      const payload: Record<string, unknown> = {
        email,
        name,
        role,
        documents,
      };

      if (department) payload.department = department;
      if (graduationYear) payload.graduationYear = graduationYear;
      if (studentId) payload.studentId = studentId;

      const response = await axios.post(
        '/auth/register-with-documents',
        payload
      );
      return response?.data?.message || 'Registration submitted successfully';
    } catch (error: unknown) {
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
        isEmailVerified: decoded.isEmailVerified || false,
        accountStatus:
          (decoded.accountStatus as
            | 'PENDING_VERIFICATION'
            | 'PENDING_DOCUMENT_REVIEW'
            | 'ACTIVE'
            | 'SUSPENDED'
            | 'BANNED'
            | undefined) || 'PENDING_VERIFICATION',
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
    // Clear persisted showcase/index cache on logout so no user data remains
    clearAllShowcaseCache().catch(() => {
      /* ignore errors */
    });
  };

  // Cross-tab logout/session expiry handling: if another tab clears the token,
  // remove persisted caches in this tab as well.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'token' && e.newValue === null) {
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        clearAllShowcaseCache().catch(() => {});
      }
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = {
    user,
    token,
    login,
    register,
    registerWithDocuments,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
