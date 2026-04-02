import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, WorkoutSet, Exercise, Prediction, Routine } from "./types";
import { predictNextSet } from "./ai";
import { ALL_EXERCISES } from "./exercises";

interface TrainerState {
    user: UserProfile | null;
    history: WorkoutSet[];
    exercises: Exercise[];
    routines: Routine[];
    activeRoutineId: string | null;
    onTheGoSession: { startTime: number; exercises: { exerciseId: string; targetSets: number }[] } | null;

    // Actions
    setUser: (user: UserProfile) => void;

    // Routine Management
    addRoutine: (routine: Routine) => void;
    updateRoutine: (id: string, updates: Partial<Routine>) => void;
    deleteRoutine: (id: string) => void;
    setActiveRoutine: (id: string) => void;

    // Legacy mapping (virtual)
    setRoutine: (routine: Routine) => void; // Keeps backward compat for now

    addSet: (set: WorkoutSet) => void;
    addExercise: (name: string, muscle: string, trackingType: "reps" | "time") => void;
    completeActiveRoutineDay: () => void;
    getPrediction: (exerciseId: string) => Prediction;
    syncExercises: () => void;
    updateExerciseDef: (id: string, name: string, muscle: string, trackingType: "reps" | "time") => void;
    deleteExerciseDef: (id: string) => void;
    setExerciseNote: (id: string, notes: string) => void;
    
    startOnTheGo: () => void;
    endOnTheGo: () => void;
    addExerciseToOnTheGo: (exerciseId: string) => void;
    
    applySchedulePatch: (patch: import("./program-adjustment").PlanPatch) => void;
}

