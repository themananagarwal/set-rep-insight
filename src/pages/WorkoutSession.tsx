import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { predictNextSet } from "../lib/ai";
import { getLoadCoaching, type CoachingResult } from "../lib/coaching"; // Import Coaching
import type { WorkoutSet } from "../lib/types";
import { RestTimer } from "../components/RestTimer";
import { TimePicker } from "../components/TimePicker";
import { Timer } from "lucide-react";
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
    const initialIndex = exerciseIdParam && activeDay
        ? activeDay.exercises.findIndex(e => e.exerciseId === exerciseIdParam)
        : 0;

    const [exerciseIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
    const [sessionSets, setSessionSets] = useState<WorkoutSet[]>([]);

    // -- INPUT STATE --
    // Added duration for cardio
    const [inputs, setInputs] = useState({ weight: 0, reps: 0, rpe: 8, duration: 60 });

    // -- TIMER STATE --
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [restDuration, setRestDuration] = useState(90);
    const [timerLabel, setTimerLabel] = useState("Rest");

    // -- CARDIO TIMER STATE --
    // -- CARDIO TIMER STATE --
    const [isCardioTimerRunning, setIsCardioTimerRunning] = useState(false);
    const [cardioTimeLeft, setCardioTimeLeft] = useState(0);
    // PLAN: Array of intervals. Default to 1 set of 60s.
    const [cardioPlan, setCardioPlan] = useState<{ id: string, duration: number, rest: number }[]>([
        { id: 'init', duration: 60, rest: 0 }
    ]);
    const [currentCardioSetIndex, setCurrentCardioSetIndex] = useState(0); // 0-indexed
    const [isCardioResting, setIsCardioResting] = useState(false);

    // Mode: 'structured' (Pre-planned sets) vs 'open' (Stopwatch)
    const [cardioMode, setCardioMode] = useState<'structured' | 'open'>('structured');
    const [openModeDuration, setOpenModeDuration] = useState(0); // Counts UP in open mode

    // Determine active exercise data
    const plannedExercise = activeDay?.exercises[exerciseIndex];
    const activeExerciseId = plannedExercise?.exerciseId || (exercises[0] ? exercises[0].id : "unknown");
    const activeExerciseData = exercises.find(e => e.id === activeExerciseId);
    const isCardio = activeExerciseData?.muscle === "Cardio";

    const activeHistory = [...history, ...sessionSets];

    // -- AI PREDICTION --
    const prediction = predictNextSet(activeExerciseId, activeHistory, user);

    useEffect(() => {
        setInputs({
            weight: prediction.suggestedWeight,
            reps: prediction.suggestedReps,
            rpe: 8,
            duration: 60 // Default duration for now
        });

        // Initialize Plan based on target sets
        const targetSets = plannedExercise?.targetSets || 3;
        const newPlan = Array.from({ length: targetSets }).map((_, i) => ({
            id: `set-${i}`,
            duration: 60,
            rest: 0
        }));
        setCardioPlan(newPlan);
    }, [activeExerciseId]); // Removed sessionSets.length dependency to prevent reset during workout

    // -- AUDIO HELPERS --
    // -- AUDIO HELPERS --
    const playChime = (type: "start" | "end" | "rest") => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        const playTone = (freq: number, startTime: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine"; // Softer tone
            osc.frequency.setValueAtTime(freq, startTime);

            osc.connect(gain);
            gain.connect(ctx.destination);

            // Gentle envelope
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05); // Soft attack
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Long decay

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        if (type === "start") {
            // Gentle "Ding" (High C)
            playTone(523.25, ctx.currentTime, 0.5); // C5
            playTone(1046.50, ctx.currentTime, 0.5); // C6 (Octave higher for brightness)
        } else if (type === "rest") {
            // Soft "Boop" (Low G)
            playTone(392.00, ctx.currentTime, 0.3); // G4
        } else {
            // Success / End (Ascending Major Triad)
            playTone(523.25, ctx.currentTime, 0.4); // C5
            playTone(659.25, ctx.currentTime + 0.1, 0.4); // E5
            playTone(783.99, ctx.currentTime + 0.2, 0.6); // G5
        }
    };

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(u);
    };

    // -- CARDIO TIMER EFFECT --
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isCardioTimerRunning) {
            if (cardioMode === 'open') {
                // -- OPEN MODE (Count Up) --
                // Run every 10ms for milliseconds precision
                interval = setInterval(() => {
                    setOpenModeDuration(prev => prev + 10);
                }, 10);
            } else {
                // -- STRUCTURED MODE (Count Down) --
                if (cardioTimeLeft > 0) {
                    interval = setInterval(() => {
                        setCardioTimeLeft(prev => prev - 1);
                    }, 1000);
                } else if (cardioTimeLeft === 0) {
                    // -- TIMER FINISHED --
                    if (isCardioResting) {
                        // Rest Finished -> Start Next Work Set
                        setIsCardioResting(false);
                        const nextIndex = currentCardioSetIndex + 1;
                        setCurrentCardioSetIndex(nextIndex);

                        const nextSet = cardioPlan[nextIndex];
                        if (nextSet) {
                            setCardioTimeLeft(nextSet.duration);
                            playChime("start");
                            speak(`Starting set ${nextIndex + 1}`);
                        }
                    } else {
                        // Work Interval Finished
                        handleLogSet(true, cardioPlan[currentCardioSetIndex].duration); // Log the set silently with specific duration
                        playChime("end");

                        const currentSet = cardioPlan[currentCardioSetIndex];

                        if (currentCardioSetIndex < cardioPlan.length - 1) {
                            // More sets to go
                            if (currentSet.rest > 0) {
                                // Start Rest
                                setIsCardioResting(true);
                                setCardioTimeLeft(currentSet.rest);
                                speak(`Set ${currentCardioSetIndex + 1} complete. Resting for ${currentSet.rest} seconds.`);
                                playChime("rest");
                            } else {
                                // No Rest -> Immediate Next Set
                                const nextIndex = currentCardioSetIndex + 1;
                                setCurrentCardioSetIndex(nextIndex);
                                setCardioTimeLeft(cardioPlan[nextIndex].duration);
                                speak(`Set ${currentCardioSetIndex} complete. Starting set ${nextIndex + 1}.`);
                            }
                        } else {
                            // All Sets Done
                            setIsCardioTimerRunning(false);
                            speak("Session complete. Great work.");
                        }
                    }
                }
            }
        }
        return () => clearInterval(interval);
    }, [isCardioTimerRunning, cardioTimeLeft, isCardioResting, currentCardioSetIndex, cardioPlan, cardioMode]);

    // -- HANDLERS --

    const handleStartCardioSession = () => {
        setIsCardioTimerRunning(true);
        playChime("start");

        if (cardioMode === 'open') {
            setOpenModeDuration(0);
            speak(`Starting ${activeExerciseData?.name}. Free flow mode.`);
        } else {
            setCurrentCardioSetIndex(0);
            const firstSet = cardioPlan[0];
            if (firstSet) {
                setCardioTimeLeft(firstSet.duration);
                setIsCardioResting(false);
                speak(`Starting ${activeExerciseData?.name}. Set 1 of ${cardioPlan.length}. ${firstSet.duration} seconds.`);
            }
        }
    };

    const handleStopCardioTimer = () => {
        if (cardioMode === 'open' && isCardioTimerRunning) {
            // Finish Open Mode
            setIsCardioTimerRunning(false);
            playChime("end");
            const seconds = Math.floor(openModeDuration / 1000); // Convert ms to seconds for logging
            speak(`Session complete. Total time ${formatStopwatch(openModeDuration)}.`);
            handleLogSet(false, seconds);
        } else {
            // Pause Structured Mode
            setIsCardioTimerRunning(false);
            speak("Session paused.");
        }
    };

    // -- COACHING STATE --
    const [coachingRec, setCoachingRec] = useState<CoachingResult | null>(null);

    const handleLogSet = (silent = false, specificDuration?: number) => {
        const newSet: WorkoutSet = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            exerciseId: activeExerciseId,
            weight: Number(inputs.weight),
            reps: Number(inputs.reps),
            duration: isCardio ? (specificDuration || Number(inputs.duration)) : undefined,
            rpe: Number(inputs.rpe),
            completedAt: Date.now()
        };

        addSet(newSet);
        setSessionSets(prev => [...prev, newSet]);

        if (!isCardio && !silent) {
            // Trigger Coaching
            const result = getLoadCoaching(newSet, {
                target: {
                    rpeRange: [7, 9],
                    repsRange: [8, 12]
                },
                config: { increment: 2.5 },
                // Mock user state for now
                userState: { pain: 0, soreness: 0, sleep: 7 }
            });
            setCoachingRec(result);

            triggerTimer(90, "Rest");
        }
    };

    const applyCoaching = () => {
        if (!coachingRec) return;
        setInputs(prev => ({
            ...prev,
            weight: coachingRec.nextWeight
        }));
        setCoachingRec(null);
    };

    const triggerTimer = (seconds: number, label: string) => {
        setRestDuration(seconds);
        setTimerLabel(label);
        setIsTimerOpen(true);
    };



    const handleFinishWorkout = () => {
        navigate("/workout/active");
    };


    // const currentSetCount = sessionSets.filter(s => s.exerciseId === activeExerciseId).length;
    // const targetSets = plannedExercise?.targetSets || 3;

    // Helper to format time (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Helper to format stopwatch (MM:SS.ms)
    const formatStopwatch = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        const centis = Math.floor((ms % 1000) / 10); // Display 2 digits (centiseconds)
        return {
            main: `${mins}:${secs.toString().padStart(2, '0')}`,
            sub: `.${centis.toString().padStart(2, '0')}`
        };
    };

    return (
        <div className="pt-6 pb-32 space-y-6">

            {/* Header / Progress */}
            <div className="flex justify-between items-start border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase mb-2">
                        {activeDay?.name || "Free Session"}
                    </h2>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none max-w-[250px]">
                        {activeExerciseData?.name || "Unknown"}
                    </h1>
                </div>
                <button
                    onClick={handleFinishWorkout}
                    className="text-[10px] uppercase font-bold text-red-500 tracking-widest border border-red-500/20 px-4 py-2 rounded bg-red-500/5 hover:bg-red-500/10 transition-colors"
                >
                    End
                </button>
            </div>

            {/* --- COACHING BANNER --- */}
            {coachingRec && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className={clsx(
                        "rounded-lg p-5 border border-l-4 shadow-2xl backdrop-blur-md",
                        coachingRec.recommendation === "increase" ? "bg-emerald-900/10 border-emerald-500 border-l-emerald-500" :
                            coachingRec.recommendation === "decrease" ? "bg-amber-900/10 border-amber-500 border-l-amber-500" :
                                "bg-primary/5 border-primary border-l-primary"
                    )}>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-white">
                                {coachingRec.recommendation === "increase" ? "Recommendation: Increase Load" :
                                    coachingRec.recommendation === "decrease" ? "Recommendation: Deload" :
                                        "Recommendation: Maintain"}
                            </h3>
                            <div className="text-2xl font-black text-white">
                                {coachingRec.nextWeight}<span className="text-xs text-text-muted ml-0.5 font-sans">kg</span>
                            </div>
                        </div>
                        <p className="text-xs text-text-muted font-medium mb-4 leading-relaxed opacity-80">{coachingRec.reasoning}</p>

                        <button
                            onClick={applyCoaching}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {/* Input Form */}
            <div className="space-y-8">

                {isCardio ? (
                    // --- CARDIO UI (Keep existing logic but style update) ---
                    <div className="space-y-6">
                        {isCardioTimerRunning ? (
                            <div className="text-center py-12 space-y-6 bg-surface/30 rounded-3xl border border-white/5">
                                <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                                    {cardioMode === 'open' ? "Free Flow" : (isCardioResting ? "Rest Period" : `Interval ${currentCardioSetIndex + 1}/${cardioPlan.length}`)}
                                </span>
                                <div className={clsx(
                                    "font-mono font-black tabular-nums tracking-tighter flex items-baseline justify-center",
                                    isCardioResting ? "text-text-muted text-7xl" : "text-white text-8xl"
                                )}>
                                    {cardioMode === 'open' ? (
                                        <>
                                            {formatStopwatch(openModeDuration).main}
                                            <span className="text-4xl text-white/30 ml-2 font-bold w-[80px] text-left">
                                                {formatStopwatch(openModeDuration).sub}
                                            </span>
                                        </>
                                    ) : formatTime(cardioTimeLeft)}
                                </div>
                                <button
                                    onClick={handleStopCardioTimer}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-bold uppercase tracking-widest text-red-400"
                                >
                                    {cardioMode === 'open' ? "Stop" : "Pause"}
                                </button>
                            </div>
                        ) : (
                            // Cardio Setup
                            <div className="bg-surface/30 rounded-3xl p-6 border border-white/5">
                                <div className="flex bg-black/20 p-1 rounded-lg mb-6 sticky top-0">
                                    <button onClick={() => setCardioMode('structured')} className={clsx("flex-1 py-3 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all", cardioMode === 'structured' ? "bg-primary text-white shadow" : "text-text-muted hover:text-white")}>Structured</button>
                                    <button onClick={() => setCardioMode('open')} className={clsx("flex-1 py-3 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all", cardioMode === 'open' ? "bg-primary text-white shadow" : "text-text-muted hover:text-white")}>Free Flow</button>
                                </div>

                                {cardioMode === 'structured' ? (
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Interval Configuration</h3>
                                            <button onClick={() => setCardioPlan([...cardioPlan, { id: Date.now().toString(), duration: 60, rest: 30 }])} className="text-primary text-[10px] font-bold uppercase tracking-wider hover:text-primary/80 transition-colors">+ Add Interval</button>
                                        </div>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                            {cardioPlan.map((set, index) => (
                                                <div key={set.id} className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col gap-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-xs text-white/50 uppercase tracking-wider">Interval {index + 1}</span>
                                                        {cardioPlan.length > 1 && (
                                                            <button onClick={() => setCardioPlan(cardioPlan.filter((_, i) => i !== index))} className="text-red-400 text-[10px] font-bold uppercase tracking-wider hover:text-red-300">Remove</button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <TimePicker label="Work" type="work" value={set.duration} onChange={(val) => { const newPlan = [...cardioPlan]; newPlan[index].duration = val; setCardioPlan(newPlan); }} />
                                                        <TimePicker label="Rest" type="rest" value={set.rest} onChange={(val) => { const newPlan = [...cardioPlan]; newPlan[index].rest = val; setCardioPlan(newPlan); }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 mb-6 border border-dashed border-white/10 rounded-xl">
                                        <Timer className="mx-auto text-white/20 mb-4" size={48} />
                                        <p className="text-xs text-text-muted uppercase tracking-wider">Open Ended Session</p>
                                    </div>
                                )}

                                <button onClick={handleStartCardioSession} className="w-full py-6 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.15em] text-lg rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-3">
                                    <Timer size={20} />
                                    <span>Start Session</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // --- STRENGTH UI ---
                    <>
                        {/* Set Progress Indicator */}
                        <div className="bg-surface border border-white/5 rounded-2xl p-4 mb-2 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className={clsx(
                                    "text-[10px] font-bold uppercase tracking-widest block",
                                    history.filter(h => h.exerciseId === activeExerciseId && h.completedAt > Date.now() - 1000 * 60 * 60 * 12).length >= (plannedExercise?.targetSets || 3)
                                        ? "text-emerald-500"
                                        : "text-text-muted"
                                )}>
                                    Set Progress
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className={clsx(
                                        "text-2xl font-black tabular-nums leading-none",
                                        history.filter(h => h.exerciseId === activeExerciseId && h.completedAt > Date.now() - 1000 * 60 * 60 * 12).length >= (plannedExercise?.targetSets || 3) ? "text-emerald-500" : "text-white"
                                    )}>
                                        {history.filter(h => h.exerciseId === activeExerciseId && h.completedAt > Date.now() - 1000 * 60 * 60 * 12).length}
                                    </span>
                                    <span className="text-sm font-medium text-text-muted">
                                        / {plannedExercise?.targetSets || 3}
                                    </span>
                                </div>
                            </div>

                            {/* Visual Progress Dots */}
                            <div className="flex gap-1.5">
                                {Array.from({ length: plannedExercise?.targetSets || 3 }).map((_, i) => {
                                    const currentCount = history.filter(h => h.exerciseId === activeExerciseId && h.completedAt > Date.now() - 1000 * 60 * 60 * 12).length;
                                    const isDone = i < currentCount;
                                    return (
                                        <div
                                            key={i}
                                            className={clsx(
                                                "w-3 h-8 rounded-sm transition-all duration-300",
                                                isDone ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/10"
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Weight Control */}
                            <div className="bg-surface/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Load (kg)</label>
                                <div className="flex items-center gap-6 z-10">
                                    <button onClick={() => setInputs(s => ({ ...s, weight: Math.max(0, s.weight - 2.5) }))} className="w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-primary/20 hover:text-primary rounded-full text-2xl transition-colors">-</button>
                                    <span className="text-4xl font-black tracking-tighter text-white">{inputs.weight}</span>
                                    <button onClick={() => setInputs(s => ({ ...s, weight: s.weight + 2.5 }))} className="w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-primary/20 hover:text-primary rounded-full text-2xl transition-colors">+</button>
                                </div>
                            </div>

                            {/* Reps Control */}
                            <div className="bg-surface/50 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Reps</label>
                                <div className="flex items-center gap-6 z-10">
                                    <button onClick={() => setInputs(s => ({ ...s, reps: Math.max(0, s.reps - 1) }))} className="w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-primary/20 hover:text-primary rounded-full text-2xl transition-colors">-</button>
                                    <span className="text-4xl font-black tracking-tighter text-white">{inputs.reps}</span>
                                    <button onClick={() => setInputs(s => ({ ...s, reps: s.reps + 1 }))} className="w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-primary/20 hover:text-primary rounded-full text-2xl transition-colors">+</button>
                                </div>
                            </div>
                        </div>

                        {/* RPE Selector */}
                        <div className="space-y-4">
                            <label className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] block text-center">
                                Intensity (RPE)
                            </label>
                            <div className="flex justify-between gap-2 p-1 bg-black/20 rounded-xl">
                                {[7, 8, 9, 10].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setInputs(s => ({ ...s, rpe: val }))}
                                        className={clsx(
                                            "flex-1 py-4 rounded-lg text-lg font-bold transition-all",
                                            inputs.rpe === val
                                                ? "bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105"
                                                : "text-text-muted hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Primary Action: Log Set */}
                        <button
                            onClick={() => handleLogSet()}
                            className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.15em] text-lg rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-4 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <span className="relative z-10">Log Set</span>
                        </button>
                    </>
                )}
            </div>

            {/* Session History List */}
            <div className="mt-12">
                <h3 className="font-bold text-text-muted text-[10px] uppercase tracking-[0.2em] mb-4 pl-1">Session Log</h3>
                <div className="space-y-1">
                    {sessionSets.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                            <p className="text-xs text-text-muted/50 uppercase tracking-widest">No data recorded</p>
                        </div>
                    )}
                    {sessionSets
                        .filter(s => s.exerciseId === activeExerciseId)
                        .map((set, i) => (
                            <div key={set.id} className="flex justify-between items-center p-4 bg-background border border-white/5 rounded-lg group hover:border-white/10 transition-colors">
                                <div className="flex gap-4 items-center">
                                    <span className="text-[10px] font-mono text-white/30">
                                        {(i + 1).toString().padStart(2, '0')}
                                    </span>
                                    <span className="font-bold text-white text-lg">
                                        {set.duration ? formatTime(set.duration) : `${set.weight}kg`}
                                        {!set.duration && <span className="text-text-muted text-xs ml-2 font-medium">x {set.reps}</span>}
                                    </span>
                                </div>
                                <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold uppercase tracking-wider text-text-muted group-hover:text-white transition-colors">
                                    {set.duration ? "CARDIO" : `RPE ${set.rpe}`}
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Explicit Navigation (Main Content) */}
            <div className="hidden">
                {/* Replaced by Bottom Actions */}
            </div>

            {/* Global Actions (Fixed Bottom) */}
            {!isCardioTimerRunning && (
                <div className="fixed bottom-[90px] left-0 w-full px-6 z-30 pointer-events-none">
                    <div className="max-w-md mx-auto pointer-events-auto">
                        <button
                            onClick={handleFinishWorkout}
                            className="w-full py-4 border border-white/10 bg-surface/80 backdrop-blur-md hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] text-text-muted hover:text-white transition-colors shadow-lg"
                        >
                            Finish Exercise
                        </button>
                    </div>
                </div>
            )}

            {/* Timer Modal (Rest Timer) */}
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
