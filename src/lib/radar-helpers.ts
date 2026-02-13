import type { WorkoutSet } from "./types";

export type RadarAxis = "chest" | "back" | "shoulders" | "quads" | "glutes_hamstrings" | "arms" | "core";

export interface RadarDataPoint {
    axis: RadarAxis;
    label: string; // "Chest", "Back" etc.
    score: number; // 0-100
    tier: string;  // "S", "A", "B", "C", "D", "E"
    ratio: number; // e1RM / Bodyweight
    e1RM: number;  // Absolute e1RM
}

// Map exercise IDs to their contribution to each axis (sums don't need to be 1.0, 
// but usually represent primary/secondary coverage)
const EXERCISE_CONTRIBUTIONS: Record<string, Partial<Record<RadarAxis, number>>> = {
    // --- LEGS ---
    "barbell_back_squat": { "quads": 1.0, "glutes_hamstrings": 0.5, "core": 0.3 },
    "barbell_front_squat": { "quads": 1.0, "glutes_hamstrings": 0.3, "core": 0.4 },
    "goblet_squat": { "quads": 0.8, "core": 0.3 },
    "leg_press": { "quads": 1.0, "glutes_hamstrings": 0.2 },
    "lunges": { "quads": 0.7, "glutes_hamstrings": 0.7, "core": 0.2 },
    "romanian_deadlift": { "glutes_hamstrings": 1.0, "back": 0.3, "core": 0.3 },
    "leg_extension": { "quads": 1.0 },
    "leg_curl": { "glutes_hamstrings": 1.0 },
    "standing_calf_raise": { "glutes_hamstrings": 0.2 }, // Minor contribution
    "glute_bridge": { "glutes_hamstrings": 1.0 },
    "tibialis_raise": { "quads": 0.1 }, // Minor

    // --- CHEST ---
    "bench_press": { "chest": 1.0, "shoulders": 0.3, "arms": 0.2 }, // Triceps -> Arms
    "dumbbell_bench_press": { "chest": 1.0, "shoulders": 0.3, "arms": 0.2 },
    "incline_bench_press": { "chest": 0.7, "shoulders": 0.5, "arms": 0.2 },
    "chest_fly": { "chest": 1.0 },
    "push_up": { "chest": 0.6, "shoulders": 0.2, "core": 0.4 }, // Bodyweight handling needing logic
    "machine_chest_press": { "chest": 1.0, "shoulders": 0.2, "arms": 0.2 },

    // --- BACK ---
    "deadlift": { "back": 0.8, "glutes_hamstrings": 0.8, "core": 0.5 },
    // Note: We don't have "traps" axis, mapping to Back usually covers it, 
    // but the prompt had "Back" as axis. I'll stick to provided axes.
    "pull_up": { "back": 1.0, "arms": 0.4, "core": 0.3 },
    "lat_pulldown": { "back": 1.0, "arms": 0.3 },
    "dumbbell_row": { "back": 1.0, "arms": 0.3, "core": 0.2 },
    "barbell_row": { "back": 1.0, "arms": 0.3, "core": 0.4 },
    "face_pull": { "back": 0.5, "shoulders": 0.5 },

    // --- SHOULDERS ---
    "overhead_press": { "shoulders": 1.0, "arms": 0.3, "core": 0.3 },
    "dumbbell_shoulder_press": { "shoulders": 1.0, "arms": 0.3 },
    "lateral_raise": { "shoulders": 1.0 },
    "front_raise": { "shoulders": 1.0 },
    "rear_delt_fly": { "shoulders": 0.8, "back": 0.2 },

    // --- ARMS ---
    "barbell_curl": { "arms": 1.0 },
    "dumbbell_curl": { "arms": 1.0 },
    "hammer_curl": { "arms": 1.0 },
    "cable_tricep_extension": { "arms": 1.0 },
    "skull_crusher": { "arms": 1.0 },
    "tricep_dips": { "arms": 1.0, "chest": 0.3, "shoulders": 0.3 },

    // --- CORE ---
    "plank": { "core": 1.0 }, // Weighted planks or just duration? Duration conversion is tricky.
    "crunch": { "core": 1.0 },
    "hanging_leg_raise": { "core": 1.0 },
    "cable_crunch": { "core": 1.0 },
};

