/**
 * FATIGUE TRACKER
 * Tracks per-muscle cumulative fatigue during a session.
 */

import type { MuscleGroup } from "./muscleContributionMap";
import { getAllContributions, getMuscleMap } from "./muscleContributionMap";
import type { FatigueCost } from "./exerciseProfiles";
import { getExerciseProfile } from "./exerciseProfiles";

export type FatigueBucket = "low" | "moderate" | "high" | "very_high";

export interface FatigueState {
    muscleFatigue: Partial<Record<MuscleGroup, number>>;
}

const BASE_FATIGUE: Record<FatigueCost, number> = {
    high: 1.0,
    medium: 0.7,
    low: 0.4,
};

function getRpeMultiplier(rpe: number): number {
    if (rpe <= 6.5) return 0.7;
    if (rpe <= 7.5) return 0.9;
    if (rpe <= 8.5) return 1.0;
    if (rpe <= 9.5) return 1.15;
    return 1.25;
}

function getSetMultiplier(setNumber: number): number {
    if (setNumber === 1) return 1.0;
    if (setNumber === 2) return 1.05;
    if (setNumber === 3) return 1.10;
    return 1.15;
}

export function getFatigueBucket(fatigue: number): FatigueBucket {
    if (fatigue < 1.2) return "low";
    if (fatigue < 2.4) return "moderate";
    if (fatigue < 3.8) return "high";
    return "very_high";
}

export function createFatigueTracker() {
    const muscleFatigue: Partial<Record<MuscleGroup, number>> = {};

    function addSetToFatigue(exerciseId: string, rpe: number, setNumber: number) {
        const profile = getExerciseProfile(exerciseId);
        const baseFatigue = BASE_FATIGUE[profile.fatigue_cost];
        const rpeMultiplier = getRpeMultiplier(rpe);
        const setMultiplier = getSetMultiplier(setNumber);
        const contributions = getAllContributions(exerciseId);

        for (const contrib of contributions) {
            const points = baseFatigue * rpeMultiplier * setMultiplier * (contrib.contribution / 100);
            muscleFatigue[contrib.muscle] = (muscleFatigue[contrib.muscle] ?? 0) + points;
        }
    }

    function getMuscleFatigue(muscle: MuscleGroup): number {
        return muscleFatigue[muscle] ?? 0;
    }

    function getPrimaryMuscleFatigue(exerciseId: string): number {
        const map = getMuscleMap(exerciseId);
        if (map.primary.length === 0) return 0;
        const total = map.primary.reduce((sum, c) => sum + getMuscleFatigue(c.muscle), 0);
        return total / map.primary.length;
    }

    function getSnapshot(): FatigueState {
        return { muscleFatigue: { ...muscleFatigue } };
    }

    return { addSetToFatigue, getMuscleFatigue, getPrimaryMuscleFatigue, getSnapshot };
}

export type FatigueTracker = ReturnType<typeof createFatigueTracker>;
