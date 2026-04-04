import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, Routine, WorkoutSet, SessionPackage, SessionLog, ClientType, PhysioEvaluation, PhysioSessionNote, Exercise, TrainerRoutine } from "./types";

interface MockBackendState {
    users: UserProfile[];
    routinesByUserId: Record<string, Routine[]>;
    historyByUserId: Record<string, WorkoutSet[]>;

    // Actions
    addUser: (user: Omit<UserProfile, "id">) => UserProfile;
    updateUser: (id: string, updates: Partial<UserProfile>) => void;
    deleteUser: (id: string) => void;
    resetClientPassword: (email: string, newPass: string) => boolean;

    // Sync actions
    syncUserData: (userId: string, routines: Routine[], history: WorkoutSet[]) => void;

    // Admin specific
    getClientsForTrainer: (trainerId: string) => UserProfile[];
    assignRoutineToClient: (clientId: string, routine: Routine) => void;

    // Custom exercises (legacy, kept for compat)
    customExercises: Array<{ id: string; name: string; primaryAxis: string; trackingType: 'reps' | 'time'; trainerId: string }>;
    addCustomExercise: (ex: { name: string; primaryAxis: string; trackingType: 'reps' | 'time'; trainerId: string }) => void;

    // Global exercises: admin-added, visible to ALL clients
    globalExercises: Exercise[];
    addGlobalExercise: (ex: Omit<Exercise, 'id' | 'scope'>, adminId: string) => Exercise;
    updateGlobalExercise: (id: string, updates: Partial<Exercise>) => void;
    deleteGlobalExercise: (id: string) => void;

    // Trainer Routines: templates + client-specific
    trainerRoutines: TrainerRoutine[];
    addTrainerRoutine: (routine: Omit<TrainerRoutine, 'id' | 'createdAt' | 'lastModified'>) => TrainerRoutine;
    updateTrainerRoutine: (id: string, updates: Partial<TrainerRoutine>) => void;
    deleteTrainerRoutine: (id: string) => void;
    duplicateTrainerRoutine: (id: string, trainerId: string) => TrainerRoutine;
    // Assign a template or client-specific routine to a client's active workout store
    assignTrainerRoutineToClient: (routineId: string, clientId: string) => void;

    // ── SESSION SYSTEM ────────────────────────────────────────────────────────
    sessionPackages: SessionPackage[];
    sessionLogs: SessionLog[];
    usedNonces: string[];

    upsertSessionPackage: (pkg: Omit<SessionPackage, 'id' | 'createdAt'>) => SessionPackage;
    logSession: (clientId: string, trainerId: string, nonce: string, method: 'qr_scan' | 'manual') => { success: boolean; error?: string };
    getSessionPackage: (clientId: string) => SessionPackage | undefined;
    getSessionLogs: (clientId: string) => SessionLog[];

    // ── PHYSIO ────────────────────────────────────────────────────────────────
    clientTypes: Record<string, ClientType>;
    physioEvaluations: Record<string, PhysioEvaluation>;
    physioSessionNotes: PhysioSessionNote[];

    setClientType: (clientId: string, type: ClientType) => void;
    savePhysioEvaluation: (clientId: string, evaluation: PhysioEvaluation) => void;
    addPhysioSessionNote: (note: Omit<PhysioSessionNote, 'id'>) => PhysioSessionNote;
}