export const useTrainerStore = create<TrainerState>()(
    persist(
        (set, get) => ({
            user: null,
            history: [],
            exercises: ALL_EXERCISES.map(def => ({
                id: def.id,
                name: def.name,
                muscle: def.primaryAxis,
                trackingType: (def.primaryAxis === "Cardio" || def.id === "plank" ? "time" : "reps") as "reps" | "time"
            })),
            routines: [],
            activeRoutineId: null,
            onTheGoSession: null,

            setUser: (user) => set({ user }),

            // Routine Actions
            addRoutine: (routine) => set((state) => ({
                routines: [...state.routines, routine],
                activeRoutineId: state.activeRoutineId || routine.id // Auto-activate if first
            })),

            updateRoutine: (id, updates) => set((state) => ({
                routines: state.routines.map(r => r.id === id ? { ...r, ...updates, lastModified: Date.now() } : r)
            })),

            deleteRoutine: (id) => set((state) => ({
                routines: state.routines.filter(r => r.id !== id),
                activeRoutineId: state.activeRoutineId === id ? null : state.activeRoutineId
            })),

            setActiveRoutine: (id) => set({ activeRoutineId: id }),

            // Legacy Support: setRoutine just overwrites the list with 1 item or updates active
            setRoutine: (routine) => set(() => {
                // If routine exists, update it? No, legacy behavior was "replace current".
                // We'll treat this as "Create/Replace the Main Plan".
                return {
                    routines: [routine],
                    activeRoutineId: routine.id
                };
            }),

            addSet: (newSet) => set((state) => ({
                history: [...state.history, newSet]
            })),

            addExercise: (name, muscle, trackingType) => set((state) => {
                const newEx: Exercise = {
                    id: name.toLowerCase().replace(/\s/g, '_'),
                    name,
                    muscle,
                    trackingType
                };
                return { exercises: [...state.exercises, newEx] };
            }),

            completeActiveRoutineDay: () => set((state) => {
                if (!state.activeRoutineId) return {};

                const routine = state.routines.find(r => r.id === state.activeRoutineId);
                if (!routine) return {};

                const nextDayIndex = (routine.currentDayIndex + 1) % routine.days.length;

                const updatedRoutine = {
                    ...routine,
                    currentDayIndex: nextDayIndex,
                    lastModified: Date.now()
                };

                return {
                    routines: state.routines.map(r => r.id === routine.id ? updatedRoutine : r)
                };
            }),

            getPrediction: (exerciseId) => {
                const { history, user } = get();
                return predictNextSet(exerciseId, history, user);
            },

            syncExercises: () => set((state) => {
                const currentIds = new Set(state.exercises.map(e => e.id));
                const missing = ALL_EXERCISES.filter(e => !currentIds.has(e.id));

                if (missing.length === 0) return {};

                return {
                    exercises: [...state.exercises, ...missing.map(def => ({
                        id: def.id,
                        name: def.name,
                        muscle: def.primaryAxis,
                        trackingType: (def.primaryAxis === "Cardio" || def.id === "plank" ? "time" : "reps") as "reps" | "time"
                    }))]
                };
            }),

            updateExerciseDef: (id, name, muscle, trackingType) => set((state) => ({
                exercises: state.exercises.map(e => e.id === id ? { ...e, name, muscle, trackingType } : e)
            })),

            deleteExerciseDef: (id) => set((state) => {
                // Prevent deleting system exercises (those in ALL_EXERCISES)
                const isSystem = ALL_EXERCISES.some(sys => sys.id === id);
                if (isSystem) return {};
                
                return {
                    exercises: state.exercises.filter(e => e.id !== id)
                };
            }),

            setExerciseNote: (id, notes) => set((state) => ({
                exercises: state.exercises.map(e => e.id === id ? { ...e, notes } : e)
            })),

            startOnTheGo: () => set({ onTheGoSession: { startTime: Date.now(), exercises: [] } }),
            endOnTheGo: () => set({ onTheGoSession: null }),
            addExerciseToOnTheGo: (exerciseId) => set((state) => {
                if (!state.onTheGoSession) return {};
                return {
                    onTheGoSession: {
                        ...state.onTheGoSession,
                        exercises: [...state.onTheGoSession.exercises, { exerciseId, targetSets: 1 }]
                    }
                };
            }),

            applySchedulePatch: (patch) => set((state) => {
                if (!state.activeRoutineId || patch.status !== "ok") return {};

                const routine = state.routines.find(r => r.id === state.activeRoutineId);
                if (!routine) return {};

                // Deep copy to mutate
                const updatedDays = routine.days.map(d => ({
                    ...d,
                    exercises: d.exercises.map(e => ({ ...e, sets: [...e.sets] }))
                }));

                patch.changes.forEach(change => {
                    const day = updatedDays.find(d => d.id === change.dayId);
                    if (!day) return;

                    if (change.action === "add_exercise" && change.exerciseId) {
                        // Add new exercise
                        day.exercises.push({
                            exerciseId: change.exerciseId,
                            targetSets: change.targetSets || 3, // Deprecated
                            targetReps: 10, // Deprecated
                            sets: Array(change.targetSets || 3).fill({
                                id: Date.now().toString() + Math.random(),
                                type: "working",
                                reps: "8-12",
                                rpe: "8"
                            })
                        });
                    } else if (change.action === "increase_sets" && change.exerciseId) {
                        // Find exercise and add sets
                        const ex = day.exercises.find(e => e.exerciseId === change.exerciseId);
                        if (ex) {
                            const newSets = Array(change.targetSets || 1).fill({
                                id: Date.now().toString() + Math.random(),
                                type: "working",
                                reps: "8-12",
                                rpe: "8"
                            });
                            ex.sets.push(...newSets);
                            ex.targetSets = (ex.targetSets || 0) + (change.targetSets || 1);
                        }
                    }
                });

                const updatedRoutine = {
                    ...routine,
                    days: updatedDays,
                    lastModified: Date.now()
                };

                return {
                    routines: state.routines.map(r => r.id === routine.id ? updatedRoutine : r)
                };
            })
        }),
        {
            name: "pt_storage",
            partialize: (state) => ({
                user: state.user,
                history: state.history,
                exercises: state.exercises,
                routines: state.routines,
                activeRoutineId: state.activeRoutineId
            }),
        }
    )
);
