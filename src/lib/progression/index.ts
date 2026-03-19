/**
 * Progression Engine - Barrel Export
 * Main entry point: call getProgression() after every logged set.
 */

import type { WorkoutSet } from "../types";
import { computeScores } from "./progressionScoring";
import type { ScoringInput } from "./progressionScoring";
import { makeProgressionDecision } from "./progressionDecision";
import type { ProgressionResult } from "./progressionDecision";
import { generateRecommendationText } from "./recommendationText";
import type { UserFacingRecommendation } from "./recommendationText";

export type { ProgressionResult, ProgressionAction } from "./progressionDecision";
export type { UserFacingRecommendation } from "./recommendationText";
export type { FatigueTracker } from "./fatigueTracker";
export { createFatigueTracker } from "./fatigueTracker";
export { getExerciseProfile } from "./exerciseProfiles";

export interface ProgressionInput {
    completedSet: WorkoutSet;
    exerciseId: string;
    exerciseName: string;
    /** 1-indexed set number within this exercise in the current session */
    setNumber: number;
    totalExercisesCompletedBefore: number;
    /** Average primary-muscle fatigue from the session fatigueTracker */
    primaryMuscleFatigue: number;
    /** All logged WorkoutSets for this exercise (from local history) */
    exerciseHistory: WorkoutSet[];
    /** Rep range from the routine plan, if available */
    planRepRange?: [number, number];
}

export interface FullProgressionResult {
    result: ProgressionResult;
    userMessage: UserFacingRecommendation;
}

/**
 * Main function: given a just-logged set and session context,
 * returns the full progression decision + user-facing message.
 */
export function getProgression(input: ProgressionInput): FullProgressionResult {
    const {
        completedSet, exerciseId, exerciseName,
        setNumber, totalExercisesCompletedBefore,
        primaryMuscleFatigue, exerciseHistory, planRepRange
    } = input;

    const scoringInput: ScoringInput = {
        completedSet,
        exerciseId,
        setNumber,
        totalExercisesCompletedBefore,
        primaryMuscleFatigue,
        exerciseHistory,
        planRepRange
    };

    const scores = computeScores(scoringInput);

    const result = makeProgressionDecision(
        exerciseId,
        completedSet.weight,
        completedSet.reps,
        completedSet.rpe ?? 8,
        scores,
        exerciseHistory,
        planRepRange
    );

    const userMessage = generateRecommendationText(result, completedSet.weight, exerciseName);

    return { result, userMessage };
}
