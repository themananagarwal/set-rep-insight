import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    location: string;
    role: 'user' | 'admin';
    status: 'pending' | 'approved' | 'rejected';
    referred_by?: string;
    height?: number; // cm
    weight?: number; // kg
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null }; error: any }>;
    signOut: () => Promise<void>;
    refreshProfile: (userId?: string) => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const BYPASS_AUTH = true; // Set to true to disable login gate

    // Helper to fetch profile
    const fetchProfile = async (userId: string) => {
        if (BYPASS_AUTH) {
            // Check local store for stats
            const ptStorage = localStorage.getItem('pt_storage');
            let weight: number | undefined;
            let height: number | undefined;
            let fullName: string = 'Offline User';
            
            if (ptStorage) {
                try {
                    const parsed = JSON.parse(ptStorage);
                    weight = parsed.state?.user?.weight;
                    height = parsed.state?.user?.height;
                    fullName = parsed.state?.user?.name || 'Offline User';
                } catch (e) { }
            }

            setProfile({
                id: userId,
                email: 'offline@user.local',
                full_name: fullName,
                phone: '',
                location: '',
                role: 'admin',
                status: 'approved',
                height: height,
                weight: weight
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error("[Auth] Profile Fetch Error:", error);
            }

            if (data) {
                setProfile(data as Profile);
            } else {
                setProfile(null);
            }
        } catch (err) {
            console.error("[Auth] Unexpected Profile Error:", err);
            setProfile(null);
        }
    };

    useEffect(() => {
        if (BYPASS_AUTH) {
            const mockUser = { id: 'offline-user', email: 'offline@user.local' } as User;
            setUser(mockUser);
            setSession({ user: mockUser } as Session);
            fetchProfile('offline-user');
            setLoading(false);
            return;
        }

        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string) => {
        if (BYPASS_AUTH) {
            const mockUser = { id: 'user-' + Date.now(), email } as User;
            setUser(mockUser);
            setSession({ user: mockUser } as Session);
            return { data: { user: mockUser, session: { user: mockUser } as Session }, error: null };
        }
        return await supabase.auth.signUp({
            email,
            password,
        });
    };

    const signIn = async (email: string, password: string) => {
        if (BYPASS_AUTH) {
            const mockUser = { id: 'offline-user', email } as User;
            setUser(mockUser);
            setSession({ user: mockUser } as Session);
            fetchProfile('offline-user');
            return { error: null };
        }
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    };

    const signOut = async () => {
        if (BYPASS_AUTH) {
            setUser(null);
            setSession(null);
            setProfile(null);
            return;
        }
        await supabase.auth.signOut();
        setProfile(null);
    };

    const refreshProfile = async (userId?: string) => {
        const idToFetch = userId || user?.id;
        if (idToFetch) {
            await fetchProfile(idToFetch);
        }
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        const idToUpdate = user?.id || 'offline-user';
        
        if (BYPASS_AUTH) {
            const newProfile = profile ? { ...profile, ...updates } : { 
                id: idToUpdate, 
                email: user?.email || 'offline@user.local', 
                full_name: 'User', 
                phone: '', 
                location: '', 
                role: 'user' as const, 
                status: 'approved' as const,
                ...updates 
            };
            setProfile(newProfile);
            
            // Persist the essential stats to the local trainer store if needed
            const ptStorage = localStorage.getItem('pt_storage');
            if (ptStorage) {
                try {
                    const parsed = JSON.parse(ptStorage);
                    if (updates.weight || updates.height) {
                        if (!parsed.state.user) parsed.state.user = {};
                        if (updates.weight) parsed.state.user.weight = updates.weight;
                        if (updates.height) parsed.state.user.height = updates.height;
                        localStorage.setItem('pt_storage', JSON.stringify(parsed));
                    }
                } catch (e) {}
            }
            return;
        }

        if (!user) return;
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (!error) {
            await fetchProfile(user.id);
        } else {
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, refreshProfile, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
