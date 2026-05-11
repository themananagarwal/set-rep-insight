import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { UserProfile } from '../lib/types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getProfile } from '../lib/db';
import { useMockBackendStore } from '../lib/mockBackend';
import { useTrainerStore } from '../lib/store';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    forgotPassword: (email: string) => Promise<{ error?: string }>;
    viewMode: 'admin' | 'client';
    switchViewMode: (mode: 'admin' | 'client') => void;
    sessionData: any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helpers ────────────────────────────────────────────────────────────────

function hydrateClientStore(userId: string) {
    if (isSupabaseConfigured) return;
    const { routinesByUserId, historyByUserId } = useMockBackendStore.getState();
    useTrainerStore.setState({
        routines: routinesByUserId[userId] || [],
        history: historyByUserId[userId] || [],
    });
}

/** Fetch profile, retrying up to `retries` times to handle DB trigger lag. */
async function fetchProfileWithRetry(userId: string, retries = 4): Promise<UserProfile | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const p = await getProfile(userId);
            if (p) return p;
        } catch { /* ignore transient errors */ }
        if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
    }
    return null;
}

// ── Provider ───────────────────────────────────────────────────────────────

const PROTOTYPE_MODE = true; // Instantly bypasses login for co-founder demo

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [sessionData, setSessionData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'admin' | 'client'>('client');
    const trainerStore = useTrainerStore();

    // Guard against setting state after unmount
    const mounted = useRef(true);

    // ── View mode helpers ─────────────────────────────────────────────────
    const applyViewMode = (profile: UserProfile) => {
        const saved = localStorage.getItem('pt_view_mode');
        const mode: 'admin' | 'client' =
            (saved === 'admin' && profile.role === 'admin') ? 'admin' : 'client';
        if (mounted.current) setViewMode(mode);
        return mode;
    };

    // ── Session init ──────────────────────────────────────────────────────
    useEffect(() => {
        mounted.current = true;

        if (PROTOTYPE_MODE) {
            console.warn("⚠️ PROTOTYPE MODE: Auto-authenticating as Admin to bypass login!");
            
            // Wait for next tick so mockBackend is definitely initialized if there are circular deps
            setTimeout(() => {
                const mockAdmin: UserProfile = {
                    id: "admin-prototype",
                    email: "founder@ptapp.demo",
                    name: "Lead Trainer",
                    role: "admin",
                };
                setUser(mockAdmin);
                trainerStore.setUser(mockAdmin);
                setViewMode('admin');

                // Inject a mock session package so the prototype can demonstrate the PT client workflow
                useMockBackendStore.getState().upsertSessionPackage({
                    clientId: "admin-prototype",
                    totalSessions: 10,
                    sessionsUsed: 2,
                    sessionsRemaining: 8,
                    packageType: "monthly",
                });
                
                setLoading(false);
            }, 0);
            
            return () => { mounted.current = false; };
        }

        if (!isSupabaseConfigured) {
            // ── Mock mode ──────────────────────────────────────────────
            const savedSession = localStorage.getItem('pt_mock_session');
            if (savedSession) {
                try {
                    const { userId } = JSON.parse(savedSession);
                    const foundUser = useMockBackendStore.getState().users.find(u => u.id === userId);
                    if (foundUser) {
                        setUser(foundUser);
                        trainerStore.setUser(foundUser);
                        const mode = applyViewMode(foundUser);
                        if (mode === 'client') hydrateClientStore(foundUser.id);
                    }
                } catch { /* ignore */ }
            }
            setLoading(false);
            return () => { mounted.current = false; };
        }

        // ── Supabase mode ─────────────────────────────────────────────
        // The recommended pattern: rely on onAuthStateChange for ALL hydration.
        // INITIAL_SESSION fires synchronously on mount if a session exists in
        // localStorage — this fires BEFORE getSession().then() resolves.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log('[Auth] event:', event, 'user:', session?.user?.id ?? 'none');

                if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
                    if (mounted.current) {
                        setSessionData(null);
                    }
                    return;
                }

                if (
                    event === 'INITIAL_SESSION' ||
                    event === 'SIGNED_IN' ||
                    event === 'TOKEN_REFRESHED' ||
                    event === 'USER_UPDATED'
                ) {
                    if (mounted.current) {
                        setSessionData(session || null);
                    }
                }
            }
        );

        // Safety net: if onAuthStateChange never fires (e.g. network issue),
        // unblock the loading spinner after 6 seconds.
        const safetyTimeout = setTimeout(() => {
            if (mounted.current) setLoading(false);
        }, 6000);

        return () => {
            mounted.current = false;
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effect: Decouple profile fetching from Auth event loop to prevent getSession deadlock!
    useEffect(() => {
        let active = true;

        if (PROTOTYPE_MODE) return;
        if (!isSupabaseConfigured) return;

        if (!sessionData?.user?.id) {
            setUser(null);
            trainerStore.setUser(null);
            setViewMode('client');
            setLoading(false);
            return;
        }

        const loadProfile = async () => {
            setLoading(true);
            const profile = await fetchProfileWithRetry(sessionData.user.id);
            if (!active) return;

            if (profile) {
                setUser(profile);
                trainerStore.setUser(profile);
                applyViewMode(profile);
            } else {
                console.warn('[Auth] Profile not found for user:', sessionData.user.id);
                setUser(null);
                trainerStore.setUser(null);
            }
            setLoading(false);
        };

        loadProfile();

        return () => { active = false; };
    }, [sessionData?.user?.id]);

    // ── LOGIN ──────────────────────────────────────────────────────────────
    const login = async (email: string, password?: string): Promise<{ error?: string }> => {
        if (!isSupabaseConfigured) {
            // Mock fallback
            await new Promise(r => setTimeout(r, 300));
            const backendUsers = useMockBackendStore.getState().users;
            const foundUser = backendUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!foundUser) return { error: 'Invalid credentials.' };
            if (password && foundUser.password && foundUser.password !== password) {
                return { error: 'Invalid credentials.' };
            }
            setUser(foundUser);
            localStorage.setItem('pt_mock_session', JSON.stringify({ userId: foundUser.id }));
            trainerStore.setUser(foundUser);
            const mode = foundUser.role === 'admin' ? 'admin' : 'client';
            setViewMode(mode);
            localStorage.setItem('pt_view_mode', mode);
            if (mode === 'client') hydrateClientStore(foundUser.id);
            return {};
        }

        // Supabase: signInWithPassword triggers onAuthStateChange(SIGNED_IN)
        // which handles profile hydration — no need to do it here.
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: password || '',
        });
        if (error) return { error: error.message };

        // Set viewMode after profile is hydrated by onAuthStateChange.
        // We wait briefly for the listener to run.
        await new Promise(r => setTimeout(r, 800));
        const currentUser = useMockBackendStore.getState; // not used, just a tick
        void currentUser;

        return {};
    };

    // ── FORGOT PASSWORD ────────────────────────────────────────────────────
    const forgotPassword = async (email: string): Promise<{ error?: string }> => {
        if (!isSupabaseConfigured) return {};
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return { error: error.message };
        return {};
    };

    // ── SWITCH VIEW MODE ───────────────────────────────────────────────────
    const switchViewMode = (mode: 'admin' | 'client') => {
        if (!user) return;
        setViewMode(mode);
        localStorage.setItem('pt_view_mode', mode);
        if (mode === 'client' && !isSupabaseConfigured) {
            hydrateClientStore(user.id);
        }
    };

    // ── LOGOUT ─────────────────────────────────────────────────────────────
    const logout = async () => {
        if (isSupabaseConfigured) {
            await supabase.auth.signOut(); // triggers SIGNED_OUT in listener
        } else {
            setUser(null);
        }
        localStorage.removeItem('pt_mock_session');
        localStorage.removeItem('pt_view_mode');
        trainerStore.setUser(null);
        useTrainerStore.setState({ routines: [], history: [] });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, forgotPassword, viewMode, switchViewMode, sessionData }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
