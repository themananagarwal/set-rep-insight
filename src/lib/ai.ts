import type { Exercise, Prediction, UserProfile, WorkoutSet } from "./types";

// The "Brain" of the Personal Trainer
// --- HEURISTIC OPTIMIZATION ENGINE ---

/**
 * Calculates Estimated 1RM using Epley Formula
 */
const calculateE1RM = (weight: number, reps: number) => weight * (1 + reps / 30);

/**
 * Generates a score for a potential next set based on user goals and constraints.
 */
const scoreCandidate = (
    candidate: { weight: number, reps: number },
    lastSet: WorkoutSet,
    user: UserProfile | null,
    e1RM: number
): number => {
    let score = 0;
    const { weight, reps } = candidate;

    // 1. CONSTRAINT: Absolute Rep Limit (Hard Rule)
    if (reps > 15) return -1000;
    if (reps < 3) return -500; // Safety floor

    // 2. CONSTRAINT: Minimum Increment (Hard Rule)
    // We only generate 2.5kg increments, but double check.
    if (weight % 1.25 !== 0) return -100;

    // 3. PROGRESSION BONUS: Reward increasing Volume Load (Weight * Reps)
    const currentVol = weight * reps;
    const lastVol = lastSet.weight * lastSet.reps;
    if (currentVol > lastVol) score += 50;

    // 4. GOAL BIAS (The "Strategy")
    const goal = user?.goal || "strength";

    if (goal === "strength") {
        // High penalty for high reps
        if (reps > 8) score -= (reps - 8) * 20;

        // Bonus for modifying Weight vs Reps
        if (weight > lastSet.weight) score += 100;
    } else {
        // Hypertrophy
        // Penalize very low reps
        if (reps < 8) score -= (8 - reps) * 15;

        // Bonus for increasing Reps
        if (reps > lastSet.reps) score += 80;
    }

    // 5. INTENSITY MATCH (The "Safety" Check)
    // Predict RPE for this candidate based on current strength (e1RM)
    // Inverse Epley: Reps = 30 * ( (e1RM / Weight) - 1 )
    // If we use this Weight, how many Reps *could* they do?
    const maxPossibleReps = 30 * ((e1RM / weight) - 1);

    // RPE ~= 10 - (MaxReps - TargetReps)
    const predictedRPE = 10 - (maxPossibleReps - reps);

    // We want RPE to be between 7-9
    if (predictedRPE >= 7 && predictedRPE <= 9) {
        score += 150; // Sweet Spot Bonus
    } else if (predictedRPE > 9.5) {
        score -= 200; // Too heavy / Failure risk
    } else if (predictedRPE < 6) {
        score -= 50; // Too easy / Junk volume
    }

    return score;
};

export const predictNextSet = (
    exerciseId: string,
    history: WorkoutSet[],
    user: UserProfile | null
): Prediction => {
    // 1. Filter & Sort History
    const exerciseHistory = history
        .filter((h) => h.exerciseId === exerciseId)
        .sort((a, b) => b.completedAt - a.completedAt);

    const lastSet = exerciseHistory[0];

    // COLD START: No history
    if (!lastSet) {
        return {
            exerciseId,
            suggestedWeight: 20,
            suggestedReps: 12,
            reasoning: "Starting fresh. Establishing baseline.",
        };
    }

    // 2. ANALYZE CONTEXT
    // Calculate current estimated max strength
    const currentE1RM = calculateE1RM(lastSet.weight, lastSet.reps);

    // Adjust E1RM based on last set's RPE (Daily Undulating PeriodizationLite)
    const lastRPE = lastSet.rpe || 8;
    let dailyCapacity = currentE1RM;

    if (lastRPE < 7) dailyCapacity *= 1.05; // Was easy, real strength is higher
    else if (lastRPE > 9) dailyCapacity *= 0.95; // Was hard, fatigued

    // Bio-Availability Constraints
    if (user?.bloodwork?.iron === "Low") dailyCapacity *= 0.98;

    // 3. GENERATE CANDIDATES
    // Create multiple possible "Next Sets"
    const candidates = [
        // Option A: Maintain
        { weight: lastSet.weight, reps: lastSet.reps },
        // Option B: Micro-load Weight (+2.5kg)
        { weight: lastSet.weight + 2.5, reps: lastSet.reps },
        // Option C: Add Volume (+1 rep)
        { weight: lastSet.weight, reps: lastSet.reps + 1 },
        // Option D: Reset (More weight, less reps) -> Strength Block
        { weight: lastSet.weight + 2.5, reps: Math.max(5, lastSet.reps - 2) },
        // Option E: Backoff (Less weight, same reps) -> Recovery
        { weight: Math.max(0, lastSet.weight - 2.5), reps: lastSet.reps }
    ];

    // 4. SCORE & SELECT
    let bestCandidate = candidates[0];
    let maxScore = -Infinity;

    candidates.forEach(cand => {
        const score = scoreCandidate(cand, lastSet, user, dailyCapacity);
        if (score > maxScore) {
            maxScore = score;
            bestCandidate = cand;
        }
    });

    // 5. EXPLAIN SELECTION
    let reason = "Optimized for progress.";
    if (bestCandidate.weight > lastSet.weight) reason = "Increase Load: Strength capacity sufficient.";
    else if (bestCandidate.reps > lastSet.reps) reason = "Increase Volume: Building endurance base.";
    else if (bestCandidate.weight < lastSet.weight) reason = "Deload: Recovery Required.";
    else reason = "Maintain: Consolidating gains.";

    return {
        exerciseId,
        suggestedWeight: bestCandidate.weight,
        suggestedReps: bestCandidate.reps,
        reasoning: `AI Score: ${Math.round(maxScore)}. ${reason}`,
    };
};

export const INITIAL_EXERCISES: Exercise[] = [
    { id: "sq", name: "Back Squat", muscle: "Legs", type: "compound" },
    { id: "bp", name: "Bench Press", muscle: "Chest", type: "compound" },
    { id: "dl", name: "Deadlift", muscle: "Back", type: "compound" },
    { id: "ohp", name: "Overhead Press", muscle: "Shoulders", type: "compound" },
    { id: "pu", name: "Pull Up", muscle: "Back", type: "compound" },
    { id: "db_curl", name: "Dumbbell Curl", muscle: "Biceps", type: "isolation" },
];
