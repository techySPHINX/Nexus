import React, { ReactNode } from 'react';
interface User {
    id: string;
    email: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
    profileCompleted: boolean;
}
interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, role: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}
export declare const useAuth: () => AuthContextType;
interface AuthProviderProps {
    children: ReactNode;
}
export declare const AuthProvider: React.FC<AuthProviderProps>;
export {};
