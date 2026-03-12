import {
  FC,
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { isAxiosError, setApiAccessToken } from '@/services/api';
type UserRole = 'STUDENT' | 'ALUM' | 'ADMIN' | 'MENTOR';

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
  gender?: string;
  skills?: { name: string }[];
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
    role: UserRole,
    documents: { documentType: DocumentTypes; documentUrl: string }[],
    department?: string,
    graduationYear?: number,
    studentId?: string
  ) => Promise<void>;
  registerWithDocuments: (
    email: string,
    name: string,
    role: UserRole,
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

  // On mount: attempt silent token refresh using the refresh_token httpOnly
  // cookie. This restores session state after a page reload without storing
  // the access token in localStorage (Issue #164).
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await api.post<AuthResponse>('/auth/refresh', {});
        const { accessToken } = response.data;
        const decoded: DecodedToken = jwtDecode(accessToken);
        const restoredUser: User = {
          id: decoded.sub,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
          isEmailVerified: decoded.isEmailVerified || false,
          accountStatus:
            (decoded.accountStatus as User['accountStatus']) ||
            'PENDING_VERIFICATION',
          profileCompleted: decoded.profileCompleted,
          profile: decoded.profile,
        };
        setToken(accessToken);
        setApiAccessToken(accessToken);
        setUser(restoredUser);
      } catch {
        // No valid refresh cookie — user must log in again.
        setToken(null);
        setApiAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { accessToken } = response.data;
      const decoded: DecodedToken = jwtDecode(accessToken);

      const loggedInUser: User = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        isEmailVerified: decoded.isEmailVerified || false,
        accountStatus:
          (decoded.accountStatus as User['accountStatus']) ||
          'PENDING_VERIFICATION',
        profileCompleted: decoded.profileCompleted,
        profile: decoded.profile,
      };

      // Store token in memory state only — httpOnly cookie is set by the
      // backend and sent automatically; no localStorage needed (Issue #164).
      setToken(accessToken);
      setApiAccessToken(accessToken);
      setUser(loggedInUser);
      // Store non-sensitive user metadata for service-layer role checks.
      localStorage.setItem('user', JSON.stringify(loggedInUser));
    } catch (error: unknown) {
      console.error('Login error:', error);
      let message = 'Login failed. Please try again.';
      if (
        isAxiosError(error) &&
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
    role: UserRole,
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

      const response = await api.post('/auth/register-with-documents', payload);
      return response?.data?.message || 'Registration submitted successfully';
    } catch (error: unknown) {
      let message = 'Registration failed. Please try again.';
      if (
        isAxiosError(error) &&
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
      const response = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        name,
        role,
      });

      const { accessToken } = response.data;
      const decoded: DecodedToken = jwtDecode(accessToken);

      const registeredUser: User = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        isEmailVerified: decoded.isEmailVerified || false,
        accountStatus:
          (decoded.accountStatus as User['accountStatus']) ||
          'PENDING_VERIFICATION',
        profileCompleted: decoded.profileCompleted,
        profile: decoded.profile,
      };

      setToken(accessToken);
      setApiAccessToken(accessToken);
      setUser(registeredUser);
      localStorage.setItem('user', JSON.stringify(registeredUser));
    } catch (error: unknown) {
      console.error('Register error:', error);
      let message = 'Registration failed. Please try again.';
      if (
        isAxiosError(error) &&
        error.response &&
        error.response.data &&
        typeof error.response.data.message === 'string'
      ) {
        message = error.response.data.message;
      }
      throw new Error(message);
    }
  };

  // Helper to read the CSRF token from the non-httpOnly cookie set by the backend.
  // /auth/logout is not in the CSRF exempt list, so the header must be attached
  // (Copilot recommendation from PR #210).
  const getCsrfToken = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrf-token='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
  };

  const logout = async () => {
    try {
      // Ask the backend to clear the httpOnly auth cookies server-side.
      const csrfToken = getCsrfToken();
      await api.post(
        '/auth/logout',
        {},
        csrfToken ? { headers: { 'X-CSRF-Token': csrfToken } } : undefined
      );
    } catch {
      // Ignore errors — proceed with local state cleanup regardless.
    }
    setToken(null);
    setApiAccessToken(null);
    setUser(null);
    localStorage.removeItem('user');
  };

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
