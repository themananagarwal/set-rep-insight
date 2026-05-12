import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder';

// Detect if real credentials are present (not placeholder values)
export const isSupabaseConfigured =
    !!supabaseUrl &&
    !supabaseUrl.includes('placeholder') &&
    !!supabaseAnonKey &&
    !supabaseAnonKey.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Database Types ─────────────────────────────────────────────────────────

export type DbProfile = {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'client';
    trainer_id: string | null;
    phone: string | null;
    gender: 'male' | 'female' | 'other' | null;
    weight: number | null;
    height: number | null;
    goal: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'fat_loss' | null;
    goal_weight: number | null;
    body_fat: number | null;
    activity_level: 'sedentary' | 'active' | 'athlete' | null;
    created_at: string;
};

export type DbRoutine = {
    id: string;
    user_id: string;
    author_id: string | null;
    name: string;
    description: string | null;
    rationale: string;
    days: unknown; // jsonb
    current_day_index: number;
    start_date: number;
    last_modified: number;
    created_at: string;
};

export type DbWorkoutSet = {
    id: string;
    user_id: string;
    exercise_id: string;
    weight: number;
    reps: number;
    duration: number | null;
    rpe: number | null;
    completed_at: number;
    created_at: string;
};

export type DbSessionPackage = {
    id: string;
    client_id: string;
    trainer_id: string;
    total_sessions: number;
    sessions_used: number;
    sessions_remaining: number;
    expiry_date: string | null;
    created_at: string;
};

export type DbSessionLog = {
    id: string;
    client_id: string;
    trainer_id: string;
    timestamp: number;
    verification_method: 'qr_scan' | 'manual';
    status: 'completed';
    nonce: string;
    created_at: string;
};

export type DbCustomExercise = {
    id: string;
    trainer_id: string;
    name: string;
    primary_axis: string;
    tracking_type: 'reps' | 'time';
    created_at: string;
};