const initialAdmin: UserProfile = {
    id: "admin-1",
    email: "admin@test.com",
    password: "password123",
    role: "admin",
    name: "Master Trainer",
};

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
            customExercises: [],
            globalExercises: [],
            trainerRoutines: [],
            sessionPackages: [],
            sessionLogs: [],
            usedNonces: [],
            clientTypes: {},
            physioEvaluations: {},
            physioSessionNotes: [],

            addUser: (userData) => {
                const newUser: UserProfile = { ...userData, id: crypto.randomUUID() };
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
                    set((s) => ({ users: s.users.map(u => u.id === user.id ? { ...u, password: newPass } : u) }));
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
                return get().users.filter(u => u.role === "client" && u.trainerId === trainerId);
            },

            addCustomExercise: (ex) => set(state => ({
                customExercises: [...state.customExercises, { ...ex, id: `custom_${Date.now()}` }]
            })),

            addGlobalExercise: (ex, adminId) => {
                const newEx: Exercise = {
                    ...ex,
                    id: `global_${Date.now().toString(36)}`,
                    scope: 'global',
                    createdBy: adminId,
                };
                set(state => ({ globalExercises: [...state.globalExercises, newEx] }));
                return newEx;
            },

            updateGlobalExercise: (id, updates) => set(state => ({
                globalExercises: state.globalExercises.map(e => e.id === id ? { ...e, ...updates } : e)
            })),

            deleteGlobalExercise: (id) => set(state => ({
                globalExercises: state.globalExercises.filter(e => e.id !== id)
            })),

            // ── TRAINER ROUTINES ─────────────────────────────────────────────

            addTrainerRoutine: (routine) => {
                const newRoutine: TrainerRoutine = {
                    ...routine,
                    id: `tr_${Date.now().toString(36)}`,
                    createdAt: Date.now(),
                    lastModified: Date.now(),
                };
                set(state => ({ trainerRoutines: [...state.trainerRoutines, newRoutine] }));
                return newRoutine;
            },

            updateTrainerRoutine: (id, updates) => set(state => ({
                trainerRoutines: state.trainerRoutines.map(r =>
                    r.id === id ? { ...r, ...updates, lastModified: Date.now() } : r
                )
            })),

            deleteTrainerRoutine: (id) => set(state => ({
                trainerRoutines: state.trainerRoutines.filter(r => r.id !== id)
            })),

            duplicateTrainerRoutine: (id, trainerId) => {
                const state = get();
                const original = state.trainerRoutines.find(r => r.id === id);
                if (!original) throw new Error('Routine not found');
                const copy: TrainerRoutine = {
                    ...original,
                    id: `tr_${Date.now().toString(36)}`,
                    name: `${original.name} (Copy)`,
                    trainerId,
                    assignedTo: undefined, // copies are unassigned by default
                    scope: 'template', // copies start as templates
                    createdAt: Date.now(),
                    lastModified: Date.now(),
                };
                set(state => ({ trainerRoutines: [...state.trainerRoutines, copy] }));
                return copy;
            },

            assignTrainerRoutineToClient: (routineId, clientId) => {
                const state = get();
                const tr = state.trainerRoutines.find(r => r.id === routineId);
                if (!tr) return;
                // Build a Routine compatible with the client's store
                const clientRoutine: Routine = {
                    id: `assigned_${routineId}_${clientId}_${Date.now().toString(36)}`,
                    name: tr.name,
                    description: tr.description,
                    rationale: `Assigned by trainer.`,
                    days: tr.days,
                    currentDayIndex: 0,
                    startDate: Date.now(),
                    lastModified: Date.now(),
                    authorId: tr.trainerId,
                };
                const clientRoutines = state.routinesByUserId[clientId] || [];
                set(st => ({
                    routinesByUserId: {
                        ...st.routinesByUserId,
                        [clientId]: [...clientRoutines, clientRoutine]
                    }
                }));
            },

            assignRoutineToClient: (clientId, routine) => set((state) => {
                const clientRoutines = state.routinesByUserId[clientId] || [];
                if (clientRoutines.some(r => r.id === routine.id)) return state;
                return { routinesByUserId: { ...state.routinesByUserId, [clientId]: [...clientRoutines, routine] } };
            }),

            // ── SESSION ACTIONS ───────────────────────────────────────────────

            upsertSessionPackage: (pkg) => {
                const state = get();
                const existing = state.sessionPackages.find(p => p.clientId === pkg.clientId);
                if (existing) {
                    const updated: SessionPackage = { ...existing, ...pkg };
                    set(s => ({ sessionPackages: s.sessionPackages.map(p => p.clientId === pkg.clientId ? updated : p) }));
                    return updated;
                }
                const newPkg: SessionPackage = { ...pkg, id: crypto.randomUUID(), createdAt: Date.now() };
                set(s => ({ sessionPackages: [...s.sessionPackages, newPkg] }));
                return newPkg;
            },

            logSession: (clientId, trainerId, nonce, method) => {
                const state = get();

                if (state.usedNonces.includes(nonce)) {
                    return { success: false, error: 'This QR code has already been used.' };
                }

                const pkg = state.sessionPackages.find(p => p.clientId === clientId);
                if (!pkg) return { success: false, error: 'No session package found for this client.' };
                if (pkg.sessionsRemaining <= 0) return { success: false, error: 'No sessions remaining in this package.' };
                if (pkg.expiryDate && Date.now() > pkg.expiryDate) {
                    return { success: false, error: 'Session package has expired.' };
                }

                const log: SessionLog = {
                    id: crypto.randomUUID(),
                    clientId,
                    trainerId,
                    timestamp: Date.now(),
                    verificationMethod: method,
                    status: 'completed',
                    nonce,
                };

                set(s => ({
                    sessionLogs: [...s.sessionLogs, log],
                    usedNonces: [...s.usedNonces, nonce],
                    sessionPackages: s.sessionPackages.map(p =>
                        p.clientId === clientId
                            ? { ...p, sessionsUsed: p.sessionsUsed + 1, sessionsRemaining: p.sessionsRemaining - 1 }
                            : p
                    )
                }));
                return { success: true };
            },

            getSessionPackage: (clientId) => get().sessionPackages.find(p => p.clientId === clientId),

            getSessionLogs: (clientId) => get().sessionLogs
                .filter(l => l.clientId === clientId)
                .sort((a, b) => b.timestamp - a.timestamp),

            // ── PHYSIO ACTIONS ───────────────────────────────────────────────

            setClientType: (clientId, type) => set(s => ({
                clientTypes: { ...s.clientTypes, [clientId]: type }
            })),

            savePhysioEvaluation: (clientId, evaluation) => set(s => ({
                physioEvaluations: { ...s.physioEvaluations, [clientId]: evaluation }
            })),

            addPhysioSessionNote: (noteData) => {
                const newNote: PhysioSessionNote = { ...noteData, id: crypto.randomUUID() };
                set(s => ({ physioSessionNotes: [...s.physioSessionNotes, newNote] }));
                return newNote;
            },
        }),
        { name: "pt_mock_backend" }
    )
);
