/**
 * PROGRESSION SCORING
 * Computes 5 sub-scores and the final weighted progression_readiness_score.
 */

import type { WorkoutSet } from "../types";
import type { ExerciseClass } from "./exerciseProfiles";
import { getExerciseProfile } from "./exerciseProfiles";
import { getFatigueBucket } from "./fatigueTracker";

export interface SetHistory {
    weight: number;
    reps: number;
    rpe: number;
    completedAt: number;
}

export interface HistoryAnalysis {
    lastSessionBestWeight: number;
    lastSessionBestReps: number;
    lastSessionAvgRpe: number;
    repeatedSuccessCount: number;
    repeatedStruggleCount: number;
    trend_direction: "improving" | "flat" | "declining";
    stabilityScore: number; // 0-1
}

export interface ScoringInput {
    completedSet: WorkoutSet;
    exerciseId: string;
    /** 1-indexed set number within this exercise */
    setNumber: number;
    totalExercisesCompletedBefore: number;
    primaryMuscleFatigue: number;
    /** Last 3 sessions worth of sets for this exercise */
    exerciseHistory: WorkoutSet[];
    /** Rep range from the plan, if any */
    planRepRange?: [number, number];
}

export interface SubScores {
    performance_score: number;
    effort_score: number;
    trend_score: number;
    fatigue_context_score: number;
    stability_score: number;
    progression_readiness_score: number;
}

/** Target RPE zone by exercise class */
const TARGET_RPE_ZONE: Record<ExerciseClass, [number, number]> = {
    heavy_compound: [7.5, 9],
    moderate_compound: [8, 9],
    machine_compound: [8, 9.5],
    isolation: [8.5, 9.5],
    bodyweight: [7.5, 9],
};

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

/** Analyse history into structured metrics */
export function analyseHistory(history: WorkoutSet[]): HistoryAnalysis {
    if (history.length === 0) {
        return {
            lastSessionBestWeight: 0, lastSessionBestReps: 0, lastSessionAvgRpe: 8,
            repeatedSuccessCount: 0, repeatedStruggleCount: 0,
            trend_direction: "flat", stabilityScore: 0.5
        };
    }

    // Group by session date (day boundary)
    const byDay = new Map<string, WorkoutSet[]>();
    for (const s of history) {
        const day = new Date(s.completedAt).toDateString();
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day)!.push(s);
    }

    const days = Array.from(byDay.values()).sort((a, b) =>
        b[0].completedAt - a[0].completedAt
    );

    const lastDay = days[0] ?? [];
    const lastSessionBestWeight = Math.max(...lastDay.map(s => s.weight), 0);
    const lastSessionBestReps = Math.max(...lastDay.map(s => s.reps), 0);
    const lastSessionAvgRpe = lastDay.length
        ? lastDay.reduce((sum, s) => sum + (s.rpe ?? 8), 0) / lastDay.length
        : 8;

    // Trend from last 3 sessions
    const trendDays = days.slice(0, 3);
    let betterSessions = 0;
    let worseSessions = 0;

    for (let i = 0; i < trendDays.length - 1; i++) {
        const current = trendDays[i];
        const previous = trendDays[i + 1];
        const curBest = Math.max(...current.map(s => s.weight * (1 + s.reps / 30)));
        const prevBest = Math.max(...previous.map(s => s.weight * (1 + s.reps / 30)));
        const curRpe = current.reduce((s, x) => s + (x.rpe ?? 8), 0) / current.length;
        const prevRpe = previous.reduce((s, x) => s + (x.rpe ?? 8), 0) / previous.length;

        if (curBest >= prevBest && curRpe <= prevRpe + 0.5) betterSessions++;
        else if (curBest < prevBest * 0.97 || curRpe > prevRpe + 1) worseSessions++;
    }

    const trend_direction: "improving" | "flat" | "declining" =
        betterSessions >= 2 ? "improving" :
        worseSessions >= 2 ? "declining" : "flat";

    // Repeated success / struggle at the current weight
    const currentWeight = history.length > 0 ? history.sort((a,b) => b.completedAt - a.completedAt)[0].weight : 0;
    let repeatedSuccessCount = 0;
    let repeatedStruggleCount = 0;

    for (const s of history.slice(0, 10)) {
        if (Math.abs(s.weight - currentWeight) < 0.5) {
            if ((s.rpe ?? 8) <= 8.5 && s.reps >= lastSessionBestReps) repeatedSuccessCount++;
            else if ((s.rpe ?? 8) > 9 || s.reps < lastSessionBestReps - 2) repeatedStruggleCount++;
        }
    }

    // Stability — how consistent is logging/performance
    const stabilityScore = clamp(
        0.3 + (days.length >= 3 ? 0.3 : days.length * 0.1) + (repeatedSuccessCount >= 2 ? 0.4 : 0),
        0, 1
    );

    return {
        lastSessionBestWeight, lastSessionBestReps, lastSessionAvgRpe,
        repeatedSuccessCount, repeatedStruggleCount,
        trend_direction, stabilityScore
    };
}

