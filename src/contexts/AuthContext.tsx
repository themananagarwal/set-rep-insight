import { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile } from '../lib/types';
import { useMockBackendStore } from '../lib/mockBackend';
import { useTrainerStore } from '../lib/store';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    viewMode: "admin" | "client";
    switchViewMode: (mode: "admin" | "client") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"admin" | "client">("client");

    const backendUsers = useMockBackendStore(state => state.users);
    const routinesByUserId = useMockBackendStore(state => state.routinesByUserId);
    const historyByUserId = useMockBackendStore(state => state.historyByUserId);

    const trainerStore = useTrainerStore();

    // Auto-login from memory (mock session persistence)
    useEffect(() => {
        const savedSession = localStorage.getItem('pt_mock_session');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed.userId) {
                    const foundUser = backendUsers.find(u => u.id === parsed.userId);
                    if (foundUser) {
                        setUser(foundUser);
                        trainerStore.setUser(foundUser);
                        
                        // Hydrate view mode
                        const savedMode = localStorage.getItem('pt_view_mode');
                        if (savedMode === 'admin' && foundUser.role === 'admin') {
                            setViewMode('admin');
                        } else {
                            setViewMode('client');
                            // If they are a client (or an admin impersonating a client), hydrate their workouts
                            useTrainerStore.setState({
                               routines: routinesByUserId[foundUser.id] || [],
                               history: historyByUserId[foundUser.id] || []
                           });
                        }
                    }
                }
            } catch (e) {
                console.error("Session parse error", e);
            }
        }
        setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const login = async (email: string, password?: string) => {
        setLoading(true);
        // Simulate network
        await new Promise(resolve => setTimeout(resolve, 300));

        const foundUser = backendUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!foundUser) {
            setLoading(false);
            return { error: 'Invalid credentials or user does not exist.' };
        }

        // Mock password check
        if (password && foundUser.password && foundUser.password !== password) {
             setLoading(false);
             return { error: 'Invalid credentials.' };
        }

        setUser(foundUser);
        localStorage.setItem('pt_mock_session', JSON.stringify({ userId: foundUser.id }));
        
        // Sync to trainer store
        trainerStore.setUser(foundUser);

        // Determine view mode
        const initialMode = foundUser.role === "admin" ? "admin" : "client";
        setViewMode(initialMode);
        localStorage.setItem('pt_view_mode', initialMode);
        
        // Sync history and routines if entering client mode
        if (initialMode === "client") {
            const routines = useMockBackendStore.getState().routinesByUserId[foundUser.id] || [];
            const history = useMockBackendStore.getState().historyByUserId[foundUser.id] || [];
            useTrainerStore.setState({ routines, history });
        }

        setLoading(false);
        return {};
    };

    const switchViewMode = (mode: "admin" | "client") => {
        if (!user) return;
        setViewMode(mode);
        localStorage.setItem('pt_view_mode', mode);

        if (mode === "client") {
            // Hydrate client data when switching into client mode
            const routines = useMockBackendStore.getState().routinesByUserId[user.id] || [];
            const history = useMockBackendStore.getState().historyByUserId[user.id] || [];
            useTrainerStore.setState({ routines, history });
        }
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem('pt_mock_session');
        localStorage.removeItem('pt_view_mode');
        trainerStore.setUser(null); // Clear local store user
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, viewMode, switchViewMode }}>
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