// Thresholds for Ratio (e1RM / Bodyweight) to get score 100 (S Tier)
// These are rough estimates for "Elite" level relative strength
const S_TIER_RATIOS: Record<RadarAxis, number> = {
    "chest": 1.5,           // 1.5x BW Bench
    "back": 1.8,            // 1.8x BW Pullup/Row equivalent (hard to quantify exactly but decent proxy)
    "shoulders": 1.0,       // 1.0x BW OHP
    "quads": 2.0,           // 2.0x BW Squat
    "glutes_hamstrings": 2.5, // 2.5x BW Deadlift
    "arms": 0.7,            // 0.7x BW Curl/Extension total (a bit high, but "S" is elite)
    "core": 1.5             // Weighted core strength often > 1.5x BW effectively
};

const getTier = (score: number): string => {
    if (score >= 85) return "S";
    if (score >= 70) return "A";
    if (score >= 55) return "B";
    if (score >= 40) return "C";
    if (score >= 20) return "D";
    return "E"; // Below D
};

export const calculateStrengthRadar = (history: WorkoutSet[], userWeight: number = 75): RadarDataPoint[] => {
    if (!history.length) return [];

    const now = Date.now();
    const eightWeeksAgo = now - (8 * 7 * 24 * 60 * 60 * 1000);

    // 1. Filter History
    const recentSets = history.filter(s => s.completedAt >= eightWeeksAgo);

    // 2. Group & Calculate e1RM
    const axisValues: Record<RadarAxis, number[]> = {
        chest: [], back: [], shoulders: [], quads: [],
        glutes_hamstrings: [], arms: [], core: []
    };

    recentSets.forEach(set => {
        // e1RM Formula: weight * (1 + reps/30)
        // For simple bodyweight, we assume 'weight' in set is external load.
        // If it's 0, it's just BW? But standardized sets usually store total weight if possible.
        // Assuming 'set.weight' is total load for now, or user enters external.
        // If user enters 0 for BW exercise, we should add userWeight. 
        // But let's assume 'set.weight' is the logged weight.

        let load = set.weight;
        // Simple heuristic: if weight is 0, add bodyweight? 
        // Or if it's a known BW exercise. For now, trust the log.
        // Using "Standard" e1RM
        const e1RM = load * (1 + set.reps / 30);

        // Map to axes
        const contribs = EXERCISE_CONTRIBUTIONS[set.exerciseId];
        if (contribs) {
            (Object.keys(contribs) as RadarAxis[]).forEach(axis => {
                const factor = contribs[axis]!;
                // Push the equivalent strength for this axis
                axisValues[axis].push(e1RM * factor);
            });
        }
    });

    // 3. Process each axis
    const axes: RadarAxis[] = ["chest", "back", "shoulders", "quads", "glutes_hamstrings", "arms", "core"];

    return axes.map(axis => {
        const values = axisValues[axis].sort((a, b) => b - a); // Descending

        // Top 3 trimmed mean (avg of best 2)
        let metric = 0;
        if (values.length >= 2) {
            // Take top 3
            const top3 = values.slice(0, 3);
            // If 3, remove worst of top 3? Or just "avg of best 2". 
            // Prompt: "select top 3... average of best 2". 
            // This implies filtering the 3rd.
            metric = (top3[0] + top3[1]) / 2;
        } else if (values.length === 1) {
            metric = values[0];
        } else {
            metric = 0;
        }

        const ratio = metric / userWeight;

        // Normalize 0-100 based on standard
        // S_TIER_RATIO = 100 score.
        // Linear interpolation? or Curve? Linear is simplest.
        let score = (ratio / S_TIER_RATIOS[axis]) * 100;
        if (score > 100) score = 100; // Cap at 100 (S+)

        // Ensure "E" rank for beginners
        if (score < 0) score = 0;

        // Label mapping
        const labels: Record<RadarAxis, string> = {
            chest: "Chest", back: "Back", shoulders: "Shldr",
            quads: "Quads", glutes_hamstrings: "Glutes",
            arms: "Arms", core: "Core"
        };

        return {
            axis,
            label: labels[axis],
            score: Math.round(score),
            tier: getTier(score),
            ratio,
            e1RM: metric
        };
    });
};
