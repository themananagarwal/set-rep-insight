import type { WorkoutSet } from "./types";

import { getExerciseContributions, type RadarAxis, type ExerciseDef } from "./exercises";

export type { RadarAxis };

export interface RadarDataPoint {
    axis: RadarAxis;
    label: string; // "Chest", "Back" etc.
    score: number; // 0-100
    tier: string;  // "S", "A", "B", "C", "D", "E"
    ratio: number; // e1RM / Bodyweight
    e1RM: number;  // Absolute e1RM
}


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
        const contribs = getExerciseContributions(set.exerciseId);
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
