import type { WorkoutSet, UserProfile } from "./types";

export type CoachingRecommendation = "increase" | "decrease" | "maintain" | "substitute";

export interface CoachingResult {
    recommendation: CoachingRecommendation;
    nextWeight: number;
    delta: number;
    reasoning: string;
    targetRPE: number;
    e1RM: number;
}

export interface CoachingContext {
    target: {
        rpeRange: [number, number]; // [min, max], e.g. [7, 9]
        repsRange: [number, number]; // [min, max], e.g. [8, 12]
    };
    config: {
        increment: number; // e.g. 2.5
    };
    userState?: {
        pain?: number; // 0-10
        soreness?: number; // 0-10
        sleep?: number; // 0-10
    };
    history?: WorkoutSet[]; // For trend analysis (optional for MVP)
}

/**
 * Calculates Estimated 1RM using Epley Formula
 */
const calculateE1RM = (weight: number, reps: number) => weight * (1 + reps / 30);

/**
 * Bounds a value between min and max
 */
const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

/**
 * Rounds to the nearest increment
 */
const roundToIncrement = (val: number, increment: number): number => {
    return Math.round(val / increment) * increment;
};

export function getLoadCoaching(
    completedSet: WorkoutSet,
    context: CoachingContext
): CoachingResult {
    const { weight, reps, rpe } = completedSet;
    const { target, config, userState } = context;

    // 0. VALIDATION
    if (!rpe) {
        return {
            recommendation: "maintain",
            nextWeight: weight,
            delta: 0,
            reasoning: "Please log RPE to get coaching.",
            targetRPE: 8,
            e1RM: 0
        };
    }

    const e1RM = calculateE1RM(weight, reps);

    // 1. SAFETY & GUARDRAILS
    if (userState?.pain && userState.pain >= 6) {
        return {
            recommendation: "substitute",
            nextWeight: weight * 0.8, // Suggest significant deload or stop
            delta: -weight * 0.2,
            reasoning: "High pain detected. Recommend stopping or substituting exercise.",
            targetRPE: 5,
            e1RM
        };
    }

    if ((userState?.soreness && userState.soreness >= 7) || (userState?.sleep && userState.sleep <= 3)) {
        // Recovery Mode: Capped at Maintain/Decrease
        const targetRPE = target.rpeRange[0] - 1; // Aim below normal range
        // Proceed with logic, but enforce "No Increase" later
    }

    // 2. EFFORT ANALYSIS
    const targetRPE = (target.rpeRange[0] + target.rpeRange[1]) / 2; // Midpoint
    const effortError = rpe - targetRPE; // +ve = too hard, -ve = too easy

    // 3. PROPORTIONAL ADJUSTMENT (The "Algorithm")
    // k = responsiveness. 3% per RPE point seems reasonable.
    // If effort_error is +2 (RPE 10 vs 8), we want to reduce load.
    // If effort_error is -2 (RPE 6 vs 8), we want to increase load.
    // delta_pct = k * (-effort_error)

    let k = 0.03; // Default 3% load shift per RPE point

    // Non-linear adjustments:
    if (effortError <= -1.5) k = 0.05; // Was way too easy, be more aggressive
    if (effortError >= 1.5) k = 0.05;  // Was way too hard, drop faster (safety)

    let deltaPct = k * (-effortError);

    // Hard Clamp to +/- 10% max change per set
    deltaPct = clamp(deltaPct, -0.10, 0.10);

    // Small "dead zone" to avoid micro-adjustments for tiny RPE variance?
    // User requested: "on target (abs(error) <= 0.5): keep load"
    if (Math.abs(effortError) <= 0.5) {
        deltaPct = 0;
    }

    // 4. CALCULATE NEXT WEIGHT
    // Target Next e1RM = Current e1RM * (1 + delta)
    // Next Weight = Next e1RM / (1 + reps/30) -> assuming same reps target
    const targetNextE1RM = e1RM * (1 + deltaPct);
    const rawNextWeight = targetNextE1RM / (1 + reps / 30);

    let nextWeight = roundToIncrement(rawNextWeight, config.increment);

    // 5. GUARDRAIL ENFORCEMENT
    // Ensure we don't increase if recovery is bad
    if ((userState?.soreness && userState.soreness >= 7) || (userState?.sleep && userState.sleep <= 3)) {
        if (nextWeight > weight) {
            nextWeight = weight;
            deltaPct = 0;
        }
    }

    // 6. GENERATE REASONING
    const delta = nextWeight - weight;
    let rec: CoachingRecommendation = "maintain";
    let reason = "Perfect intensity. Keep it up.";

    if (delta > 0) {
        rec = "increase";
        if (effortError <= -1) reason = "Too easy (RPE < Target). Increase load.";
        else reason = "Slightly easy. Micro-load up.";
    } else if (delta < 0) {
        rec = "decrease";
        if (effortError >= 1) reason = "Too hard (RPE > Target). Reduce load.";
        else reason = "Slightly hard. Micro-load down.";
    }

    // Special Check: Volume/Rep constraints
    // If reps were way below target range but RPE was fine -> Weight is too heavy for VOLUME goal
    const minReps = target.repsRange[0];
    if (reps < minReps && rpe >= targetRPE) {
        // Even if RPE was "on target" (e.g. 8), if we only got 5 reps but wanted 8+, 
        // we MUST drop weight to hit the rep range next time.
        // Current logic might say "Maintain" because RPE 8 matches Target 8.
        // FIX:
        if (delta >= 0) { // If we weren't already decreasing
            // Force decrease to hit bottom of rep range
            // New Weight should allow minReps at targetRPE?
            // e1RM is truthful.
            // Weight for minReps = e1RM / (1 + minReps/30)
            const weightForVol = e1RM / (1 + minReps / 30);
            nextWeight = roundToIncrement(weightForVol, config.increment);
            // Safety check: ensure it IS lower
            if (nextWeight >= weight) nextWeight = weight - config.increment;

            rec = "decrease";
            reason = `Reps (${reps}) below target (${minReps}). Drop weight to hit volume.`;
        }
    }

    // If reps were way above target range -> Increase weight
    const maxReps = target.repsRange[1];
    if (reps > maxReps && rpe <= targetRPE) {
        // We did too many reps.
        if (delta <= 0) {
            // Force increase
            const weightForVol = e1RM / (1 + maxReps / 30);
            nextWeight = roundToIncrement(weightForVol, config.increment);
            if (nextWeight <= weight) nextWeight = weight + config.increment;

            rec = "increase";
            reason = `Reps (${reps}) above target (${maxReps}). Increase weight.`;
        }
    }

    return {
        recommendation: rec,
        nextWeight,
        delta: nextWeight - weight,
        reasoning: reason,
        targetRPE,
        e1RM
    };
}
