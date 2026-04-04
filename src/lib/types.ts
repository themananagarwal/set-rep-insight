export type ClientType = "gym" | "physio";

export type UserProfile = {
    id: string;
    email: string;
    phone?: string;
    password?: string; // Mock password for POC
    role: "admin" | "client";
    trainerId?: string; // If role is client, who manages them
    name: string;
    type?: ClientType; // "gym" (default) or "physio"
    
    // Fitness Stats (optional for admins)
    gender?: "male" | "female" | "other";
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
    trackingType?: "reps" | "time"; // Optional: for timed exercises (planks, cardio)
    notes?: string; // Per-exercise notes
    scope?: "system" | "global" | "private"; // system = built-in, global = admin added for all clients, private = client-only
    createdBy?: string; // userId who created it (admin or client)
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

// ── SESSION SYSTEM ───────────────────────────────────────────────────────────

export type SessionPackage = {
    id: string;
    clientId: string;
    trainerId: string;
    totalSessions: number;
    sessionsUsed: number;
    sessionsRemaining: number;
    expiryDate?: number; // Unix timestamp
    createdAt: number;
};

export type SessionLog = {
    id: string;
    clientId: string;
    trainerId: string;
    timestamp: number;
    verificationMethod: 'qr_scan' | 'manual';
    status: 'completed';
    nonce: string; // For dedup
};

// ── PHYSIO SYSTEM ────────────────────────────────────────────────────────────

export type PhysioEvaluation = {
    clientId: string;
    symptoms: string;
    painPoints: string;
    preliminaryDiagnosis: string;
    finalDiagnosis: string;
};

export type PhysioSessionNote = {
    id: string;
    clientId: string;
    date: number; // timestamp
    patientFeedback: string;
    treatmentDone: string;
    remarks: string;
};
