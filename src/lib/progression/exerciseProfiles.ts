/**
 * EXERCISE PROFILES
 * Defines every exercise's class, loading type, progression method, fatigue cost,
 * rep zone, and load increment rules. All local, no cloud dependency.
 */

export type ExerciseClass =
    | "heavy_compound"
    | "moderate_compound"
    | "machine_compound"
    | "isolation"
    | "bodyweight";

export type LoadingType =
    | "barbell"
    | "dumbbell_pair"
    | "single_dumbbell"
    | "machine_stack"
    | "cable"
    | "plate_loaded_machine"
    | "smith_machine"
    | "bodyweight"
    | "assisted_bodyweight";

export type ProgressionMethod = "load_first" | "reps_first" | "hybrid";
export type ProgressionSpeed = "slow" | "medium" | "medium_fast" | "fast";
export type FatigueCost = "high" | "medium" | "low";

export interface IncrementRule {
    mild: number;
    moderate: number;
    mild_decrease: number;
    moderate_decrease: number;
}

export interface ExerciseProfile {
    id: string;
    exercise_class: ExerciseClass;
    loading_type: LoadingType;
    progression_method: ProgressionMethod;
    progression_speed: ProgressionSpeed;
    fatigue_cost: FatigueCost;
    /** [min, max] reps */
    standard_rep_zone: [number, number];
    increment: IncrementRule;
    /** How high readiness must be to trigger increase */
    readiness_threshold: number;
}

const DEFAULT_BARBELL_INCREMENT: IncrementRule = { mild: 2.5, moderate: 5, mild_decrease: 2.5, moderate_decrease: 5 };
const DEFAULT_DUMBBELL_INCREMENT: IncrementRule = { mild: 2, moderate: 4, mild_decrease: 2, moderate_decrease: 4 };
const DEFAULT_MACHINE_INCREMENT: IncrementRule = { mild: 5, moderate: 10, mild_decrease: 5, moderate_decrease: 10 };
const DEFAULT_CABLE_INCREMENT: IncrementRule = { mild: 5, moderate: 5, mild_decrease: 5, moderate_decrease: 5 };
const DEFAULT_PLATE_INCREMENT: IncrementRule = { mild: 5, moderate: 10, mild_decrease: 5, moderate_decrease: 10 };

