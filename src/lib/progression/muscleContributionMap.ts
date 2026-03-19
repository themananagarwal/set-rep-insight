/**
 * MUSCLE CONTRIBUTION MAP
 * Maps exercise IDs to weighted muscle stimulus contributions.
 * All contributions per exercise sum to 100.
 */

export type MuscleGroup =
    | "chest_upper" | "chest_mid" | "chest_lower"
    | "front_delts" | "side_delts" | "rear_delts"
    | "triceps" | "biceps" | "forearms"
    | "lats" | "upper_back" | "traps" | "spinal_erectors"
    | "abs" | "obliques"
    | "glutes" | "quads" | "hamstrings" | "calves" | "adductors";

export interface MuscleContribution {
    muscle: MuscleGroup;
    contribution: number; // 0-100
}

export interface ExerciseMuscleMap {
    primary: MuscleContribution[];
    secondary: MuscleContribution[];
}

const MUSCLE_MAP: Record<string, ExerciseMuscleMap> = {
    // ── CHEST ───────────────────────────────────────────────────────────────
    bench_press: {
        primary: [{ muscle: "chest_mid", contribution: 60 }],
        secondary: [{ muscle: "front_delts", contribution: 20 }, { muscle: "triceps", contribution: 20 }]
    },
    incline_bench_press: {
        primary: [{ muscle: "chest_upper", contribution: 50 }],
        secondary: [{ muscle: "front_delts", contribution: 30 }, { muscle: "triceps", contribution: 20 }]
    },
    decline_bench_press: {
        primary: [{ muscle: "chest_lower", contribution: 55 }, { muscle: "chest_mid", contribution: 25 }],
        secondary: [{ muscle: "triceps", contribution: 20 }]
    },
    dumbbell_flat_press: {
        primary: [{ muscle: "chest_mid", contribution: 55 }],
        secondary: [{ muscle: "front_delts", contribution: 20 }, { muscle: "triceps", contribution: 25 }]
    },
    incline_dumbbell_press: {
        primary: [{ muscle: "chest_upper", contribution: 50 }],
        secondary: [{ muscle: "front_delts", contribution: 30 }, { muscle: "triceps", contribution: 20 }]
    },
    machine_chest_press: {
        primary: [{ muscle: "chest_mid", contribution: 60 }],
        secondary: [{ muscle: "front_delts", contribution: 15 }, { muscle: "triceps", contribution: 25 }]
    },
    cable_fly: {
        primary: [{ muscle: "chest_mid", contribution: 70 }, { muscle: "chest_upper", contribution: 15 }],
        secondary: [{ muscle: "front_delts", contribution: 15 }]
    },
    high_to_low_cable_fly: {
        primary: [{ muscle: "chest_lower", contribution: 60 }, { muscle: "chest_mid", contribution: 25 }],
        secondary: [{ muscle: "front_delts", contribution: 15 }]
    },
    low_to_high_cable_fly: {
        primary: [{ muscle: "chest_upper", contribution: 60 }, { muscle: "chest_mid", contribution: 25 }],
        secondary: [{ muscle: "front_delts", contribution: 15 }]
    },

    // ── SHOULDERS ───────────────────────────────────────────────────────────
    overhead_press: {
        primary: [{ muscle: "front_delts", contribution: 50 }],
        secondary: [{ muscle: "triceps", contribution: 25 }, { muscle: "side_delts", contribution: 25 }]
    },
    seated_dumbbell_press: {
        primary: [{ muscle: "front_delts", contribution: 45 }, { muscle: "side_delts", contribution: 30 }],
        secondary: [{ muscle: "triceps", contribution: 25 }]
    },
    arnold_press: {
        primary: [{ muscle: "front_delts", contribution: 40 }, { muscle: "side_delts", contribution: 35 }],
        secondary: [{ muscle: "triceps", contribution: 25 }]
    },
    lateral_raise: {
        primary: [{ muscle: "side_delts", contribution: 75 }],
        secondary: [{ muscle: "upper_back", contribution: 10 }, { muscle: "traps", contribution: 15 }]
    },
    cable_lateral_raise: {
        primary: [{ muscle: "side_delts", contribution: 80 }],
        secondary: [{ muscle: "traps", contribution: 10 }, { muscle: "upper_back", contribution: 10 }]
    },
    rear_delt_fly: {
        primary: [{ muscle: "rear_delts", contribution: 70 }],
        secondary: [{ muscle: "upper_back", contribution: 20 }, { muscle: "traps", contribution: 10 }]
    },
    face_pull: {
        primary: [{ muscle: "rear_delts", contribution: 45 }, { muscle: "upper_back", contribution: 35 }],
        secondary: [{ muscle: "traps", contribution: 20 }]
    },

    // ── BACK ────────────────────────────────────────────────────────────────
    barbell_row: {
        primary: [{ muscle: "lats", contribution: 35 }, { muscle: "upper_back", contribution: 35 }],
        secondary: [{ muscle: "rear_delts", contribution: 10 }, { muscle: "biceps", contribution: 10 }, { muscle: "spinal_erectors", contribution: 10 }]
    },
    chest_supported_row: {
        primary: [{ muscle: "lats", contribution: 40 }, { muscle: "upper_back", contribution: 35 }],
        secondary: [{ muscle: "rear_delts", contribution: 15 }, { muscle: "biceps", contribution: 10 }]
    },
    seated_cable_row: {
        primary: [{ muscle: "lats", contribution: 40 }, { muscle: "upper_back", contribution: 30 }],
        secondary: [{ muscle: "biceps", contribution: 15 }, { muscle: "rear_delts", contribution: 15 }]
    },
    lat_pulldown: {
        primary: [{ muscle: "lats", contribution: 55 }],
        secondary: [{ muscle: "biceps", contribution: 20 }, { muscle: "upper_back", contribution: 15 }, { muscle: "rear_delts", contribution: 10 }]
    },
    pull_up: {
        primary: [{ muscle: "lats", contribution: 50 }],
        secondary: [{ muscle: "biceps", contribution: 20 }, { muscle: "upper_back", contribution: 20 }, { muscle: "forearms", contribution: 10 }]
    },
    chin_up: {
        primary: [{ muscle: "lats", contribution: 40 }, { muscle: "biceps", contribution: 30 }],
        secondary: [{ muscle: "upper_back", contribution: 20 }, { muscle: "forearms", contribution: 10 }]
    },

    // ── BICEPS ──────────────────────────────────────────────────────────────
    barbell_curl: {
        primary: [{ muscle: "biceps", contribution: 75 }],
        secondary: [{ muscle: "forearms", contribution: 25 }]
    },
    dumbbell_curl: {
        primary: [{ muscle: "biceps", contribution: 75 }],
        secondary: [{ muscle: "forearms", contribution: 25 }]
    },
    hammer_curl: {
        primary: [{ muscle: "forearms", contribution: 60 }],
        secondary: [{ muscle: "biceps", contribution: 40 }]
    },
    preacher_curl: {
        primary: [{ muscle: "biceps", contribution: 85 }],
        secondary: [{ muscle: "forearms", contribution: 15 }]
    },

    // ── TRICEPS ─────────────────────────────────────────────────────────────
    triceps_pushdown: {
        primary: [{ muscle: "triceps", contribution: 90 }],
        secondary: [{ muscle: "front_delts", contribution: 10 }]
    },
    overhead_triceps_extension: {
        primary: [{ muscle: "triceps", contribution: 90 }],
        secondary: [{ muscle: "front_delts", contribution: 10 }]
    },
    close_grip_bench_press: {
        primary: [{ muscle: "triceps", contribution: 45 }, { muscle: "chest_mid", contribution: 30 }],
        secondary: [{ muscle: "front_delts", contribution: 25 }]
    },

    // ── LEGS ────────────────────────────────────────────────────────────────
    back_squat: {
        primary: [{ muscle: "quads", contribution: 40 }, { muscle: "glutes", contribution: 30 }],
        secondary: [{ muscle: "adductors", contribution: 15 }, { muscle: "spinal_erectors", contribution: 15 }]
    },
    front_squat: {
        primary: [{ muscle: "quads", contribution: 50 }, { muscle: "glutes", contribution: 20 }],
        secondary: [{ muscle: "adductors", contribution: 15 }, { muscle: "spinal_erectors", contribution: 15 }]
    },
    leg_press: {
        primary: [{ muscle: "quads", contribution: 50 }, { muscle: "glutes", contribution: 25 }],
        secondary: [{ muscle: "hamstrings", contribution: 10 }, { muscle: "adductors", contribution: 15 }]
    },
    hack_squat: {
        primary: [{ muscle: "quads", contribution: 55 }, { muscle: "glutes", contribution: 25 }],
        secondary: [{ muscle: "adductors", contribution: 10 }, { muscle: "hamstrings", contribution: 10 }]
    },
    bulgarian_split_squat: {
        primary: [{ muscle: "quads", contribution: 35 }, { muscle: "glutes", contribution: 35 }],
        secondary: [{ muscle: "hamstrings", contribution: 10 }, { muscle: "adductors", contribution: 20 }]
    },
    walking_lunges: {
        primary: [{ muscle: "quads", contribution: 30 }, { muscle: "glutes", contribution: 35 }],
        secondary: [{ muscle: "hamstrings", contribution: 10 }, { muscle: "adductors", contribution: 15 }, { muscle: "calves", contribution: 10 }]
    },
    romanian_deadlift: {
        primary: [{ muscle: "hamstrings", contribution: 45 }, { muscle: "glutes", contribution: 35 }],
        secondary: [{ muscle: "spinal_erectors", contribution: 20 }]
    },
    stiff_leg_deadlift: {
        primary: [{ muscle: "hamstrings", contribution: 50 }, { muscle: "glutes", contribution: 25 }],
        secondary: [{ muscle: "spinal_erectors", contribution: 25 }]
    },
    conventional_deadlift: {
        primary: [{ muscle: "glutes", contribution: 30 }, { muscle: "hamstrings", contribution: 25 }],
        secondary: [{ muscle: "spinal_erectors", contribution: 20 }, { muscle: "upper_back", contribution: 15 }, { muscle: "traps", contribution: 10 }]
    },
    hip_thrust: {
        primary: [{ muscle: "glutes", contribution: 70 }],
        secondary: [{ muscle: "hamstrings", contribution: 20 }, { muscle: "quads", contribution: 10 }]
    },
    leg_curl: {
        primary: [{ muscle: "hamstrings", contribution: 90 }],
        secondary: [{ muscle: "calves", contribution: 10 }]
    },
    leg_extension: {
        primary: [{ muscle: "quads", contribution: 95 }],
        secondary: [{ muscle: "adductors", contribution: 5 }]
    },
    standing_calf_raise: {
        primary: [{ muscle: "calves", contribution: 95 }],
        secondary: [{ muscle: "hamstrings", contribution: 5 }]
    },
    seated_calf_raise: {
        primary: [{ muscle: "calves", contribution: 100 }],
        secondary: []
    },

    // ── CORE ────────────────────────────────────────────────────────────────
    crunch: {
        primary: [{ muscle: "abs", contribution: 100 }],
        secondary: []
    },
    cable_crunch: {
        primary: [{ muscle: "abs", contribution: 90 }],
        secondary: [{ muscle: "obliques", contribution: 10 }]
    },
    russian_twist: {
        primary: [{ muscle: "obliques", contribution: 60 }, { muscle: "abs", contribution: 40 }],
        secondary: []
    },
    plank: {
        primary: [{ muscle: "abs", contribution: 40 }, { muscle: "obliques", contribution: 30 }],
        secondary: [{ muscle: "spinal_erectors", contribution: 15 }, { muscle: "glutes", contribution: 15 }]
    },
};

export function getMuscleMap(exerciseId: string): ExerciseMuscleMap {
    return MUSCLE_MAP[exerciseId] ?? { primary: [], secondary: [] };
}

export function getAllContributions(exerciseId: string): MuscleContribution[] {
    const map = getMuscleMap(exerciseId);
    return [...map.primary, ...map.secondary];
}
