/**
 * db.ts — Supabase data service layer
 *
 * All Supabase table access goes through this file.
 * Components and stores call these functions; they never touch supabase directly.
 *
 * Naming convention: snake_case columns map to camelCase in app types.
 */

import { supabase } from './supabase';
import type { UserProfile, Routine, WorkoutSet, SessionPackage, SessionLog } from './types';
import type {
    DbProfile, DbRoutine, DbWorkoutSet,
    DbSessionPackage, DbSessionLog, DbCustomExercise
} from './supabase';

// ── Type mappers ───────────────────────────────────────────────────────────

function profileFromDb(p: DbProfile): UserProfile {
    return {
        id: p.id,
        email: p.email,
        name: p.name,
        role: p.role,
        trainerId: p.trainer_id ?? undefined,
        phone: p.phone ?? undefined,
        gender: p.gender ?? undefined,
        weight: p.weight ?? undefined,
        height: p.height ?? undefined,
        goal: (p.goal as UserProfile['goal']) ?? undefined,
        goalWeight: p.goal_weight ?? undefined,
        bodyFat: p.body_fat ?? undefined,
        activityLevel: (p.activity_level as UserProfile['activityLevel']) ?? undefined,
    };
}

function routineFromDb(r: DbRoutine): Routine {
    return {
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        rationale: r.rationale,
        days: r.days as Routine['days'],
        currentDayIndex: r.current_day_index,
        startDate: r.start_date,
        lastModified: r.last_modified,
        authorId: r.author_id ?? undefined,
    };
}

function workoutSetFromDb(s: DbWorkoutSet): WorkoutSet {
    return {
        id: s.id,
        exerciseId: s.exercise_id,
        weight: s.weight,
        reps: s.reps,
        duration: s.duration ?? undefined,
        rpe: s.rpe ?? undefined,
        completedAt: s.completed_at,
    };
}

function sessionPackageFromDb(p: DbSessionPackage): SessionPackage {
    return {
        id: p.id,
        clientId: p.client_id,
        trainerId: p.trainer_id,
        totalSessions: p.total_sessions,
        sessionsUsed: p.sessions_used,
        sessionsRemaining: p.sessions_remaining,
        expiryDate: p.expiry_date ? new Date(p.expiry_date).getTime() : undefined,
        createdAt: new Date(p.created_at).getTime(),
    };
}

function sessionLogFromDb(l: DbSessionLog): SessionLog {
    return {
        id: l.id,
        clientId: l.client_id,
        trainerId: l.trainer_id,
        timestamp: l.timestamp,
        verificationMethod: l.verification_method,
        status: l.status,
        nonce: l.nonce,
    };
}

// ── PROFILES ───────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<UserProfile | null> {
    console.log('[db] getProfile called for user:', userId);

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error || !data) return null;
        return profileFromDb(data as DbProfile);
    } catch (err) {
        console.error('[db] getProfile THREW an error:', err);
        return null;
    }
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    await supabase.from('profiles').update({
        name: updates.name,
        phone: updates.phone,
        gender: updates.gender,
        weight: updates.weight,
        height: updates.height,
        goal: updates.goal,
        goal_weight: updates.goalWeight,
        body_fat: updates.bodyFat,
        activity_level: updates.activityLevel,
        trainer_id: updates.trainerId ?? null,
    }).eq('id', userId);
}

export async function getClients(trainerId: string): Promise<UserProfile[]> {
    console.log('[db.getClients] fetching...', trainerId);
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('role', 'client');
    console.log('[db.getClients] result:', data, error);
    if (error || !data) return [];
    return (data as DbProfile[]).map(profileFromDb);
}

export async function getTrainers(masterTrainerId: string): Promise<UserProfile[]> {
    console.log('[db.getTrainers] fetching...', masterTrainerId);
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('trainer_id', masterTrainerId)
        .eq('role', 'admin');
    console.log('[db.getTrainers] result:', data, error);
    if (error || !data) return [];
    return (data as DbProfile[]).map(profileFromDb);
}

/**
 * Cross-trainer client search: finds any client in the same org by name or email.
 * RLS on profiles ensures only trainers in the same org can see these results.
 * Results are capped at 10 to keep queries fast.
 */
