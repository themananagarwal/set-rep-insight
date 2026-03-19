/**
 * PROGRESSION DECISION
 * Uses class-sensitive readiness thresholds and progression method rules
 * to determine the final action: increase | maintain | decrease | reps_first
 */

import type { ExerciseClass, ProgressionMethod } from "./exerciseProfiles";
import { getExerciseProfile } from "./exerciseProfiles";
import type { SubScores, HistoryAnalysis } from "./progressionScoring";
import { analyseHistory } from "./progressionScoring";
import type { WorkoutSet } from "../types";
import { roundWeight } from "./weightRounding";

export type ProgressionAction = "increase" | "maintain" | "decrease" | "reps_first";

export interface ProgressionResult {
    action: ProgressionAction;
    recommended_weight: number;
    confidence_score: number;
    short_explanation: string;
    debug_data: {
        scores: SubScores;
        history: HistoryAnalysis;
        exerciseClass: ExerciseClass;
        progressionMethod: ProgressionMethod;
        readiness: number;
    };
}

/** Class-sensitive thresholds for each action */
const THRESHOLDS: Record<ExerciseClass, { increase: number; maintain_upper: number; reps_first_upper: number }> = {
    heavy_compound:   { increase: 0.78, maintain_upper: 0.77, reps_first_upper: 0.57 },
    moderate_compound:{ increase: 0.74, maintain_upper: 0.73, reps_first_upper: 0.53 },
    machine_compound: { increase: 0.70, maintain_upper: 0.69, reps_first_upper: 0.49 },
    isolation:        { increase: 0.68, maintain_upper: 0.67, reps_first_upper: 0.47 },
    bodyweight:       { increase: 0.74, maintain_upper: 0.73, reps_first_upper: 0.53 },
};

export function makeProgressionDecision(
    exerciseId: string,
    currentWeight: number,
    currentReps: number,
    currentRpe: number,
    scores: SubScores,
    exerciseHistory: WorkoutSet[],
    planRepRange?: [number, number]
): ProgressionResult {
    const profile = getExerciseProfile(exerciseId);
    const { exercise_class, progression_method, increment, standard_rep_zone } = profile;
    const t = THRESHOLDS[exercise_class];
    const readiness = scores.progression_readiness_score;
    const historyAnalysis = analyseHistory(exerciseHistory);
    const { repeatedSuccessCount, repeatedStruggleCount, trend_direction } = historyAnalysis;

    const [minRep, maxRep] = planRepRange ?? standard_rep_zone;

    // ─ DETERMINE: is this a reps_first situation? ────────────────────────
    const atTopOfRepZone = currentReps >= maxRep;

    // ─ DECISION LOGIC ─────────────────────────────────────────────────────
    let action: ProgressionAction;
    let useIncrement = increment.mild;

    if (readiness >= t.increase) {
        // High readiness — can we increase?
        if (progression_method === "reps_first") {
            // For reps_first: require top-end reps in multiple sets OR 2+ consecutive sessions at same weight
            if (atTopOfRepZone && repeatedSuccessCount >= 2) {
                action = "increase";
            } else if (atTopOfRepZone) {
                action = "reps_first"; // Top of zone but not yet 2 confirmed sessions
            } else {
                action = "reps_first"; // Still building reps
            }
        } else if (progression_method === "hybrid") {
            // For hybrid: increase if performance beats history OR if 2+ success streak
            const beatsHistory = currentWeight >= historyAnalysis.lastSessionBestWeight &&
                currentReps >= historyAnalysis.lastSessionBestReps - 1;
            if (beatsHistory || repeatedSuccessCount >= 2) {
                action = "increase";
                // Moderate increase if strongly over threshold and trend improving
                if (readiness >= t.increase + 0.08 && trend_direction === "improving") {
                    useIncrement = increment.moderate;
                }
            } else if (atTopOfRepZone) {
                action = "reps_first";
            } else {
                action = "maintain";
            }
        } else {
            // load_first: increase readily
            action = "increase";
            if (readiness >= t.increase + 0.05) useIncrement = increment.moderate;
        }
    } else if (readiness >= t.reps_first_upper) {
        // Mid range
        if (progression_method === "reps_first") {
            action = atTopOfRepZone && repeatedSuccessCount >= 1 ? "reps_first" : "maintain";
        } else {
            action = atTopOfRepZone ? "reps_first" : "maintain";
        }
    } else {
        // Below productive zone
        const isEarlyFailure = currentRpe >= 9.5 && currentReps < minRep;
        const consistentStruggle = repeatedStruggleCount >= 2;

        if (isEarlyFailure || consistentStruggle) {
            action = "decrease";
            if (repeatedStruggleCount >= 3 || currentRpe >= 10) {
                useIncrement = increment.moderate_decrease;
            } else {
                useIncrement = increment.mild_decrease;
            }
        } else {
            // Poor late set after high fatigue — don't penalise
            action = "maintain";
        }
    }

    // ─ BODYWEIGHT OVERRIDE ────────────────────────────────────────────────
    // Bodyweight exercises: always prefer reps unless the user has added external load
    if (exercise_class === "bodyweight" && currentWeight === 0) {
        if (action === "increase") action = "reps_first";
    }

    // ─ COMPUTE RECOMMENDED WEIGHT ─────────────────────────────────────────
    let recommended_weight = currentWeight;
    if (action === "increase") {
        recommended_weight = roundWeight(currentWeight + useIncrement, profile.loading_type);
    } else if (action === "decrease") {
        recommended_weight = roundWeight(Math.max(currentWeight - useIncrement, 0), profile.loading_type);
    }

    const confidence_score = Math.round(
        (readiness >= t.increase ? 0.85 : readiness >= t.reps_first_upper ? 0.65 : 0.45) * 100
    ) / 100;

    return {
        action,
        recommended_weight,
        confidence_score,
        short_explanation: buildExplanation(action, readiness, currentReps, maxRep, historyAnalysis),
        debug_data: {
            scores,
            history: historyAnalysis,
            exerciseClass: exercise_class,
            progressionMethod: progression_method,
            readiness,
        }
    };
}

function buildExplanation(
    action: ProgressionAction,
    readiness: number,
    reps: number,
    maxRep: number,
    history: HistoryAnalysis
): string {
    switch (action) {
        case "increase":
            if (readiness >= 0.85) return "Strong readiness and consistent progress. Time to add load.";
            if (history.repeatedSuccessCount >= 2) return "Multiple solid sessions at this weight. Ready to step up.";
            return "Good performance. Progression unlocked.";
        case "maintain":
            if (history.repeatedStruggleCount >= 1) return "Some inconsistency recently. Lock in this weight first.";
            return "Solid effort. Stay here and build quality.";
        case "reps_first":
            if (reps < maxRep) return `Push for ${maxRep} reps before loading up. Currently at ${reps}.`;
            return "Hit the top of your rep zone. Need one more session here before increasing load.";
        case "decrease":
            return "Effort too high for the rep count. Drop weight to restore quality and range.";
    }
}
