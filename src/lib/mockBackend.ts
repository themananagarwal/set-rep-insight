import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, Routine, WorkoutSet } from "./types";

interface MockBackendState {
    users: UserProfile[];
    routinesByUserId: Record<string, Routine[]>;
    historyByUserId: Record<string, WorkoutSet[]>;

    // Actions
    addUser: (user: Omit<UserProfile, "id">) => UserProfile;
    updateUser: (id: string, updates: Partial<UserProfile>) => void;
    deleteUser: (id: string) => void;
    resetClientPassword: (email: string, newPass: string) => boolean;
    
    // Sync actions (called by TrainerStore when current user changes things)
    syncUserData: (userId: string, routines: Routine[], history: WorkoutSet[]) => void;
    
    // Admin specific
    getClientsForTrainer: (trainerId: string) => UserProfile[];
    assignRoutineToClient: (clientId: string, routine: Routine) => void;
}

// Initial Admin User for POC
const initialAdmin: UserProfile = {
    id: "admin-1",
    email: "admin@test.com",
    password: "password123",
    role: "admin",
    name: "Master Trainer",
};

// Initial Client User for POC
const initialClient: UserProfile = {
    id: "client-1",
    email: "client@test.com",
    password: "password123",
    role: "client",
    trainerId: "admin-1",
    name: "Test Client",
    gender: "male",
    weight: 80,
    height: 180,
    goal: "hypertrophy",
    activityLevel: "active",
};

export const useMockBackendStore = create<MockBackendState>()(
    persist(
        (set, get) => ({
            users: [initialAdmin, initialClient],
            routinesByUserId: {},
            historyByUserId: {},

            addUser: (userData) => {
                const newUser: UserProfile = {
                    ...userData,
                    id: crypto.randomUUID(),
                };
                set((state) => ({
                    users: [...state.users, newUser],
                    routinesByUserId: { ...state.routinesByUserId, [newUser.id]: [] },
                    historyByUserId: { ...state.historyByUserId, [newUser.id]: [] },
                }));
                return newUser;
            },

            updateUser: (id, updates) => set((state) => ({
                users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
            })),

            resetClientPassword: (email, newPass) => {
                const state = get();
                const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (user) {
                    set((s) => ({
                        users: s.users.map(u => u.id === user.id ? { ...u, password: newPass } : u)
                    }));
                    return true;
                }
                return false;
            },

            deleteUser: (id) => set((state) => {
                const newRoutines = { ...state.routinesByUserId };
                delete newRoutines[id];
                const newHistory = { ...state.historyByUserId };
                delete newHistory[id];
                
                return {
                    users: state.users.filter(u => u.id !== id),
                    routinesByUserId: newRoutines,
                    historyByUserId: newHistory,
                };
            }),

            syncUserData: (userId, routines, history) => set((state) => ({
                routinesByUserId: { ...state.routinesByUserId, [userId]: routines },
                historyByUserId: { ...state.historyByUserId, [userId]: history },
            })),

            getClientsForTrainer: (trainerId) => {
                const state = get();
                return state.users.filter(u => u.role === "client" && u.trainerId === trainerId);
            },

            assignRoutineToClient: (clientId, routine) => set((state) => {
                const clientRoutines = state.routinesByUserId[clientId] || [];
                // Check if already assigned to avoid duplicates (by ID)
                if (clientRoutines.some(r => r.id === routine.id)) return state;
                
                return {
                    routinesByUserId: {
                        ...state.routinesByUserId,
                        [clientId]: [...clientRoutines, routine]
                    }
                };
            }),
        }),
        {
            name: "pt_mock_backend",
        }
    )
);