export async function searchClients(query: string): Promise<UserProfile[]> {
    if (!query.trim()) return [];
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
    if (error || !data) return [];
    return (data as DbProfile[]).map(profileFromDb);
}

/**
 * Get full workout history for any client in the same org (cross-trainer read).
 * RLS on workout_sets ensures only same-org trainers can access this.
 */
export async function getClientWorkoutHistory(clientId: string): Promise<WorkoutSet[]> {
    const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('user_id', clientId)
        .order('completed_at', { ascending: false })
        .limit(50);
    if (error || !data) return [];
    return (data as DbWorkoutSet[]).map(workoutSetFromDb);
}

/**
 * Create a new user (client or sub-trainer) via Supabase Auth admin API.
 * Note: This uses signUp which works from the client SDK when email auth is enabled.
 * The profile row is auto-created by the DB trigger.
 */
export async function createUser(params: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'client';
    trainerId: string;
    phone?: string;
    height?: number;
    weight?: number;
    goal?: string;
    activityLevel?: string;
}): Promise<{ user: UserProfile | null; error?: string }> {

    console.log('[db.createUser] Starting... (Using pure REST fetch)');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    try {
        // 1. Sign up the user via pure REST to bypass GoTrue broadcast loops
        const signUpRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': anonKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: params.email,
                password: params.password,
                data: { name: params.name, role: params.role }
            })
        });

        if (!signUpRes.ok) {
            const errBody = await signUpRes.json();
            console.error('[db.createUser] auth/v1/signup error:', errBody);
            return { user: null, error: errBody.msg || errBody.message || 'Failed to sign up user' };
        }

        const authData = await signUpRes.json();
        if (!authData.user || !authData.access_token) {
            return { user: null, error: 'Sign up successful but missing session data' };
        }

        // Wait briefly for the DB trigger to handle the new user and insert into public.profiles
        await new Promise(r => setTimeout(r, 800));

        // 2. Update the auto-created profile via pure REST Postgrest
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authData.user.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${authData.access_token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                trainer_id: params.trainerId,
                phone: params.phone ?? null,
                height: params.height ?? null,
                weight: params.weight ?? null,
                goal: params.goal ?? null,
                activity_level: params.activityLevel ?? null,
            })
        });

        if (!updateRes.ok) {
            console.error('[db.createUser] Could not update new user profile fields via REST:', await updateRes.text());
        } else {
            console.log('[db.createUser] Successfully assigned trainer_id via REST!');
        }

        const profile = await getProfile(authData.user.id);
        return { user: profile, error: undefined };
        
    } catch (err: any) {
        console.error('[db.createUser] FATAL REST error:', err);
        return { user: null, error: err.message || 'Fatal error during provisioning' };
    }
}

export async function deleteProfile(userId: string): Promise<void> {
    // Note: Deleting from profiles cascades (via FK). Auth user deletion
    // requires service_role key (admin). For POC, we just soft-delete the profile.
    await supabase.from('profiles').delete().eq('id', userId);
}

// ── ROUTINES ───────────────────────────────────────────────────────────────

export async function getRoutines(userId: string): Promise<Routine[]> {
    const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as DbRoutine[]).map(routineFromDb);
}

export async function upsertRoutine(routine: Routine, userId: string): Promise<void> {
    await supabase.from('routines').upsert({
        id: routine.id,
        user_id: userId,
        author_id: routine.authorId ?? userId,
        name: routine.name,
        description: routine.description,
        rationale: routine.rationale,
        days: routine.days,
        current_day_index: routine.currentDayIndex,
        start_date: routine.startDate,
        last_modified: routine.lastModified,
    });
}

export async function deleteRoutine(routineId: string): Promise<void> {
    await supabase.from('routines').delete().eq('id', routineId);
}

// ── WORKOUT HISTORY ────────────────────────────────────────────────────────

export async function getWorkoutHistory(userId: string): Promise<WorkoutSet[]> {
    const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
    if (error || !data) return [];
    return (data as DbWorkoutSet[]).map(workoutSetFromDb);
}

export async function addWorkoutSet(set: WorkoutSet, userId: string): Promise<void> {
    await supabase.from('workout_sets').insert({
        id: set.id,
        user_id: userId,
        exercise_id: set.exerciseId,
        weight: set.weight,
        reps: set.reps,
        duration: set.duration ?? null,
        rpe: set.rpe ?? null,
        completed_at: set.completedAt,
    });
}

