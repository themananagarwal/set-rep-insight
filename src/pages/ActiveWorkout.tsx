import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { Activity, CheckCircle, ChevronRight, StopCircle, Plus, Dumbbell, Zap, X } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import ExercisePicker from "../components/ExercisePicker";
import { useAuth } from "../contexts/AuthContext";
import { useMockBackendStore } from "../lib/mockBackend";
import { QRScanner } from "../components/QRScanner";

export default function ActiveWorkout() {
    const navigate = useNavigate();
    const { 
        history, 
        routines, 
        activeRoutineId, 
        completeActiveRoutineDay, 
        onTheGoSession, 
        startOnTheGo, 
        endOnTheGo,
        addExerciseToOnTheGo,
        exercises 
    } = useTrainerStore();

    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [showOTGInfo, setShowOTGInfo] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const { user: authUser } = useAuth();
    const getSessionPackage = useMockBackendStore(s => s.getSessionPackage);
    const pkg = authUser ? getSessionPackage(authUser.id) : null;
    const isPTClient = !!pkg && pkg.sessionsRemaining > 0;

    // decide if we should show info
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const isIntro = searchParams.get("intro") === "true";
        
        if (!!onTheGoSession && isIntro) {
            const hidden = localStorage.getItem("pt_hide_otg_info") === "true";
            if (!hidden) setShowOTGInfo(true);
            
            // Clean up the URL so it doesn't show again on manual refresh
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [onTheGoSession]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCloseInfo = () => {
        if (dontShowAgain) {
            localStorage.setItem("pt_hide_otg_info", "true");
        }
        setShowOTGInfo(false);
    };

    const routine = routines.find(r => r.id === activeRoutineId);
    const activeDay = routine?.days[routine?.currentDayIndex || 0];

    // Decide if we are in On-The-Go or Routine mode
    const isOnTheGo = !!onTheGoSession;
    const currentExercises = isOnTheGo ? onTheGoSession!.exercises : (activeDay?.exercises || []);

    if (!routine && !isOnTheGo) {
        return (
            <div className="min-h-screen px-6 pt-20 text-center space-y-8 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <Activity size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Ready for a session?</h2>
                    <p className="text-text-muted text-sm max-w-[240px] mx-auto">
                        Start an unstructured workout or follow a predefined plan.
                    </p>
                </div>
                
                <div className="grid gap-3 pt-4">
                    <button 
                        onClick={() => {
                            startOnTheGo();
                        }}
                        className="w-full py-4 bg-white text-black font-bold rounded-2xl transition-all active:scale-95 shadow-xl shadow-white/5"
                    >
                        Start "On The Go"
                    </button>
                    <button 
                        onClick={() => navigate("/")} 
                        className="w-full py-4 bg-surface border border-white/5 rounded-2xl text-text-muted font-bold transition-all active:scale-95"
                    >
                        Pick a Plan
                    </button>
                </div>
            </div>
        );
    }

    const handleEndWorkout = () => {
        setShowFinishModal(true);
    };

    const confirmFinish = () => {
        setShowFinishModal(false);
        if (isPTClient) {
            setShowScannerModal(true);
            return;
        }
        completeWorkout();
    };

    const completeWorkout = () => {
        if (isOnTheGo) {
            endOnTheGo();
        } else {
            completeActiveRoutineDay();
        }
        navigate("/");
    };

    const handleAddExercise = (exerciseId: string) => {
        addExerciseToOnTheGo(exerciseId);
        setPickerOpen(false);
    };

    // Calculate overall progress (only for routines)
    const totalExercises = currentExercises.length;
    const completedExercises = currentExercises.filter(ex => {
        const sets = history.filter(h =>
            h.exerciseId === ex.exerciseId &&
            h.completedAt > (isOnTheGo ? onTheGoSession!.startTime : Date.now() - 1000 * 60 * 60 * 12)
        );
        return sets.length >= ex.targetSets;
    }).length;
    const progressPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

    return (
        <div className="min-h-screen pb-40 pt-6 relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header / Status Bar */}
            <div className="flex items-center justify-between px-1">
                <div className="flex-1 min-w-0">
                    <h2 className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
                        {isOnTheGo ? (
                            <><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> On The Go Mode</>
                        ) : (
                            <>{format(new Date(), "EEEE, MMM d")}</>
                        )}
                    </h2>
                    <h1 className="text-2xl font-black tracking-tight text-white truncate">
                        {isOnTheGo ? "Live Session" : activeDay!.name}
                    </h1>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">
                        Live
                    </span>
                </div>
            </div>

            {/* Progress Bar (Show for both, but different meaning for OTG) */}
            <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em]">
                        {isOnTheGo ? "Session Intensity" : "Workout Progress"}
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">
                        {progressPercentage}%
                    </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-4">
                {currentExercises.map((ex, i) => {
                    const exerciseData = exercises.find(e => e.id === ex.exerciseId);
                    const recentSets = history.filter(h =>
                        h.exerciseId === ex.exerciseId &&
                        h.completedAt > (isOnTheGo ? onTheGoSession!.startTime : Date.now() - 1000 * 60 * 60 * 12)
                    );
                    const setsDone = recentSets.length;
                    const isComplete = setsDone >= ex.targetSets;
                    const isActive = setsDone > 0 && !isComplete;

                    return (
                        <div
                            key={`${ex.exerciseId}-${i}`}
                            onClick={() => navigate(`/workout/session?exerciseId=${ex.exerciseId}`)}
                            className={clsx(
                                "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer active:scale-[0.98]",
                                isComplete
                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                    : isActive
                                        ? "bg-surface border-primary/40 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                                        : "bg-surface border-white/5 hover:border-white/10"
                            )}
                        >
                            <div className="p-5 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        isComplete
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : isActive
                                                ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                                                : "bg-white/5 text-text-muted"
                                    )}>
                                        {isComplete ? <CheckCircle size={20} /> : isActive ? <Activity size={20} /> : <span className="text-xs font-bold">{i + 1}</span>}
                                    </div>

                                    <div>
                                        <h3 className={clsx(
                                            "font-bold text-base mb-0.5",
                                            isComplete ? "text-text-muted line-through" : "text-white"
                                        )}>
                                            {exerciseData?.name || ex.exerciseId}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className={clsx(
                                                "text-[10px] font-bold tracking-widest uppercase",
                                                isComplete ? "text-emerald-500" : "text-text-muted"
                                            )}>
                                                {setsDone} {setsDone === 1 ? 'Set' : 'Sets'} Logged
                                            </span>
                                            {isActive && (
                                                <span className="text-primary flex items-center gap-1.5 animate-pulse">
                                                    <div className="w-1 h-1 rounded-full bg-current" />
                                                    <span className="text-[10px] font-bold tracking-widest uppercase">In Progress</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-text-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    );
                })}

                {/* Add Exercise Button for On-The-Go */}
                {isOnTheGo && (
                    <button
                        onClick={() => setPickerOpen(true)}
                        className="w-full py-6 border-2 border-dashed border-white/5 rounded-2xl text-text-muted hover:border-primary/30 hover:text-primary transition-all flex flex-col items-center justify-center gap-3 bg-white/2"
                    >
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">Add Exercise</span>
                    </button>
                )}

                {!isOnTheGo && activeDay?.exercises.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-50">
                        <Dumbbell className="mx-auto mb-4 text-text-muted" size={40} />
                        <p className="text-sm font-bold uppercase tracking-widest text-text-muted">Rest Day</p>
                    </div>
                )}
            </div>

            {/* Finish Session Button */}
            <div className="fixed bottom-[100px] left-0 w-full px-6 z-40 pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto">
                    <button
                        onClick={handleEndWorkout}
                        className="w-full py-4.5 bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/5 rounded-2xl text-red-400 font-bold tracking-widest text-xs uppercase transition-all shadow-2xl flex items-center justify-center gap-3 group active:scale-[0.98]"
                    >
                        <StopCircle size={18} className="group-hover:scale-110 transition-transform" />
                        Finish Session
                    </button>
                </div>
            </div>

            {/* Finish Modal */}
            {showFinishModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl space-y-8">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                                <StopCircle size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white">Full Focus?</h3>
                                {isOnTheGo ? (
                                    <p className="text-sm text-text-muted leading-relaxed">
                                        This will save all logged exercises to your history.
                                    </p>
                                ) : (
                                    <p className="text-sm text-text-muted leading-relaxed">
                                        Completing the session will mark today's goal as achieved.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <button
                                onClick={confirmFinish}
                                className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest shadow-xl shadow-white/5 transition-all active:scale-95"
                            >
                                Finish Workout
                            </button>
                            <button
                                onClick={() => setShowFinishModal(false)}
                                className="w-full py-4 rounded-2xl text-text-muted font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Resume
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* OTG Info Modal */}
            {showOTGInfo && (
                <div className="fixed inset-0 bg-[#0B0D10]/95 backdrop-blur-2xl z-[150] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-[#111318] border border-white/10 p-10 rounded-[3rem] w-full max-w-sm shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative space-y-10 overflow-hidden">
                        {/* Decorative Background Element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        
                        <button 
                            onClick={handleCloseInfo}
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={20} className="text-text-muted" />
                        </button>

                        <div className="text-center space-y-6 relative z-10">
                            <div className="w-20 h-20 bg-primary/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-[0_20px_40px_rgba(99,102,241,0.3)] animate-bounce-slow">
                                <Zap size={36} fill="currentColor" />
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-white tracking-tight leading-tight">
                                    Freedom to <br/><span className="text-primary">Train</span>
                                </h3>
                                <p className="text-sm text-text-muted leading-relaxed font-medium">
                                    In "On The Go" mode, you're the architect. Add any exercise, log your sets, and build your session as you move.
                                </p>
                            </div>

                            <div className="grid gap-4 pt-4">
                                <div className="flex gap-3 text-left">
                                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0 border border-white/5">
                                        <Plus size={16} className="text-primary" />
                                    </div>
                                    <p className="text-[11px] text-text-secondary leading-tight mt-1">
                                        Hit the plus button to add movements to your live list.
                                    </p>
                                </div>
                                <div className="flex gap-3 text-left">
                                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0 border border-white/5">
                                        <Activity size={16} className="text-emerald-500" />
                                    </div>
                                    <p className="text-[11px] text-text-secondary leading-tight mt-1">
                                        Log weights and reps just like your planned routines.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 relative z-10">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only"
                                        checked={dontShowAgain}
                                        onChange={(e) => setDontShowAgain(e.target.checked)}
                                    />
                                    <div className={clsx(
                                        "w-5 h-5 rounded border transition-all duration-300",
                                        dontShowAgain ? "bg-primary border-primary" : "border-white/20 bg-white/5 group-hover:border-white/40"
                                    )}>
                                        {dontShowAgain && <CheckCircle size={14} className="text-white m-0.5" />}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest group-hover:text-white transition-colors">
                                    Got it, don't show again
                                </span>
                            </label>

                            <button
                                onClick={handleCloseInfo}
                                className="w-full py-4.5 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-white/5 transition-all active:scale-95"
                            >
                                Let's Lift
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Exercise Picker Overlay */}
            {pickerOpen && (
                <div className="fixed inset-0 z-[110] bg-background">
                    <ExercisePicker 
                        onSelect={handleAddExercise} 
                        onBack={() => setPickerOpen(false)} 
                    />
                </div>
            )}

            {/* QR Scanner Modal for PT Clients */}
            {showScannerModal && authUser && (
                <QRScanner 
                    clientId={authUser.id} 
                    onClose={() => setShowScannerModal(false)} 
                    onSuccess={() => {
                        // After successful scan, complete the workout
                        setShowScannerModal(false);
                        completeWorkout();
                    }}
                />
            )}
        </div>
    );
}
