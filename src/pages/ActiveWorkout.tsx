import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { Activity, CheckCircle, ChevronRight, StopCircle, Calendar } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";

export default function ActiveWorkout() {
    const navigate = useNavigate();
    const { history, routines, activeRoutineId, completeActiveRoutineDay } = useTrainerStore();
    const routine = routines.find(r => r.id === activeRoutineId);

    if (!routine) {
        return (
            <div className="p-6 text-center pt-20">
                <h2 className="text-xl font-medium tracking-tight mb-4 text-white">No Active Session</h2>
                <button onClick={() => navigate("/")} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium transition-colors text-white">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const activeDay = routine.days[routine.currentDayIndex];
    const [showFinishModal, setShowFinishModal] = useState(false);

    const handleEndWorkout = () => {
        setShowFinishModal(true);
    };

    const confirmFinish = () => {
        completeActiveRoutineDay();
        navigate("/");
    };

    // Calculate overall progress
    const totalExercises = activeDay.exercises.length;
    const completedExercises = activeDay.exercises.filter(ex => {
        const sets = history.filter(h =>
            h.exerciseId === ex.exerciseId &&
            h.completedAt > Date.now() - 1000 * 60 * 60 * 12
        );
        return sets.length >= ex.targetSets;
    }).length;
    const progressPercentage = Math.round((completedExercises / totalExercises) * 100);

    return (
        <div className="min-h-screen pb-40 pt-6 relative space-y-8">
            {/* Header / Status Bar */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-sm font-medium text-text-muted tracking-wide uppercase mb-1">
                        {format(new Date(), "EEEE, MMMM d")}
                    </h2>
                    <h1 className="text-3xl font-semibold tracking-tight text-white">
                        {activeDay.name}
                    </h1>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-medium text-emerald-500 tracking-wide">
                        Active
                    </span>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                        Session Check
                    </span>
                    <span className="text-sm font-medium text-primary">
                        {progressPercentage}%
                    </span>
                </div>
                <div className="h-1 bg-surface-highlight rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-4">
                {activeDay.exercises.map((ex, i) => {
                    // Status Check
                    const recentSets = history.filter(h =>
                        h.exerciseId === ex.exerciseId &&
                        h.completedAt > Date.now() - 1000 * 60 * 60 * 12
                    );
                    const setsDone = recentSets.length;
                    const isComplete = setsDone >= ex.targetSets;
                    const isActive = setsDone > 0 && !isComplete;

                    const displayName = ex.exerciseId.replace(/_/g, " ");

                    return (
                        <div
                            key={i}
                            onClick={() => navigate(`/workout/session?exerciseId=${ex.exerciseId}`)}
                            className={clsx(
                                "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer",
                                isComplete
                                    ? "bg-surface/30 border-emerald-500/20"
                                    : isActive
                                        ? "bg-surface border-primary/50 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                                        : "bg-surface border-white/5 hover:border-white/10"
                            )}
                        >
                            <div className="p-5 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    {/* Status Icon */}
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all",
                                        isComplete
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : isActive
                                                ? "bg-primary/10 text-primary"
                                                : "bg-white/5 text-text-muted"
                                    )}>
                                        {isComplete ? <CheckCircle size={18} /> : isActive ? <Activity size={18} /> : <span className="text-sm">{i + 1}</span>}
                                    </div>

                                    <div>
                                        <h3 className={clsx(
                                            "font-semibold text-base mb-1 capitalize",
                                            isComplete ? "text-text-muted line-through" : "text-white"
                                        )}>
                                            {displayName}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs font-medium text-text-muted">
                                            <span className={clsx(
                                                isComplete ? "text-emerald-500" : ""
                                            )}>
                                                {setsDone} / {ex.targetSets} Sets
                                            </span>
                                            {isActive && <span className="text-primary flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-current" /> In Progress</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className={clsx(
                                    "transform transition-transform duration-300 text-text-muted group-hover:text-white",
                                    isActive ? "translate-x-0" : "translate-x-2 opacity-50 group-hover:translate-x-0 group-hover:opacity-100"
                                )}>
                                    <ChevronRight size={20} />
                                </div>
                            </div>

                            {/* Active Progress Bar at bottom of card */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300" style={{ width: `${(setsDone / ex.targetSets) * 100}%` }} />
                            )}
                        </div>
                    );
                })}

                {activeDay.exercises.length === 0 && (
                    <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl">
                        <Calendar className="mx-auto text-white/10 mb-4" size={32} />
                        <p className="text-sm text-text-muted font-medium">Rest Day</p>
                    </div>
                )}
            </div>

            {/* Global Actions (Fixed Bottom - Above Nav) */}
            {/* Nav bar is typically ~80px. We place this above it. */}
            <div className="fixed bottom-[90px] left-0 w-full px-6 z-30 pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto">
                    <button
                        onClick={handleEndWorkout}
                        className="w-full py-4 bg-[#1A1D24] border border-white/5 hover:bg-[#20232A] rounded-2xl text-red-400 font-medium transition-all shadow-lg backdrop-blur-md flex items-center justify-center gap-2 group"
                    >
                        <StopCircle size={18} />
                        <span>End Session</span>
                    </button>
                    <p className="text-[10px] text-center text-text-muted/40 mt-3 uppercase tracking-widest font-medium">
                        Personal Trainer OS
                    </p>
                </div>
            </div>

            {/* Elegant Confirmation Modal */}
            {showFinishModal && (
                <div className="fixed inset-0 bg-[#0B0D10]/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-[#111318] border border-white/5 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white mb-2">
                                <StopCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    End Session?
                                </h3>
                                <p className="text-sm text-text-muted leading-relaxed">
                                    Focus is key. Are you sure you're done?
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={confirmFinish}
                                    className="w-full py-3.5 rounded-xl font-medium bg-white text-black hover:bg-white/90 transition-colors"
                                >
                                    End Session
                                </button>
                                <button
                                    onClick={() => setShowFinishModal(false)}
                                    className="w-full py-3.5 rounded-xl font-medium text-text-muted hover:text-white transition-colors"
                                >
                                    Resume
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