export async function bulkAddWorkoutSets(sets: WorkoutSet[], userId: string): Promise<void> {
    if (sets.length === 0) return;
    await supabase.from('workout_sets').insert(
        sets.map(s => ({
            id: s.id,
            user_id: userId,
            exercise_id: s.exerciseId,
            weight: s.weight,
            reps: s.reps,
            duration: s.duration ?? null,
            rpe: s.rpe ?? null,
            completed_at: s.completedAt,
        }))
    );
}

// ── SESSION PACKAGES ───────────────────────────────────────────────────────

export async function getSessionPackage(clientId: string): Promise<SessionPackage | null> {
    const { data, error } = await supabase
        .from('session_packages')
        .select('*')
        .eq('client_id', clientId)
        .single();
    if (error || !data) return null;
    return sessionPackageFromDb(data as DbSessionPackage);
}

export async function upsertSessionPackage(pkg: Omit<SessionPackage, 'id' | 'createdAt'>): Promise<SessionPackage | null> {
    // Check if one exists
    const { data: existing } = await supabase
        .from('session_packages')
        .select('id')
        .eq('client_id', pkg.clientId)
        .single();

    const payload = {
        client_id: pkg.clientId,
        trainer_id: pkg.trainerId,
        total_sessions: pkg.totalSessions,
        sessions_used: pkg.sessionsUsed,
        sessions_remaining: pkg.sessionsRemaining,
        expiry_date: pkg.expiryDate ? new Date(pkg.expiryDate).toISOString() : null,
    };

    if (existing) {
        await supabase.from('session_packages').update(payload).eq('client_id', pkg.clientId);
    } else {
        await supabase.from('session_packages').insert(payload);
    }

    return getSessionPackage(pkg.clientId);
}

// ── SESSION LOGS ───────────────────────────────────────────────────────────

export async function getSessionLogs(clientId: string): Promise<SessionLog[]> {
    const { data, error } = await supabase
        .from('session_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('timestamp', { ascending: false });
    if (error || !data) return [];
    return (data as DbSessionLog[]).map(sessionLogFromDb);
}

export async function logSession(
    clientId: string,
    trainerId: string,
    nonce: string,
    method: 'qr_scan' | 'manual'
): Promise<{ success: boolean; error?: string }> {
    // Check nonce uniqueness
    const { data: existing } = await supabase
        .from('session_logs')
        .select('id')
        .eq('nonce', nonce)
        .single();
    if (existing) return { success: false, error: 'This QR code has already been used.' };

    // Check package
    const pkg = await getSessionPackage(clientId);
    if (!pkg) return { success: false, error: 'No session package found for this client.' };
    if (pkg.sessionsRemaining <= 0) return { success: false, error: 'No sessions remaining in this package.' };
    if (pkg.expiryDate && Date.now() > pkg.expiryDate) return { success: false, error: 'Session package has expired.' };

    // Insert log
    const { error: logError } = await supabase.from('session_logs').insert({
        client_id: clientId,
        trainer_id: trainerId,
        timestamp: Date.now(),
        verification_method: method,
        status: 'completed',
        nonce,
    });
    if (logError) return { success: false, error: 'Failed to log session.' };

    // Decrement package
    await supabase.from('session_packages').update({
        sessions_used: pkg.sessionsUsed + 1,
        sessions_remaining: pkg.sessionsRemaining - 1,
    }).eq('client_id', clientId);

    return { success: true };
}

// ── CUSTOM EXERCISES ───────────────────────────────────────────────────────

export async function getCustomExercises(trainerId: string): Promise<DbCustomExercise[]> {
    const { data, error } = await supabase
        .from('custom_exercises')
        .select('*')
        .eq('trainer_id', trainerId);
    if (error || !data) return [];
    return data as DbCustomExercise[];
}

export async function addCustomExercise(ex: {
    name: string;
    primaryAxis: string;
    trackingType: 'reps' | 'time';
    trainerId: string;
}): Promise<void> {
    await supabase.from('custom_exercises').insert({
        trainer_id: ex.trainerId,
        name: ex.name,
        primary_axis: ex.primaryAxis,
        tracking_type: ex.trackingType,
    });
}
