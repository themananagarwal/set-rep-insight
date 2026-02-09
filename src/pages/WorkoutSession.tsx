import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { predictNextSet } from "../lib/ai";
import type { WorkoutSet } from "../lib/types";
import { RestTimer } from "../components/RestTimer";
import { CheckCircle, ChevronRight, Dumbbell, Flag, Timer } from "lucide-react";
import clsx from "clsx";

export default function WorkoutSession() {
    const navigate = useNavigate();
    // -- URL PARAMS --
    const searchParams = new URLSearchParams(window.location.search);
    const exerciseIdParam = searchParams.get("exerciseId");

    const { user, history, exercises, routines, activeRoutineId, addSet } = useTrainerStore();
    const routine = routines.find(r => r.id === activeRoutineId);
    const activeDay = routine?.days[routine?.currentDayIndex || 0];

    // -- STRUCTURAL STATE --
    // Which exercise in the list are we on?
    // If param exists, find its index. Else default to 0.
    const initialIndex = exerciseIdParam && activeDay
        ? activeDay.exercises.findIndex(e => e.exerciseId === exerciseIdParam)
        : 0;

    const [exerciseIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
    // Local session history for immediate UI updates & AI context
    const [sessionSets, setSessionSets] = useState<WorkoutSet[]>([]);

    // -- INPUT STATE --
    const [inputs, setInputs] = useState({ weight: 0, reps: 0, rpe: 8 });

    // -- TIMER STATE --
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [restDuration, setRestDuration] = useState(90);
    const [timerLabel, setTimerLabel] = useState("Rest");

    // Determine active exercise data
    const plannedExercise = activeDay?.exercises[exerciseIndex];
    // Resolve ID to actual Exercise Data
    const activeExerciseId = plannedExercise?.exerciseId || (exercises[0] ? exercises[0].id : "unknown");
    const activeExerciseData = exercises.find(e => e.id === activeExerciseId);

    const activeHistory = [...history, ...sessionSets];

    // -- AI PREDICTION --
    // Re-run prediction whenever history or exercise changes
    // We wrap in useEffect to update inputs only when the exercise *changes* or we complete a set
    const prediction = predictNextSet(activeExerciseId, activeHistory, user);

    useEffect(() => {
        // Auto-fill inputs with prediction when entering a new exercise
        // or after a set is logged (handled in handleTimerComplete usually, but here for safety)
        setInputs({
            weight: prediction.suggestedWeight,
            reps: prediction.suggestedReps,
            rpe: 8
        });
    }, [activeExerciseId, sessionSets.length]); // Dependency on sessionSets ensures update after logging

    // -- HANDLERS --

    const handleLogSet = () => {
        const newSet: WorkoutSet = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            exerciseId: activeExerciseId,
            weight: Number(inputs.weight),
            reps: Number(inputs.reps),
            rpe: Number(inputs.rpe),
            completedAt: Date.now()
        };

        addSet(newSet);
        setSessionSets(prev => [...prev, newSet]);

        // Logic: Is this the last set?
        // In this UI, we let the user decide when to switch exercises using a separate button,
        // OR we can auto-suggest it. The user prompt asked for "End Set" and "End Exercise".

        // Default behavior: Standard Rest
        triggerTimer(90, "Rest");
    };

    const triggerTimer = (seconds: number, label: string) => {
        setRestDuration(seconds);
        setTimerLabel(label);
        setIsTimerOpen(true);
    };

    const handleNextExercise = () => {
        // Deprecated: Hub and Spoke model returns to active hub
        navigate("/workout/active");
    };

    const handleFinishWorkout = () => {
        // Return to Active Workout Hub
        navigate("/workout/active");
    };

    // Calculate progress for current exercise
    const currentSetCount = sessionSets.filter(s => s.exerciseId === activeExerciseId).length;
    const targetSets = plannedExercise?.targetSets || 3;

    return (
        <div className="pt-6 pb-32 space-y-6">

            {/* Header / Progress */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-sm font-bold text-primary tracking-wider uppercase mb-1">
                        {activeDay?.name || "Free Workout"}
                    </h2>
                    <h1 className="text-2xl font-bold leading-none max-w-[200px]">
                        {activeExerciseData?.name || "Unknown Exercise"}
                    </h1>
                </div>
                <button
                    onClick={handleFinishWorkout}
                    className="bg-secondary/50 p-2 rounded-full text-xs font-bold text-text-muted hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                    <Flag size={14} /> End
                </button>
            </div>

            {/* AI Coaching Card */}
            <div className="bg-surface border border-white/5 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Dumbbell size={64} />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <CheckCircle size={16} /> Target
                        </div>
                        {currentSetCount >= targetSets && (
                            <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                Target Volume Met
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{prediction.suggestedWeight}</span>
                        <span className="text-sm text-text-muted mr-3">kg</span>

                        <span className="text-4xl font-bold">{prediction.suggestedReps}</span>
                        <span className="text-sm text-text-muted">reps</span>
                    </div>
                    <p className="text-xs text-text-muted mt-3 pt-3 border-t border-white/5">
                        <span className="font-semibold text-primary">Coach:</span> {prediction.reasoning}
                    </p>
                </div>
            </div>

            {/* Input Form */}
            <div className="card space-y-5">
                <div className="grid grid-cols-2 gap-6">
                    {/* Weight Control */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider text-center block">Weight</label>
                        <div className="flex items-center justify-between bg-background rounded-xl p-1 border border-white/5">
                            <button
                                onClick={() => setInputs(s => ({ ...s, weight: Math.max(0, s.weight - 2.5) }))}
                                className="w-10 h-10 flex items-center justify-center bg-secondary hover:bg-white/10 rounded-lg text-xl"
                            >
                                -
                            </button>
                            <span className="font-bold text-xl tabular-nums">{inputs.weight}</span>
                            <button
                                onClick={() => setInputs(s => ({ ...s, weight: s.weight + 2.5 }))}
                                className="w-10 h-10 flex items-center justify-center bg-secondary hover:bg-white/10 rounded-lg text-xl"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Reps Control */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider text-center block">Reps</label>
                        <div className="flex items-center justify-between bg-background rounded-xl p-1 border border-white/5">
                            <button
                                onClick={() => setInputs(s => ({ ...s, reps: Math.max(0, s.reps - 1) }))}
                                className="w-10 h-10 flex items-center justify-center bg-secondary hover:bg-white/10 rounded-lg text-xl"
                            >
                                -
                            </button>
                            <span className="font-bold text-xl tabular-nums">{inputs.reps}</span>
                            <button
                                onClick={() => setInputs(s => ({ ...s, reps: s.reps + 1 }))}
                                className="w-10 h-10 flex items-center justify-center bg-secondary hover:bg-white/10 rounded-lg text-xl"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* RPE Selector */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block text-center">
                        Effort (RPE)
                    </label>
                    <div className="flex justify-between gap-1">
                        {[7, 8, 9, 10].map(val => (
                            <button
                                key={val}
                                onClick={() => setInputs(s => ({ ...s, rpe: val }))}
                                className={clsx(
                                    "flex-1 py-3 rounded-xl text-sm font-bold transition-all border",
                                    inputs.rpe === val
                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                        : "bg-secondary border-transparent text-text-muted hover:bg-white/5"
                                )}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Primary Action: Log Set */}
                <button
                    onClick={handleLogSet}
                    className="btn w-full py-4 text-base flex items-center justify-center gap-2"
                >
                    <Timer size={20} /> End Set & Rest (90s)
                </button>
            </div>

            {/* Session History List */}
            <div className="space-y-2">
                <h3 className="font-semibold text-text-muted text-xs uppercase tracking-wider ml-1 mb-2">History Today</h3>
                {sessionSets
                    .filter(s => s.exerciseId === activeExerciseId)
                    .map((set, i) => (
                        <div key={set.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl border border-white/5">
                            <div className="flex gap-3 items-center">
                                <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-text-muted font-mono">
                                    {i + 1}
                                </span>
                                <span className="font-bold">
                                    {set.weight}kg <span className="text-text-muted text-sm">x {set.reps}</span>
                                </span>
                            </div>
                            <div className="text-xs font-mono text-text-muted">
                                RPE {set.rpe}
                            </div>
                        </div>
                    ))}
            </div>

            {/* Explicit Navigation (Main Content) */}
            <div className="pt-4 pb-4">
                {activeDay && exerciseIndex < activeDay.exercises.length - 1 ? (
                    <button
                        onClick={handleNextExercise}
                        className="btn btn-secondary w-full py-4 flex items-center justify-center gap-2"
                    >
                        Next Exercise <ChevronRight size={16} />
                    </button>
                ) : (
                    <button
                        onClick={handleFinishWorkout}
                        className="btn bg-green-600 hover:bg-green-500 text-white w-full py-4 flex items-center justify-center gap-2"
                    >
                        <Flag size={18} /> Finish Workout
                    </button>
                )}
            </div>

            {/* Global Actions (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 w-full bg-background/80 backdrop-blur-xl border-t border-white/10 p-4 flex gap-4 z-40">
                <button
                    onClick={handleFinishWorkout}
                    className="btn btn-primary flex-1 py-3 border-none"
                >
                    <Flag size={18} className="mr-2" /> Finish Exercise
                </button>
            </div>

            {/* Timer Modal */}
            {isTimerOpen && (
                <RestTimer
                    label={timerLabel}
                    initialSeconds={restDuration}
                    onClose={() => setIsTimerOpen(false)}
                    onComplete={() => setIsTimerOpen(false)}
                />
            )}
        </div>
    );
}
