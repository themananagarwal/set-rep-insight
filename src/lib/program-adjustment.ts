import type { RadarDataPoint, RadarAxis } from "./radar-helpers";
import type { Routine, WorkoutDay } from "./types";
import { EXERCISE_LIBRARY } from "./exercises";

export interface GapAnalysis {
    averageScore: number;
    weakAxes: {
        axis: RadarAxis;
        score: number;
        gap: number; // average - score
    }[];
}

export type AdjustmentAction = "add_exercise" | "increase_sets" | "replace_exercise";

export interface ProgramChange {
    dayId: string;
    dayName: string;
    action: AdjustmentAction;
    exerciseId?: string; // id from library
    targetSets?: number; // amount to increase or set to
    reason: string;
    expectedImpact?: string;
}

export interface PlanPatch {
    status: "ok";
    gapsFound: GapAnalysis;
    changes: ProgramChange[];
}

import { differenceInDays } from "date-fns";

/**
 * 1. DETECT GAPS
 */
export const analyzeGaps = (radarData: RadarDataPoint[]): GapAnalysis => {
    if (radarData.length === 0) return { averageScore: 0, weakAxes: [] };

    const totalScore = radarData.reduce((sum, p) => sum + p.score, 0);
    const averageScore = totalScore / radarData.length;
    const GAP_THRESHOLD = 8; // If score is 8 points below average, it's a gap.

    const weakAxes = radarData
        .filter(p => (averageScore - p.score) >= GAP_THRESHOLD)
        .map(p => ({
            axis: p.axis,
            score: p.score,
            gap: averageScore - p.score
        }))
        .sort((a, b) => b.gap - a.gap); // Biggest gap first

    return { averageScore, weakAxes };
};

/**
 * 2. GENERATE ADJUSTMENTS
 */
export const generateProgramAdjustments = (
    radarData: RadarDataPoint[],
    routine: Routine,
    history: { completedAt: number }[]
): PlanPatch | { status: "insufficient_data", daysCollected: number } => {

    // 0. CHECK HISTORY DURATION
    if (history.length > 0) {
        const firstWorkout = history.reduce((min, h) => Math.min(min, h.completedAt), Date.now());
        const daysCollected = differenceInDays(Date.now(), firstWorkout);

        if (daysCollected < 14) {
            return { status: "insufficient_data", daysCollected };
        }
    } else {
        return { status: "insufficient_data", daysCollected: 0 };
    }

    const gaps = analyzeGaps(radarData);
    const changes: ProgramChange[] = [];

    if (gaps.weakAxes.length === 0) return { status: "ok", gapsFound: gaps, changes: [] };

    // Limit to top 2 weak axes to avoid overwhelming changes
    const targetAxes = gaps.weakAxes.slice(0, 2);

    targetAxes.forEach(weakness => {
        const { axis, gap } = weakness;

        // Strategy:
        // 1. Find a day that already works this muscle (to add volume)
        // 2. OR Find a day that works a complementary muscle (e.g. Back day for Rear Delts/Biceps)
        // 3. Add exercise or Increase sets

        let bestDayForIntervention: WorkoutDay | null = null;


        // Find days that already have exercises for this axis
        const daysWithAxis = routine.days.filter(day => {
            return day.exercises.some(e => {
                const def = EXERCISE_LIBRARY[e.exerciseId];
                return def?.primaryAxis === axis || def?.secondaryAxis === axis;
            });
        });

        if (daysWithAxis.length > 0) {
            // Case A: Reinforce existing day
            bestDayForIntervention = daysWithAxis[0]; // Just pick first for MVP

            // Check if volume is already high (> 15 sets for this muscle?)
            // If so, suggest intensity techniques? For now, simple volume.

            // Should we add sets to existing exercise OR add new exercise?
            // If gap is HUGE (>15), add new exercise.
            // If gap is MODERATE (8-15), add sets.

            if (gap > 15) {
                // ADD NEW EXERCISE
                const newExId = recommendExerciseForAxis(axis, routine);
                if (newExId) {
                    changes.push({
                        dayId: bestDayForIntervention.id,
                        dayName: bestDayForIntervention.name,
                        action: "add_exercise",
                        exerciseId: newExId,
                        targetSets: 3,
                        reason: `Major Gap in ${formatAxis(axis)} (-${Math.round(gap)}). Adding dedicated volume.`,
                        expectedImpact: "High"
                    });
                }
            } else {
                // INCREASE SETS
                // Find the main compound for this axis in this day
                const targetEx = bestDayForIntervention.exercises.find(e => {
                    const def = EXERCISE_LIBRARY[e.exerciseId];
                    return def?.primaryAxis === axis && def?.tier === "S";
                });

                if (targetEx) {
                    changes.push({
                        dayId: bestDayForIntervention.id,
                        dayName: bestDayForIntervention.name,
                        action: "increase_sets",
                        exerciseId: targetEx.exerciseId,
                        targetSets: 1, // Add +1 set
                        reason: `Moderate Gap in ${formatAxis(axis)}. Increasing main lift volume.`,
                        expectedImpact: "Medium"
                    });
                } else {
                    // Fallback: Add accessory exercise
                    const newExId = recommendExerciseForAxis(axis, routine, "B");
                    if (newExId) {
                        changes.push({
                            dayId: bestDayForIntervention.id,
                            dayName: bestDayForIntervention.name,
                            action: "add_exercise",
                            exerciseId: newExId,
                            targetSets: 3,
                            reason: `Gap in ${formatAxis(axis)}. Adding isolation work.`,
                            expectedImpact: "Medium"
                        });
                    }
                }
            }

        } else {
            // Case B: Frequency - Axis not trained? Add to a compatible day.
            // E.g. Add Biceps to Back Day. Add Shoulders to Chest Day.
            // Find a day with room (fewest exercises?)
            const shortestDay = routine.days.sort((a, b) => a.exercises.length - b.exercises.length)[0];

            const newExId = recommendExerciseForAxis(axis, routine);
            if (newExId) {
                changes.push({
                    dayId: shortestDay.id,
                    dayName: shortestDay.name,
                    action: "add_exercise",
                    exerciseId: newExId,
                    targetSets: 3,
                    reason: `Untrained Axis: ${formatAxis(axis)}. Adding to ${shortestDay.name}.`,
                    expectedImpact: "High"
                });
            }
        }
    });

    return { status: "ok", gapsFound: gaps, changes };
};

// Helper: Pick an exercise not already in routine
const recommendExerciseForAxis = (axis: RadarAxis, routine: Routine, tierPreference?: "S" | "A" | "B"): string | null => {
    // Get all exercises for this axis
    const candidates = Object.values(EXERCISE_LIBRARY).filter(def => {
        const matchesAxis = def.primaryAxis === axis;
        const matchesTier = tierPreference ? def.tier === tierPreference : true;
        return matchesAxis && matchesTier;
    });

    // Filter out ones already in use
    const usedIds = new Set<string>();
    routine.days.forEach(d => d.exercises.forEach(e => usedIds.add(e.exerciseId)));

    const available = candidates.filter(c => !usedIds.has(c.id));

    if (available.length > 0) {
        // Pick random or first?
        // S-Tier priority if not specified
        return available.sort((a, b) => a.tier.localeCompare(b.tier))[0].id;
    }

    return null;
};

const formatAxis = (axis: string) => axis.replace("_", " & ").toUpperCase();
