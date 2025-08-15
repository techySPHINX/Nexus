import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Export enums and types that will be used in other files
export enum Role {
    STUDENT = 'STUDENT',
    ALUM = 'ALUM',
    ADMIN = 'ADMIN'
}

export enum ConnectionStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    BLOCKED = 'BLOCKED'
}

export interface User {
    id: string;
    name: string;
    email: string;
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
    id: string;
    name: string;
    icon: string;
    assignedAt?: string;
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
    profile: Profile | null;
    badges: ProfileBadge[];
    //   connections: Connection[];
    loading: boolean;
    error: string;
    refreshProfile: () => Promise<void>;
    endorseSkill: (skillId: string) => Promise<void>;
    awardBadge: (userId: string, badgeId: string) => Promise<void>;
    //   handleConnection: (userId: string, action: 'accept' | 'reject') => Promise<void>;
    setError: (error: string) => void;
}

const ProfileContext = createContext<ProfileContextType>({
    profile: null,
    badges: [],
    //   connections: [],
    loading: false,
    error: '',
    refreshProfile: async () => { },
    endorseSkill: async () => { },
    awardBadge: async () => { },
    //   handleConnection: async () => {},
    setError: () => { }
});

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [badges, setBadges] = useState<ProfileBadge[]>([]);
    //   const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const api = axios.create({
        baseURL: 'http://localhost:3000', // Your backend URL
    });

    // Add interceptors for auth tokens if needed
    api.interceptors.request.use(config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    const fetchProfileData = async () => {
        if (!user?.id || !token) {
            console.log('Missing user ID or token');
            return;
        }

        console.log('Starting profile fetch...');
        setLoading(true);
        try {
            console.log(`Fetching profile`);
            const profileRes = await api.get(`/profile/${user.id}`, {
                
            });

            console.log('Profile response:', profileRes.data); // Add this

            // Update state immediately after profile fetch
            setProfile(profileRes.data);

            // Then fetch additional data
            const [badgesRes] = await Promise.all([
                api.get(`/profile/${user.id}/badges`, {
                   
                })
            ]);

            setBadges(badgesRes.data);

        } catch (err: any) {
            console.error('Full fetch error:', {
                error: err,
                response: err.response?.data,
                status: err.response?.status
            });
            setError(err.response?.data?.message || 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        console.log('Manual refresh triggered');
        await fetchProfileData();
    };

    const endorseSkill = async (skillId: string) => {
        if (!profile) return;
        try {
            await api.post(`/profile/${profile.id}/endorse`,
                { skillId }
            );
            await refreshProfile();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to endorse skill');
        }
    };

    const awardBadge = async (userId: string, badgeId: string) => {
        try {
            await api.post(`/profile/${userId}/award-badge`,
                { badgeId }
            );
            await refreshProfile();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to award badge');
        }
    };

    //   const handleConnection = async (userId: string, action: 'accept' | 'reject') => {
    //     try {
    //       await api.put(`/profile/connections/${userId}`, 
    //         { action },
    //         { headers: { Authorization: `Bearer ${token}` } }
    //       );
    //       await refreshProfile();
    //     } catch (err: any) {
    //       setError(err.response?.data?.message || 'Failed to update connection');
    //     }
    //   };

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        if (!user?.id || !token) return;
        const fetchData = async () => {
            if (!user?.id) return;

            setLoading(true);
            try {
                const [profileRes, badgesRes] = await Promise.all([
                    api.get(`/profile/${user.id}`, { signal: controller.signal}),
                    api.get(`/profile/${user.id}/badges`, { signal: controller.signal })
                ]);

                if (isMounted) {
                    setProfile(profileRes.data);
                    setBadges(badgesRes.data);
                }
            } catch (err: any) {
                if (isMounted && !axios.isCancel(err)) {
                    setError(err.response?.data?.message || 'Failed to fetch profile data');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [user?.id, token]);

    return (
        <ProfileContext.Provider value={{
            profile,
            badges,
            loading,
            error,
            refreshProfile: async () => {
                console.log('Manual refresh triggered');
                await fetchProfileData();
            },
            endorseSkill,
            awardBadge,
            setError // Make sure to include setError in the context value
        }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => useContext(ProfileContext);