const EXERCISE_PROFILES: ExerciseProfile[] = [
    // ── CHEST ──────────────────────────────────────────────────────────────
    {
        id: "bench_press",
        exercise_class: "heavy_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "slow",
        fatigue_cost: "high", standard_rep_zone: [5, 8],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.78
    },
    {
        id: "incline_bench_press",
        exercise_class: "moderate_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [6, 10],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "decline_bench_press",
        exercise_class: "moderate_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [6, 10],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "dumbbell_flat_press",
        exercise_class: "moderate_compound", loading_type: "dumbbell_pair",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_DUMBBELL_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "incline_dumbbell_press",
        exercise_class: "moderate_compound", loading_type: "dumbbell_pair",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_DUMBBELL_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "machine_chest_press",
        exercise_class: "machine_compound", loading_type: "machine_stack",
        progression_method: "hybrid", progression_speed: "medium_fast",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_MACHINE_INCREMENT, readiness_threshold: 0.70
    },
    {
        id: "cable_fly",
        exercise_class: "isolation", loading_type: "cable",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_CABLE_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "high_to_low_cable_fly",
        exercise_class: "isolation", loading_type: "cable",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_CABLE_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "low_to_high_cable_fly",
        exercise_class: "isolation", loading_type: "cable",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_CABLE_INCREMENT, readiness_threshold: 0.68
    },

    // ── SHOULDERS ──────────────────────────────────────────────────────────
    {
        id: "overhead_press",
        exercise_class: "heavy_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "slow",
        fatigue_cost: "high", standard_rep_zone: [5, 8],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.78
    },
    {
        id: "seated_dumbbell_press",
        exercise_class: "moderate_compound", loading_type: "dumbbell_pair",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_DUMBBELL_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "arnold_press",
        exercise_class: "moderate_compound", loading_type: "dumbbell_pair",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_DUMBBELL_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "lateral_raise",
        exercise_class: "isolation", loading_type: "dumbbell_pair",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [12, 20],
        increment: { mild: 2, moderate: 2, mild_decrease: 2, moderate_decrease: 2 },
        readiness_threshold: 0.68
    },
    {
        id: "cable_lateral_raise",
        exercise_class: "isolation", loading_type: "cable",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [12, 20],
        increment: DEFAULT_CABLE_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "rear_delt_fly",
        exercise_class: "isolation", loading_type: "dumbbell_pair",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [12, 20],
        increment: DEFAULT_DUMBBELL_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "face_pull",
        exercise_class: "isolation", loading_type: "cable",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [12, 20],
        increment: DEFAULT_CABLE_INCREMENT, readiness_threshold: 0.68
    },

    // ── BACK ───────────────────────────────────────────────────────────────
    {
        id: "barbell_row",
        exercise_class: "heavy_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "slow",
        fatigue_cost: "high", standard_rep_zone: [5, 8],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.78
    },
    {
        id: "chest_supported_row",
        exercise_class: "moderate_compound", loading_type: "machine_stack",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_MACHINE_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "seated_cable_row",
        exercise_class: "machine_compound", loading_type: "cable",
        progression_method: "hybrid", progression_speed: "medium_fast",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_CABLE_INCREMENT, readiness_threshold: 0.70
    },
    {
        id: "lat_pulldown",
        exercise_class: "machine_compound", loading_type: "machine_stack",
        progression_method: "hybrid", progression_speed: "medium_fast",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_MACHINE_INCREMENT, readiness_threshold: 0.70
    },
    {
        id: "pull_up",
        exercise_class: "bodyweight", loading_type: "bodyweight",
        progression_method: "reps_first", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [6, 12],
        increment: { mild: 2.5, moderate: 5, mild_decrease: 2.5, moderate_decrease: 5 },
        readiness_threshold: 0.74
    },
    {
        id: "chin_up",
        exercise_class: "bodyweight", loading_type: "bodyweight",
        progression_method: "reps_first", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [6, 12],
        increment: { mild: 2.5, moderate: 5, mild_decrease: 2.5, moderate_decrease: 5 },
        readiness_threshold: 0.74
    },

    // ── BICEPS ─────────────────────────────────────────────────────────────
    {
        id: "barbell_curl",
        exercise_class: "isolation", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [8, 12],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "dumbbell_curl",
        exercise_class: "isolation", loading_type: "dumbbell_pair",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_DUMBBELL_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "hammer_curl",
        exercise_class: "isolation", loading_type: "dumbbell_pair",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_DUMBBELL_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "preacher_curl",
        exercise_class: "isolation", loading_type: "machine_stack",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_MACHINE_INCREMENT, readiness_threshold: 0.68
    },

    // ── TRICEPS ────────────────────────────────────────────────────────────
    {
        id: "triceps_pushdown",
        exercise_class: "isolation", loading_type: "cable",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_CABLE_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "overhead_triceps_extension",
        exercise_class: "isolation", loading_type: "cable",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_CABLE_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "close_grip_bench_press",
        exercise_class: "moderate_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [6, 10],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.74
    },

    // ── LEGS ───────────────────────────────────────────────────────────────
    {
        id: "back_squat",
        exercise_class: "heavy_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "slow",
        fatigue_cost: "high", standard_rep_zone: [5, 8],
        increment: { mild: 2.5, moderate: 5, mild_decrease: 2.5, moderate_decrease: 5 },
        readiness_threshold: 0.78
    },
    {
        id: "front_squat",
        exercise_class: "heavy_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "slow",
        fatigue_cost: "high", standard_rep_zone: [5, 8],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.78
    },
    {
        id: "leg_press",
        exercise_class: "machine_compound", loading_type: "plate_loaded_machine",
        progression_method: "hybrid", progression_speed: "medium_fast",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_PLATE_INCREMENT, readiness_threshold: 0.70
    },
    {
        id: "hack_squat",
        exercise_class: "machine_compound", loading_type: "plate_loaded_machine",
        progression_method: "hybrid", progression_speed: "medium_fast",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_PLATE_INCREMENT, readiness_threshold: 0.70
    },
    {
        id: "bulgarian_split_squat",
        exercise_class: "moderate_compound", loading_type: "dumbbell_pair",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_DUMBBELL_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "walking_lunges",
        exercise_class: "moderate_compound", loading_type: "dumbbell_pair",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [10, 16],
        increment: DEFAULT_DUMBBELL_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "romanian_deadlift",
        exercise_class: "heavy_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "slow",
        fatigue_cost: "high", standard_rep_zone: [6, 10],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.78
    },
    {
        id: "stiff_leg_deadlift",
        exercise_class: "heavy_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "slow",
        fatigue_cost: "high", standard_rep_zone: [6, 10],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.78
    },
    {
        id: "conventional_deadlift",
        exercise_class: "heavy_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "slow",
        fatigue_cost: "high", standard_rep_zone: [3, 6],
        increment: { mild: 2.5, moderate: 5, mild_decrease: 2.5, moderate_decrease: 5 },
        readiness_threshold: 0.78
    },
    {
        id: "hip_thrust",
        exercise_class: "moderate_compound", loading_type: "barbell",
        progression_method: "hybrid", progression_speed: "medium",
        fatigue_cost: "medium", standard_rep_zone: [8, 12],
        increment: DEFAULT_BARBELL_INCREMENT, readiness_threshold: 0.74
    },
    {
        id: "leg_curl",
        exercise_class: "isolation", loading_type: "machine_stack",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_MACHINE_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "leg_extension",
        exercise_class: "isolation", loading_type: "machine_stack",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [10, 15],
        increment: DEFAULT_MACHINE_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "standing_calf_raise",
        exercise_class: "isolation", loading_type: "machine_stack",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [12, 20],
        increment: DEFAULT_MACHINE_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "seated_calf_raise",
        exercise_class: "isolation", loading_type: "machine_stack",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [12, 20],
        increment: DEFAULT_MACHINE_INCREMENT, readiness_threshold: 0.68
    },

    // ── CORE ───────────────────────────────────────────────────────────────
    {
        id: "crunch",
        exercise_class: "bodyweight", loading_type: "bodyweight",
        progression_method: "reps_first", progression_speed: "medium",
        fatigue_cost: "low", standard_rep_zone: [15, 25],
        increment: { mild: 2.5, moderate: 5, mild_decrease: 2.5, moderate_decrease: 5 },
        readiness_threshold: 0.68
    },
    {
        id: "cable_crunch",
        exercise_class: "isolation", loading_type: "cable",
        progression_method: "reps_first", progression_speed: "fast",
        fatigue_cost: "low", standard_rep_zone: [12, 20],
        increment: DEFAULT_CABLE_INCREMENT, readiness_threshold: 0.68
    },
    {
        id: "russian_twist",
        exercise_class: "bodyweight", loading_type: "bodyweight",
        progression_method: "reps_first", progression_speed: "medium",
        fatigue_cost: "low", standard_rep_zone: [15, 25],
        increment: { mild: 2.5, moderate: 5, mild_decrease: 2.5, moderate_decrease: 5 },
        readiness_threshold: 0.68
    },
    {
        id: "plank",
        exercise_class: "bodyweight", loading_type: "bodyweight",
        progression_method: "reps_first", progression_speed: "medium",
        fatigue_cost: "low", standard_rep_zone: [1, 3], // "reps" = intervals
        increment: { mild: 5, moderate: 10, mild_decrease: 5, moderate_decrease: 10 },
        readiness_threshold: 0.68
    },
];

/** Map for O(1) lookup */
const PROFILE_MAP = new Map<string, ExerciseProfile>(
    EXERCISE_PROFILES.map(p => [p.id, p])
);

/** Returns the profile for a given exerciseId, or a sensible isolation default. */
export function getExerciseProfile(exerciseId: string): ExerciseProfile {
    const profile = PROFILE_MAP.get(exerciseId);
    if (profile) return profile;

    // Fallback: default to a safe isolation profile
    return {
        id: exerciseId,
        exercise_class: "isolation",
        loading_type: "machine_stack",
        progression_method: "reps_first",
        progression_speed: "fast",
        fatigue_cost: "low",
        standard_rep_zone: [8, 15],
        increment: DEFAULT_MACHINE_INCREMENT,
        readiness_threshold: 0.68
    };
}
