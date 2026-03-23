export type UserProfile = {
    id: string;
    email: string;
    phone?: string;
    password?: string; // Mock password for POC
    role: "admin" | "client";
    trainerId?: string; // If role is client, who manages them
    name: string;
    
    // Fitness Stats (optional for admins)
    gender?: "male" | "female";
    weight?: number;
    height?: number; // cm
    goalWeight?: number; 
    bodyFat?: number; 
    goal?: "strength" | "hypertrophy" | "endurance" | "weight_loss"; 
    activityLevel?: "sedentary" | "active" | "athlete";
    bloodwork?: {
        testosterone?: string; 
        iron?: string;
        vitaminD?: string;
        lastUpdated: number;
    };
};

export type Exercise = {
    id: string;
    name: string;
    muscle: string;
    type: "compound" | "isolation";
};

export type WorkoutSet = {
    id: string;
    exerciseId: string;
    weight: number;
    reps: number;
    duration?: number; // Duration in seconds (for cardio/timed exercises)
    rpe?: number; // Rate of Perceived Exertion (1-10)
    completedAt: number;
};

export type TargetSet = {
    id: string;
    type: "warmup" | "working" | "drop" | "failure";
    reps: string;    // "5", "8-12"
    weight?: string; // "100", "BW"
    duration?: number; // Duration in seconds
    rpe?: string;    // "8", "8-9"
    notes?: string;
};

export type WorkoutExercisePattern = {
    exerciseId: string;
    targetSets: number; // Deprecated but kept for summary
    targetReps: number; // Deprecated but kept for summary
    sets: TargetSet[];
};

export type WorkoutDay = {
    id: string;
    name: string; // e.g., "Push Day"
    exercises: WorkoutExercisePattern[];
};

export type Routine = {
    id: string;
    name: string;
    description?: string;
    rationale: string;
    days: WorkoutDay[];
    currentDayIndex: number;
    startDate: number;
    lastModified: number;
    authorId?: string; // Who created it (trainer vs client)
};

// The "AI" Prediction Result
export type Prediction = {
    exerciseId: string;
    suggestedWeight: number;
    suggestedReps: number;
    reasoning: string;
};
