import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { Dumbbell, Check, ArrowLeft, Flag } from "lucide-react";
import clsx from "clsx";

export default function ActiveWorkout() {
    const navigate = useNavigate();
    const { history, routines, activeRoutineId, completeActiveRoutineDay } = useTrainerStore();
    const routine = routines.find(r => r.id === activeRoutineId);

    if (!routine) {
        return (
            <div className="p-6 text-center pt-20">
                <h2 className="text-xl font-bold">No Active Workout</h2>
                <button onClick={() => navigate("/")} className="btn btn-secondary mt-4">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const activeDay = routine.days[routine.currentDayIndex];

    const handleEndWorkout = () => {
        if (confirm("Are you sure you want to end this workout?")) {
            completeActiveRoutineDay();
            navigate("/");
        }
    };

    return (
        <div className="min-h-screen pb-24 space-y-6 pt-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate("/")}
                    className="p-2 bg-secondary rounded-full text-text-muted hover:text-primary"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold">{activeDay.name}</h1>
                    <p className="text-xs text-text-muted">{routine.name}</p>
                </div>
                <button
                    onClick={handleEndWorkout}
                    className="p-2 bg-red-500/10 rounded-full text-red-500 hover:bg-red-500/20"
                >
                    <Flag size={20} />
                </button>
            </div>

            {/* Progress Header */}
            <div className="bg-primary/10 text-primary px-4 py-3 rounded-xl flex items-center justify-between">
                <span className="font-bold text-sm">Workout in Progress</span>
                <span className="text-xs uppercase tracking-wider font-bold">
                    Day {routine.currentDayIndex + 1} / {routine.days.length}
                </span>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
                {activeDay.exercises.map((ex, i) => {
                    // Calculate completion status based on today's history
                    // We need to look at history items that are *after* the routine started or just "today"
                    const recentSets = history.filter(h =>
                        h.exerciseId === ex.exerciseId &&
                        h.completedAt > Date.now() - 1000 * 60 * 60 * 12 // Last 12h
                    );
                    const setsDone = recentSets.length;
                    const isComplete = setsDone >= ex.targetSets;
                    const displayName = ex.exerciseId.replace(/_/g, " ");

                    return (
                        <button
                            key={i}
                            onClick={() => navigate(`/workout/session?exerciseId=${ex.exerciseId}`)}
                            className={clsx(
                                "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between",
                                isComplete
                                    ? "bg-green-500/10 border-green-500/20"
                                    : "bg-surface border-white/5 hover:border-primary/50"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                    isComplete ? "bg-green-500 text-white" : "bg-secondary text-text-muted"
                                )}>
                                    {isComplete ? <Check size={20} /> : <Dumbbell size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold capitalize">{displayName}</h3>
                                    <p className="text-xs text-text-muted">
                                        {setsDone} / {ex.targetSets} Sets Completed
                                    </p>
                                </div>
                            </div>
                            <div className={clsx(
                                "px-3 py-1 rounded-full text-xs font-bold",
                                isComplete ? "text-green-500" : "bg-primary text-white"
                            )}>
                                {isComplete ? "Done" : "Start"}
                            </div>
                        </button>
                    );
                })}
                {activeDay.exercises.length === 0 && (
                    <div className="p-8 text-center bg-surface rounded-2xl border border-dashed border-white/10 text-text-muted">
                        No exercises for today. Enjoy your rest!
                    </div>
                )}
            </div>

            {/* Floating End Workout Button (Optional, redundant with top right but good for UX) */}
            <div className="fixed bottom-24 left-0 w-full px-6 pointer-events-none">
                <button
                    onClick={handleEndWorkout}
                    className="w-full bg-surface border border-red-500/20 text-red-400 font-bold py-4 rounded-2xl shadow-lg pointer-events-auto hover:bg-red-500/10"
                >
                    Finish Workout
                </button>
            </div>
        </div>
    );
}
