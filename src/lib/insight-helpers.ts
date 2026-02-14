import type { WorkoutSet, Exercise } from "./types";
import { subDays, isAfter } from "date-fns";

export type ProgressPoint = {
    date: number; // timestamp
    weight: number;
    reps: number;
    volume: number; // Daily Total Volume
    rpe: number;
    e1rm: number; // Calculated e1RM
};

export type MuscleHeatmapData = {
    [muscle: string]: number; // 0 to 1 (intensity/frequency)
};

export type InsightTimeRange = "1M" | "3M" | "6M" | "ALL";

/**
 * Extracts progress data for a specific exercise over time.
 * Supports filtering by time range.
 */
export const getExerciseProgress = (history: WorkoutSet[], exerciseId: string, timeRange: InsightTimeRange = "ALL"): ProgressPoint[] => {

    // Filter by Time Range
    let cutoff = new Date(0); // ALL
    const now = new Date();
    if (timeRange === "1M") cutoff = subDays(now, 30);
    if (timeRange === "3M") cutoff = subDays(now, 90);
    if (timeRange === "6M") cutoff = subDays(now, 180);

    const exerciseSets = history
        .filter(s => s.exerciseId === exerciseId && isAfter(new Date(s.completedAt), cutoff))
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

    // Find best set for each day based on "strength" (e1rm) mostly, 
    // but the graph might want different things. 
    // We store all metrics in the point, so we can pick later.
    Object.values(groupedByDay).forEach(daySets => {
        // Calculate daily totals for volume
        const dailyVolume = daySets.reduce((acc, s) => acc + (s.weight * s.reps), 0);

        // Best Set (Highest e1RM)
        daySets.sort((a, b) => {
            const e1rmA = a.weight * (1 + a.reps / 30);
            const e1rmB = b.weight * (1 + b.reps / 30);
            return e1rmB - e1rmA;
        });

        const bestSet = daySets[0];
        const e1rm = bestSet.weight * (1 + bestSet.reps / 30);

        progress.push({
            date: bestSet.completedAt,
            weight: bestSet.weight,
            reps: bestSet.reps,
            volume: dailyVolume, // Total daily volume
            e1rm: e1rm,
            rpe: bestSet.rpe || 0
        });
    });

    return progress.sort((a, b) => a.date - b.date);
};

export type PersonalRecord = {
    exerciseId: string;
    metric: "Weight" | "Volume" | "e1RM";
    value: number;
    date: number;
};

export const getPersonalRecords = (history: WorkoutSet[]): PersonalRecord[] => {
    // We only care about main lifts + some key ones
    // Or scan all history? Scan all for MVP.
    const bests: Record<string, PersonalRecord> = {};

    history.forEach(set => {
        const e1rm = set.weight * (1 + set.reps / 30);

        // Check e1RM PR
        if (!bests[set.exerciseId] || e1rm > bests[set.exerciseId].value) {
            bests[set.exerciseId] = {
                exerciseId: set.exerciseId,
                metric: "e1RM",
                value: e1rm,
                date: set.completedAt
            };
        }
    });

    return Object.values(bests).sort((a, b) => b.date - a.date); // Most recent PRs first? Or highest value?
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
