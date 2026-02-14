import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { predictNextSet } from "../lib/ai";
import type { WorkoutSet } from "../lib/types";
import { RestTimer } from "../components/RestTimer";
import { TimeInput } from "../components/TimeInput";
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
            triggerTimer(90, "Rest");
        }
    };

    const triggerTimer = (seconds: number, label: string) => {
        setRestDuration(seconds);
        setTimerLabel(label);
        setIsTimerOpen(true);
    };

    const handleNextExercise = () => {
        navigate("/workout/active");
    };

    const handleFinishWorkout = () => {
        navigate("/workout/active");
    };

    const currentSetCount = sessionSets.filter(s => s.exerciseId === activeExerciseId).length;
    const targetSets = plannedExercise?.targetSets || 3;

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

            {/* AI Coaching Card - Simplified for Cardio */}
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

                    {!isCardio ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">{prediction.suggestedWeight}</span>
                            <span className="text-sm text-text-muted mr-3">kg</span>

                            <span className="text-4xl font-bold">{prediction.suggestedReps}</span>
                            <span className="text-sm text-text-muted">reps</span>
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">Duration</span>
                        </div>
                    )}

                    <p className="text-xs text-text-muted mt-3 pt-3 border-t border-white/5">
                        <span className="font-semibold text-primary">Coach:</span> {isCardio ? "Maintain a steady pace." : prediction.reasoning}
                    </p>
                </div>
            </div>

            {/* Input Form */}
            <div className="card space-y-5">

                {isCardio ? (
                    // --- CARDIO UI ---
                    <div className="space-y-6">
                        {isCardioTimerRunning ? (
                            <div className="text-center py-8 space-y-4">
                                <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                                    {cardioMode === 'open'
                                        ? "Free Mode"
                                        : (isCardioResting ? "Resting" : `Set ${currentCardioSetIndex + 1} / ${cardioPlan.length}`)
                                    }
                                </span>
                                <div className={clsx(
                                    "font-mono font-bold animate-pulse flex items-baseline justify-center",
                                    isCardioResting ? "text-text-muted text-6xl" : "text-primary text-7xl tracking-tighter" // Bigger for sporty feel
                                )}>
                                    {cardioMode === 'open' ? (
                                        <>
                                            {formatStopwatch(openModeDuration).main}
                                            <span className="text-4xl text-primary/70 ml-1 font-medium w-[70px] text-left">
                                                {formatStopwatch(openModeDuration).sub}
                                            </span>
                                        </>
                                    ) : (
                                        formatTime(cardioTimeLeft)
                                    )}
                                </div>
                                <p className="text-text-muted text-sm uppercase tracking-widest mt-1">
                                    {cardioMode === 'open'
                                        ? "Stopwatch"
                                        : (isCardioResting ? "Next set starts in..." : "Remaining")
                                    }
                                </p>
                                <button
                                    onClick={handleStopCardioTimer}
                                    className={clsx(
                                        "btn w-full",
                                        cardioMode === 'open' ? "bg-green-600 hover:bg-green-500 text-white" : "bg-red-500/10 text-red-500"
                                    )}
                                >
                                    {cardioMode === 'open' ? "Finish & Log" : "Pause / Stop"}
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Mode Selection */}
                                <div className="flex bg-secondary p-1 rounded-xl mb-4">
                                    <button
                                        onClick={() => setCardioMode('structured')}
                                        className={clsx(
                                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                            cardioMode === 'structured' ? "bg-primary text-white shadow" : "text-text-muted hover:text-white"
                                        )}
                                    >
                                        Structured Plan
                                    </button>
                                    <button
                                        onClick={() => setCardioMode('open')}
                                        className={clsx(
                                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                            cardioMode === 'open' ? "bg-primary text-white shadow" : "text-text-muted hover:text-white"
                                        )}
                                    >
                                        Free Flow
                                    </button>
                                </div>

                                {cardioMode === 'structured' ? (
                                    <>
                                        {/* Plan Configuration Table */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Planned Sets</h3>
                                                <button
                                                    onClick={() => setCardioPlan([...cardioPlan, { id: Date.now().toString(), duration: 60, rest: 30 }])}
                                                    className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                                                >
                                                    + Add Set
                                                </button>
                                            </div>

                                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                {cardioPlan.map((set, index) => (
                                                    <div key={set.id} className="bg-background border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold text-sm text-primary">Set {index + 1}</span>
                                                            {cardioPlan.length > 1 && (
                                                                <button
                                                                    onClick={() => setCardioPlan(cardioPlan.filter((_, i) => i !== index))}
                                                                    className="text-red-400 text-xs hover:bg-white/5 p-1 rounded"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            {/* Duration Input */}
                                                            <div>
                                                                <TimeInput
                                                                    label="Duration"
                                                                    value={set.duration}
                                                                    onChange={(val) => {
                                                                        const newPlan = [...cardioPlan];
                                                                        newPlan[index].duration = val;
                                                                        setCardioPlan(newPlan);
                                                                    }}
                                                                />
                                                            </div>

                                                            {/* Rest Input */}
                                                            <div>
                                                                <TimeInput
                                                                    label="Rest"
                                                                    value={set.rest}
                                                                    onChange={(val) => {
                                                                        const newPlan = [...cardioPlan];
                                                                        newPlan[index].rest = val;
                                                                        setCardioPlan(newPlan);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleStartCardioSession}
                                            className="btn w-full py-6 text-xl flex items-center justify-center gap-2 bg-primary text-white shadow-xl shadow-primary/20 mt-4"
                                        >
                                            <Timer size={24} /> Start Routine ({cardioPlan.length} Sets)
                                        </button>
                                    </>
                                ) : (
                                    // -- FREE FLOW UI --
                                    <div className="text-center py-10 space-y-6">
                                        <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto text-primary">
                                            <Timer size={48} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">Free Flow Mode</h3>
                                            <p className="text-sm text-text-muted max-w-xs mx-auto">
                                                Start the timer and go as long as you want. Click "Finish" when you're done to log your time.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleStartCardioSession}
                                            className="btn w-full py-6 text-xl flex items-center justify-center gap-2 bg-primary text-white shadow-xl shadow-primary/20"
                                        >
                                            <Timer size={24} /> Start Stopwatch
                                        </button>
                                    </div>
                                )}
                                <div className="text-center mt-4">
                                    <p className="text-xs text-text-muted">Voice guidance enabled.</p>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    // --- STRENGTH UI ---
                    <>
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
                            onClick={() => handleLogSet()}
                            className="btn w-full py-4 text-base flex items-center justify-center gap-2"
                        >
                            <Timer size={20} /> End Set & Rest (90s)
                        </button>
                    </>
                )}
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
                                    {set.duration ? (
                                        <span>{formatTime(set.duration)}</span>
                                    ) : (
                                        <span>{set.weight}kg <span className="text-text-muted text-sm">x {set.reps}</span></span>
                                    )}
                                </span>
                            </div>
                            <div className="text-xs font-mono text-text-muted">
                                {set.duration ? "Cardio" : `RPE ${set.rpe}`}
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

            {/* Global Actions (Fixed Bottom) - Hide during active cardio to prevent accidental exit */}
            {!isCardioTimerRunning && (
                <div className="fixed bottom-0 left-0 w-full bg-background/80 backdrop-blur-xl border-t border-white/10 p-4 flex gap-4 z-40">
                    <button
                        onClick={handleFinishWorkout}
                        className="btn btn-primary flex-1 py-3 border-none"
                    >
                        <Flag size={18} className="mr-2" /> Finish Exercise
                    </button>
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
