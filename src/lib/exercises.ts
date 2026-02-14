export type RadarAxis = "chest" | "back" | "shoulders" | "quads" | "glutes_hamstrings" | "arms" | "core";

export interface ExerciseDef {
    id: string;
    name: string;
    primaryAxis: RadarAxis;
    secondaryAxis?: RadarAxis;
    pattern: "push" | "pull" | "squat" | "hinge" | "lunge" | "carry" | "core" | "isolation";
    tier: "S" | "A" | "B"; // S=Main Compound, A=Supplemental, B=Isolation/Accessory
    tags: string[]; // "dumbbell", "barbell", "machine", "bodyweight", "unilateral"
}

export const EXERCISE_LIBRARY: Record<string, ExerciseDef> = {
    // --- LEGS (QUADS) ---
    "barbell_back_squat": {
        id: "barbell_back_squat", name: "Barbell Back Squat",
        primaryAxis: "quads", secondaryAxis: "glutes_hamstrings",
        pattern: "squat", tier: "S",
        tags: ["barbell", "compound", "main"]
    },
    "barbell_front_squat": {
        id: "barbell_front_squat", name: "Front Squat",
        primaryAxis: "quads", secondaryAxis: "core",
        pattern: "squat", tier: "S",
        tags: ["barbell", "compound"]
    },
    "goblet_squat": {
        id: "goblet_squat", name: "Goblet Squat",
        primaryAxis: "quads",
        pattern: "squat", tier: "A",
        tags: ["dumbbell", "kettlebell", "beginner_friendly"]
    },
    "leg_press": {
        id: "leg_press", name: "Leg Press",
        primaryAxis: "quads",
        pattern: "squat", tier: "A",
        tags: ["machine", "hypertrophy"]
    },
    "walking_lunge": {
        id: "walking_lunge", name: "Walking Lunge",
        primaryAxis: "quads", secondaryAxis: "glutes_hamstrings",
        pattern: "lunge", tier: "A",
        tags: ["dumbbell", "bodyweight", "unilateral"]
    },
    "leg_extension": {
        id: "leg_extension", name: "Leg Extension",
        primaryAxis: "quads",
        pattern: "isolation", tier: "B",
        tags: ["machine", "isolation"]
    },

    // --- LEGS (GLUTES/HAMS) ---
    "deadlift": {
        id: "deadlift", name: "Conventional Deadlift",
        primaryAxis: "glutes_hamstrings", secondaryAxis: "back",
        pattern: "hinge", tier: "S",
        tags: ["barbell", "compound", "main"]
    },
    "romanian_deadlift": {
        id: "romanian_deadlift", name: "Romanian Deadlift",
        primaryAxis: "glutes_hamstrings", secondaryAxis: "back",
        pattern: "hinge", tier: "A",
        tags: ["barbell", "dumbbell", "hypetrophy"]
    },
    "leg_curl": {
        id: "leg_curl", name: "Leg Curl",
        primaryAxis: "glutes_hamstrings",
        pattern: "isolation", tier: "B",
        tags: ["machine", "isolation"]
    },
    "glute_bridge": {
        id: "glute_bridge", name: "Glute Bridge",
        primaryAxis: "glutes_hamstrings",
        pattern: "hinge", tier: "B",
        tags: ["bodyweight", "dumbbell"]
    },

    // --- CHEST ---
    "bench_press": {
        id: "bench_press", name: "Barbell Bench Press",
        primaryAxis: "chest", secondaryAxis: "shoulders",
        pattern: "push", tier: "S",
        tags: ["barbell", "compound", "main"]
    },
    "dumbbell_bench_press": {
        id: "dumbbell_bench_press", name: "Dumbbell Press",
        primaryAxis: "chest", secondaryAxis: "arms",
        pattern: "push", tier: "A",
        tags: ["dumbbell", "hypertrophy"]
    },
    "incline_bench_press": {
        id: "incline_bench_press", name: "Incline Bench Press",
        primaryAxis: "chest", secondaryAxis: "shoulders",
        pattern: "push", tier: "A",
        tags: ["barbell", "dumbbell"]
    },
    "push_up": {
        id: "push_up", name: "Push Up",
        primaryAxis: "chest", secondaryAxis: "core",
        pattern: "push", tier: "B",
        tags: ["bodyweight", "compound"]
    },
    "chest_fly": {
        id: "chest_fly", name: "Chest Fly",
        primaryAxis: "chest",
        pattern: "isolation", tier: "B",
        tags: ["dumbbell", "cable", "machine", "isolation"]
    },

    // --- BACK ---
    "pull_up": {
        id: "pull_up", name: "Pull Up",
        primaryAxis: "back", secondaryAxis: "arms",
        pattern: "pull", tier: "S",
        tags: ["bodyweight", "compound", "vertical"]
    },
    "barbell_row": {
        id: "barbell_row", name: "Barbell Row",
        primaryAxis: "back", secondaryAxis: "arms",
        pattern: "pull", tier: "S",
        tags: ["barbell", "compound", "horizontal"]
    },
    "dumbbell_row": {
        id: "dumbbell_row", name: "Dumbbell Row",
        primaryAxis: "back", secondaryAxis: "arms",
        pattern: "pull", tier: "A",
        tags: ["dumbbell", "unilateral", "horizontal"]
    },
    "lat_pulldown": {
        id: "lat_pulldown", name: "Lat Pulldown",
        primaryAxis: "back", secondaryAxis: "arms",
        pattern: "pull", tier: "A",
        tags: ["cable", "machine", "vertical"]
    },
    "face_pull": {
        id: "face_pull", name: "Face Pull",
        primaryAxis: "shoulders", secondaryAxis: "back", // Rear delts often grouped with back or shoulders
        pattern: "pull", tier: "B",
        tags: ["cable", "prehab"]
    },

    // --- SHOULDERS ---
    "overhead_press": {
        id: "overhead_press", name: "Overhead Press",
        primaryAxis: "shoulders", secondaryAxis: "arms",
        pattern: "push", tier: "S",
        tags: ["barbell", "compound", "vertical"]
    },
    "dumbbell_shoulder_press": {
        id: "dumbbell_shoulder_press", name: "DB Shoulder Press",
        primaryAxis: "shoulders", secondaryAxis: "arms",
        pattern: "push", tier: "A",
        tags: ["dumbbell", "hypertrophy"]
    },
    "lateral_raise": {
        id: "lateral_raise", name: "Lateral Raise",
        primaryAxis: "shoulders",
        pattern: "isolation", tier: "B",
        tags: ["dumbbell", "cable", "isolation"]
    },
    "rear_delt_fly": {
        id: "rear_delt_fly", name: "Rear Delt Fly",
        primaryAxis: "shoulders", secondaryAxis: "back",
        pattern: "isolation", tier: "B",
        tags: ["dumbbell", "machine"]
    },

    // --- ARMS ---
    "barbell_curl": {
        id: "barbell_curl", name: "Barbell Curl",
        primaryAxis: "arms",
        pattern: "isolation", tier: "B",
        tags: ["barbell", "biceps"]
    },
    "dumbbell_curl": {
        id: "dumbbell_curl", name: "Dumbbell Curl",
        primaryAxis: "arms",
        pattern: "isolation", tier: "B",
        tags: ["dumbbell", "biceps"]
    },
    "tricep_dips": {
        id: "tricep_dips", name: "Tricep Dips",
        primaryAxis: "arms", secondaryAxis: "chest",
        pattern: "push", tier: "A",
        tags: ["bodyweight", "compound", "triceps"]
    },
    "cable_tricep_extension": {
        id: "cable_tricep_extension", name: "Tricep Extension",
        primaryAxis: "arms",
        pattern: "isolation", tier: "B",
        tags: ["cable", "triceps"]
    },

    // --- CORE ---
    "plank": {
        id: "plank", name: "Plank",
        primaryAxis: "core",
        pattern: "core", tier: "B",
        tags: ["bodyweight", "static"]
    },
    "hanging_leg_raise": {
        id: "hanging_leg_raise", name: "Hanging Leg Raise",
        primaryAxis: "core",
        pattern: "core", tier: "A",
        tags: ["bodyweight"]
    },
    "cable_crunch": {
        id: "cable_crunch", name: "Cable Crunch",
        primaryAxis: "core",
        pattern: "core", tier: "B",
        tags: ["cable"]
    }
};

// Helper: Get contributions for radar analysis
export const getExerciseContributions = (exerciseId: string) => {
    const def = EXERCISE_LIBRARY[exerciseId];
    if (!def) return {};

    const contribs: Partial<Record<RadarAxis, number>> = {};

    // Primary Axis -> 1.0
    contribs[def.primaryAxis] = 1.0;

    // Secondary Axis -> 0.5 (or specific logic)
    if (def.secondaryAxis) {
        contribs[def.secondaryAxis] = 0.5;

        // Special case overrides mimicking original logic
        if (def.id === "deadlift" && def.secondaryAxis === "back") contribs["back"] = 0.8;
    }

    // Hardcoded overrides for complex compounds if needed
    if (def.id === "barbell_back_squat") contribs["core"] = 0.3;

    return contribs;
};
export const ALL_EXERCISES = Object.values(EXERCISE_LIBRARY);
