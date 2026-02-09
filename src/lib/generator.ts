import type { UserProfile, WorkoutSet, Exercise, Routine, WorkoutDay } from "./types";

// Analyze weak points based on volume and frequency
export function analyzeWeaknesses(history: WorkoutSet[], exercises: Exercise[]): string[] {
    // DEMO MODE: Analyze immediately, even with 1 set
    if (history.length === 0) return [];

    const recentHistory = history; // Look at all history for now
    const muscleVolume: Record<string, number> = {};

    recentHistory.forEach(set => {
        const ex = exercises.find(e => e.id === set.exerciseId);
        if (ex) {
            muscleVolume[ex.muscle] = (muscleVolume[ex.muscle] || 0) + 1;
        }
    });

    const weaknesses: string[] = [];
    // If any muscle has > 2 sets more than others, flag the Low ones
    const volumes = Object.values(muscleVolume);
    if (volumes.length === 0) return [];

    const maxVol = Math.max(...volumes);

    Object.entries(muscleVolume).forEach(([muscle, vol]) => {
        if (vol < maxVol * 0.4) {
            weaknesses.push(muscle);
        }
    });

    return weaknesses;
}

export function generateRoutine(user: UserProfile | null, weaknesses: string[]): Routine {
    const goal = user?.goal || "strength";

    // Default Template
    let days: WorkoutDay[] = [];
    // Safe ID generation
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).substring(2);
    let name = "Custom Plan";
    let rationale = "Balanced approach.";

    // Helper to generate default sets
    const createSets = (count: number, reps: number) => {
        return Array(count).fill(0).map((_, i) => ({
            id: `set_${i}_${Date.now()}`, // Quick ID
            type: "working" as const,
            reps: reps.toString()
        }));
    };

    // 1. DEFINE PATTERNS (The "Recipes")
    if (goal === "strength") {
        name = "Starting Strength 2.0";
        rationale = "Focus on 5x5 Compound Lifts to maximize recruitment.";
        days = [
            {
                id: "day_a", name: "Day A: Squat Focus", exercises: [
                    { exerciseId: "barbell_back_squat", targetSets: 5, targetReps: 5, sets: createSets(5, 5) },
                    { exerciseId: "bench_press", targetSets: 5, targetReps: 5, sets: createSets(5, 5) },
                    { exerciseId: "deadlift", targetSets: 1, targetReps: 5, sets: createSets(1, 5) }
                ]
            },
            {
                id: "rest_1", name: "Rest & Recovery", exercises: []
            },
            {
                id: "day_b", name: "Day B: Press Focus", exercises: [
                    { exerciseId: "barbell_back_squat", targetSets: 5, targetReps: 5, sets: createSets(5, 5) },
                    { exerciseId: "ohp", targetSets: 5, targetReps: 5, sets: createSets(5, 5) },
                    { exerciseId: "pull_up", targetSets: 3, targetReps: 8, sets: createSets(3, 8) }
                ]
            },
            {
                id: "rest_2", name: "Rest & Recovery", exercises: []
            }
        ];
    } else if (goal === "hypertrophy") {
        name = "PPL (Push/Pull/Legs)";
        rationale = "High volume split to maximize hypertrophy signals.";
        days = [
            {
                id: "push", name: "Push Day", exercises: [
                    { exerciseId: "bench_press", targetSets: 4, targetReps: 10, sets: createSets(4, 10) },
                    { exerciseId: "ohp", targetSets: 4, targetReps: 12, sets: createSets(4, 12) },
                ]
            },
            {
                id: "pull", name: "Pull Day", exercises: [
                    { exerciseId: "deadlift", targetSets: 3, targetReps: 8, sets: createSets(3, 8) },
                    { exerciseId: "pull_up", targetSets: 4, targetReps: 10, sets: createSets(4, 10) },
                    { exerciseId: "db_curl", targetSets: 4, targetReps: 12, sets: createSets(4, 12) }
                ]
            },
            {
                id: "legs", name: "Leg Day", exercises: [
                    { exerciseId: "barbell_back_squat", targetSets: 4, targetReps: 10, sets: createSets(4, 10) },
                ]
            },
            { id: "rest", name: "Rest", exercises: [] }
        ];
    } else {
        // Weight Loss / MetCon
        name = "Metabolic Burn";
        rationale = "High intensity full body circuits.";
        days = [
            {
                id: "circuit_a", name: "Full Body Circuit A", exercises: [
                    { exerciseId: "barbell_back_squat", targetSets: 3, targetReps: 15, sets: createSets(3, 15) },
                    { exerciseId: "ohp", targetSets: 3, targetReps: 15, sets: createSets(3, 15) },
                    { exerciseId: "deadlift", targetSets: 3, targetReps: 15, sets: createSets(3, 15) }
                ]
            },
            { id: "rest", name: "Active Rest", exercises: [] },
            {
                id: "circuit_b", name: "Full Body Circuit B", exercises: [
                    { exerciseId: "bench_press", targetSets: 3, targetReps: 15, sets: createSets(3, 15) },
                    { exerciseId: "pull_up", targetSets: 3, targetReps: 15, sets: createSets(3, 15) },
                    { exerciseId: "barbell_back_squat", targetSets: 3, targetReps: 15, sets: createSets(3, 15) }
                ]
            }
        ];
    }

    // 2. APPLY BIOLOGICAL MODIFIERS
    if (user?.bloodwork?.iron === "Low") {
        days.forEach(day => {
            day.exercises.forEach(ex => {
                ex.targetSets = Math.max(1, ex.targetSets - 1);
                ex.sets = createSets(ex.targetSets, ex.targetReps); // Re-generate sets
            });
        });
        rationale += " [Modified: Reduced volume for Iron constraints]";
    }

    return {
        id,
        name,
        rationale,
        days,
        currentDayIndex: 0,
        startDate: Date.now(),
        lastModified: Date.now()
    };
}

// --- HELPERS ---

export const calculateBMI = (weight: number, height: number) => {
    return weight / ((height / 100) ** 2);
};

export const estimateBodyFat = (bmi: number, gender: "male" | "female", age: number = 25) => {
    // Deurenberg formula
    // Body fat % = (1.20 × BMI) + (0.23 × Age) − (10.8 × sex) − 5.4
    // sex = 1 for men, 0 for women
    const sexFactor = gender === "male" ? 1 : 0;
    return (1.20 * bmi) + (0.23 * age) - (10.8 * sexFactor) - 5.4;
};

export const getIdealWeight = (height: number) => {
    // Devine Formula (Simple estimation)
    // Male: 50kg + 2.3kg/inch over 5ft
    // Female: 45.5kg + 2.3kg/inch over 5ft
    // We'll just use a BMI22 target for simplicity as a "healthy baseline"
    // BMI = W / H^2  ->  W = 22 * (H/100)^2
    return 22 * ((height / 100) ** 2);
};
