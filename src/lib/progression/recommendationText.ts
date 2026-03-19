/**
 * RECOMMENDATION TEXT
 * Generates assertive, coach-like user-facing messages from a ProgressionResult.
 */

import type { ProgressionResult } from "./progressionDecision";

export interface UserFacingRecommendation {
    headline: string;    // Primary action message (bold)
    detail: string;      // One-line explanation
    badge: "up" | "hold" | "down" | "reps";
}

export function generateRecommendationText(
    result: ProgressionResult,
    currentWeight: number,
    _exerciseName: string
): UserFacingRecommendation {
    const { action, recommended_weight, debug_data } = result;
    const { readiness, history } = debug_data;
    const diff = recommended_weight - currentWeight;

    switch (action) {
        case "increase": {
            const weightStr = recommended_weight > 0 ? `${recommended_weight} kg` : "heavier";
            if (readiness >= 0.85 && history.repeatedSuccessCount >= 2) {
                return {
                    headline: `Move to ${weightStr} next set.`,
                    detail: `You've earned it — consistently strong on this exercise.`,
                    badge: "up"
                };
            }
            if (diff >= 5) {
                return {
                    headline: `Jump to ${weightStr}.`,
                    detail: `Performance and trend both point clearly upward.`,
                    badge: "up"
                };
            }
            return {
                headline: `Step up to ${weightStr}.`,
                detail: `You handled this cleanly and still had room left.`,
                badge: "up"
            };
        }

        case "reps_first": {
            const targetReps = debug_data.scores.performance_score >= 0.7 ? "the top of your range" : "more clean reps";
            return {
                headline: `Stay at ${currentWeight} kg and build reps first.`,
                detail: `The set was solid — push for ${targetReps} before loading up.`,
                badge: "reps"
            };
        }

        case "maintain": {
            if (history.repeatedStruggleCount >= 1) {
                return {
                    headline: `Hold at ${currentWeight} kg.`,
                    detail: `Lock in your technique here. A few inconsistent sessions recently.`,
                    badge: "hold"
                };
            }
            if (readiness >= 0.60) {
                return {
                    headline: `Stay at ${currentWeight} kg.`,
                    detail: `Good session. Keep the quality dialled in before moving up.`,
                    badge: "hold"
                };
            }
            return {
                headline: `Keep ${currentWeight} kg.`,
                detail: `Not quite ready to push yet — prioritise clean reps at this weight.`,
                badge: "hold"
            };
        }

        case "decrease": {
            const weightStr = recommended_weight > 0 ? `${recommended_weight} kg` : "a lighter weight";
            if (history.repeatedStruggleCount >= 2) {
                return {
                    headline: `Drop back to ${weightStr}.`,
                    detail: `Multiple hard sessions at this weight. Reset to rebuild momentum.`,
                    badge: "down"
                };
            }
            return {
                headline: `Back off to ${weightStr}.`,
                detail: `Effort spiked too early — dropping weight will restore quality reps.`,
                badge: "down"
            };
        }
    }
}
