import type { WorkoutSet, Exercise } from "./types";
import type { WorkoutSet, Exercise } from "./types";
import { subDays, isAfter } from "date-fns";

export type ProgressPoint = {
    date: number; // timestamp
    weight: number;
    reps: number;
    volume: number; // weight * reps
    rpe: number;
};

export type MuscleHeatmapData = {
    [muscle: string]: number; // 0 to 1 (intensity/frequency)
};

/**
 * Extracts progress data for a specific exercise over time.
 * For each day, it picks the "best" set (highest weight, then highest reps).
 */
export const getExerciseProgress = (history: WorkoutSet[], exerciseId: string): ProgressPoint[] => {
    const exerciseSets = history
        .filter(s => s.exerciseId === exerciseId)
        .sort((a, b) => a.completedAt - b.completedAt);

    if (exerciseSets.length === 0) return [];

    const progress: ProgressPoint[] = [];
    const groupedByDay: { [dateKey: string]: WorkoutSet[] } = {};

    // Group sets by day
    exerciseSets.forEach(set => {
        const dateKey = new Date(set.completedAt).toDateString();
        if (!groupedByDay[dateKey]) groupedByDay[dateKey] = [];
        groupedByDay[dateKey].push(set);
    });

    // Find best set for each day
    Object.values(groupedByDay).forEach(daySets => {
        // Sort by weight (desc), then reps (desc)
        daySets.sort((a, b) => {
            if (b.weight !== a.weight) return b.weight - a.weight;
            return b.reps - a.reps;
        });

        const bestSet = daySets[0];
        progress.push({
            date: bestSet.completedAt,
            weight: bestSet.weight,
            reps: bestSet.reps,
            volume: bestSet.weight * bestSet.reps,
            rpe: bestSet.rpe || 0
        });
    });

    return progress.sort((a, b) => a.date - b.date);
};

/**
 * Calculates a "heat" value (0-1) for each muscle group based on recent activity.
 * Scope: Last 30 days.
 */
export const getMuscleHeatmapData = (history: WorkoutSet[], exercises: Exercise[]): MuscleHeatmapData => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentSets = history.filter(s => isAfter(new Date(s.completedAt), thirtyDaysAgo));

    const muscleVolume: { [key: string]: number } = {};
    let maxVolume = 0;

    recentSets.forEach(set => {
        const exercise = exercises.find(e => e.id === set.exerciseId);
        if (!exercise) return;

        const muscle = exercise.muscle;
        // Simple volume metric: raw set count is often better for "frequency" heatmaps than tonnage
        // But we can do a mix. Let's use Set Count for now as it's cleaner for "body part usage".
        const increment = 1;

        muscleVolume[muscle] = (muscleVolume[muscle] || 0) + increment;
        if (muscleVolume[muscle] > maxVolume) maxVolume = muscleVolume[muscle];
    });

    // Normalize to 0-1
    const heatmap: MuscleHeatmapData = {};
    Object.keys(muscleVolume).forEach(muscle => {
        heatmap[muscle] = maxVolume > 0 ? muscleVolume[muscle] / maxVolume : 0;
    });

    return heatmap;
};