export function computeScores(input: ScoringInput): SubScores {
    const { completedSet, exerciseId, setNumber, primaryMuscleFatigue, exerciseHistory, planRepRange } = input;
    const { weight, reps, rpe: rpeRaw } = completedSet;
    const rpe = rpeRaw ?? 8;

    const profile = getExerciseProfile(exerciseId);
    const exerciseClass = profile.exercise_class;
    const [minRep, maxRep] = planRepRange ?? profile.standard_rep_zone;

    const history_analysis = analyseHistory(exerciseHistory);
    const { lastSessionBestWeight, lastSessionBestReps } = history_analysis;

    const e1RM = weight * (1 + reps / 30);
    const lastE1RM = lastSessionBestWeight > 0
        ? lastSessionBestWeight * (1 + lastSessionBestReps / 30)
        : e1RM * 0.9;

    // ─ A. PERFORMANCE SCORE ───────────────────────────────────────────────
    let performance_score = 0.5;

    // Did we beat recent history?
    if (lastE1RM > 0) {
        const e1rmRatio = e1RM / lastE1RM;
        performance_score = clamp(0.5 + (e1rmRatio - 1) * 2.5, 0, 1);
    }

    // Rep zone bonus/penalty
    if (reps >= maxRep && rpe <= 8.5) performance_score = clamp(performance_score + 0.15, 0, 1);
    if (reps < minRep) performance_score = clamp(performance_score - 0.20, 0, 1);

    // ─ B. EFFORT SCORE ────────────────────────────────────────────────────
    const [rpeMin, rpeMax] = TARGET_RPE_ZONE[exerciseClass];
    let effort_score: number;
    if (rpe >= rpeMin && rpe <= rpeMax) {
        effort_score = 0.85 + (0.15 * (rpe - rpeMin) / (rpeMax - rpeMin));
    } else if (rpe < rpeMin) {
        // Under-pushed
        effort_score = clamp(0.85 - (rpeMin - rpe) * 0.15, 0.2, 0.85);
    } else {
        // Overshot
        effort_score = clamp(0.85 - (rpe - rpeMax) * 0.18, 0, 0.85);
    }
    effort_score = clamp(effort_score, 0, 1);

    // ─ C. TREND SCORE ─────────────────────────────────────────────────────
    const { trend_direction, repeatedSuccessCount, repeatedStruggleCount } = history_analysis;
    let trend_score =
        trend_direction === "improving" ? 0.75 :
        trend_direction === "flat" ? 0.50 : 0.25;

    trend_score = clamp(trend_score + repeatedSuccessCount * 0.08 - repeatedStruggleCount * 0.08, 0, 1);

    // ─ D. FATIGUE CONTEXT SCORE ───────────────────────────────────────────
    const bucket = getFatigueBucket(primaryMuscleFatigue);
    let fatigue_context_score: number;
    if (bucket === "low") {
        // Fresh — strong perf gets MORE credit, weak perf gets MORE penalty
        fatigue_context_score = performance_score >= 0.6 ? 0.8 : 0.3;
    } else if (bucket === "moderate") {
        fatigue_context_score = 0.6;
    } else if (bucket === "high") {
        // Late in workout — poor sets are expected, don't penalise as hard
        fatigue_context_score = rpe > 9 ? 0.55 : 0.50;
    } else {
        // Very high fatigue — almost any poor set is excused
        fatigue_context_score = 0.45;
    }

    // Early sets that perform well should get bonus
    if (setNumber === 1 && performance_score >= 0.7 && rpe <= 8) {
        fatigue_context_score = clamp(fatigue_context_score + 0.15, 0, 1);
    }

    // ─ E. STABILITY SCORE ─────────────────────────────────────────────────
    const stability_score = history_analysis.stabilityScore;

    // ─ FINAL READINESS ────────────────────────────────────────────────────
    const progression_readiness_score = clamp(
        0.32 * performance_score +
        0.22 * effort_score +
        0.22 * trend_score +
        0.14 * fatigue_context_score +
        0.10 * stability_score,
        0, 1
    );

    return {
        performance_score: Math.round(performance_score * 100) / 100,
        effort_score: Math.round(effort_score * 100) / 100,
        trend_score: Math.round(trend_score * 100) / 100,
        fatigue_context_score: Math.round(fatigue_context_score * 100) / 100,
        stability_score: Math.round(stability_score * 100) / 100,
        progression_readiness_score: Math.round(progression_readiness_score * 100) / 100,
    };
}
