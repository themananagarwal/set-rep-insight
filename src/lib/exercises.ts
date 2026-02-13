import type { Exercise } from "./types";

export const EXERCISE_CATEGORIES = [
    "Legs",
    "Chest",
    "Back",
    "Shoulders",
    "Arms",
    "Core",
    "Cardio",
    "Other"
] as const;

export const ALL_EXERCISES: Exercise[] = [
    // --- LEGS ---
    { id: "barbell_back_squat", name: "Barbell Back Squat", muscle: "Legs", type: "compound" },
    { id: "barbell_front_squat", name: "Barbell Front Squat", muscle: "Legs", type: "compound" },
    { id: "goblet_squat", name: "Goblet Squat", muscle: "Legs", type: "compound" },
    { id: "leg_press", name: "Leg Press", muscle: "Legs", type: "compound" },
    { id: "lunges", name: "Walking Lunges", muscle: "Legs", type: "compound" },
    { id: "r Romanian_deadlift", name: "Romanian Deadlift", muscle: "Legs", type: "compound" },
    { id: "leg_extension", name: "Leg Extension", muscle: "Legs", type: "isolation" },
    { id: "leg_curl", name: "Leg Curl", muscle: "Legs", type: "isolation" },
    { id: "calf_raise", name: "Standing Calf Raise", muscle: "Legs", type: "isolation" },

    // --- CHEST ---
    { id: "bench_press", name: "Barbell Bench Press", muscle: "Chest", type: "compound" },
    { id: "db_bench_press", name: "Dumbbell Bench Press", muscle: "Chest", type: "compound" },
    { id: "incline_bench_press", name: "Incline Bench Press", muscle: "Chest", type: "compound" },
    { id: "chest_fly", name: "Cable Chest Fly", muscle: "Chest", type: "isolation" },
    { id: "push_up", name: "Push Up", muscle: "Chest", type: "compound" },

    // --- BACK ---
    { id: "deadlift", name: "Deadlift", muscle: "Back", type: "compound" },
    { id: "pull_up", name: "Pull Up", muscle: "Back", type: "compound" },
    { id: "lat_pulldown", name: "Lat Pulldown", muscle: "Back", type: "compound" },
    { id: "db_row", name: "Dumbbell Row", muscle: "Back", type: "compound" },
    { id: "barbell_row", name: "Barbell Row", muscle: "Back", type: "compound" },
    { id: "face_pull", name: "Face Pull", muscle: "Back", type: "isolation" },

    // --- SHOULDERS ---
    { id: "ohp", name: "Overhead Press", muscle: "Shoulders", type: "compound" },
    { id: "db_shoulder_press", name: "Dumbbell Shoulder Press", muscle: "Shoulders", type: "compound" },
    { id: "lateral_raise", name: "Lateral Raise", muscle: "Shoulders", type: "isolation" },
    { id: "front_raise", name: "Front Raise", muscle: "Shoulders", type: "isolation" },
    { id: "rear_delt_fly", name: "Rear Delt Fly", muscle: "Shoulders", type: "isolation" },

    // --- ARMS ---
    { id: "barbell_curl", name: "Barbell Curl", muscle: "Arms", type: "isolation" },
    { id: "db_curl", name: "Dumbbell Curl", muscle: "Arms", type: "isolation" },
    { id: "hammer_curl", name: "Hammer Curl", muscle: "Arms", type: "isolation" },
    { id: "tricep_extension", name: "Cable Tricep Extension", muscle: "Arms", type: "isolation" },
    { id: "skull_crusher", name: "Skull Crusher", muscle: "Arms", type: "isolation" },
    { id: "dips", name: "Tricep Dips", muscle: "Arms", type: "compound" },

    // --- CORE ---
    { id: "plank", name: "Plank", muscle: "Core", type: "isolation" },
    { id: "crunch", name: "Crunch", muscle: "Core", type: "isolation" },
    { id: "leg_raise", name: "Hanging Leg Raise", muscle: "Core", type: "isolation" },
    { id: "lying_leg_raise", name: "Lying Leg Raise", muscle: "Legs", type: "isolation" }, // User asked for Lying Leg Raise under Legs
    { id: "cable_crunch", name: "Cable Crunch", muscle: "Core", type: "isolation" },

    // --- CARDIO ---
    { id: "cycling", name: "Cycling", muscle: "Cardio", type: "compound" },

    // --- NEW ADDITIONS ---
    { id: "glute_bridge", name: "Glute Bridge", muscle: "Legs", type: "isolation" },
    { id: "tibialis_raise", name: "Tibialis Raise", muscle: "Legs", type: "isolation" },
    { id: "knee_press", name: "Knee Press", muscle: "Legs", type: "isolation" }, // Assuming this is a leg exercise as requested
    { id: "machine_chest_press", name: "Machine Chest Press", muscle: "Chest", type: "compound" }
];
