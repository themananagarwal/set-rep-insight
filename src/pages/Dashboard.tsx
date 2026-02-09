import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { Play, TrendingUp, Calendar, AlertCircle, Check, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import clsx from "clsx";

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, history, routines, activeRoutineId } = useTrainerStore();
    const routine = routines.find(r => r.id === activeRoutineId);

    const lastWorkout = history.length > 0 ? history[history.length - 1] : null;

    // Simple "Imbalance" Logic (Placeholder for advanced AI)
    // Check if Legs are neglected
    const legVolume = history.filter(h => ["sq", "dl"].includes(h.exerciseId)).length;
    const pushVolume = history.filter(h => ["bp", "ohp"].includes(h.exerciseId)).length;

    let insight = "Keep going! Consistency is key.";
    if (history.length > 5) {
        if (legVolume < pushVolume * 0.5) {
            insight = "Your leg volume is low compared to push. Suggestion: Squats today?";
        }
    }

    return (
        <div className="space-y-6 pt-6 pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Hello, {user?.name}</h1>
                    <p className="text-text-muted text-sm">Ready to crush it?</p>
                </div>
                <div className="bg-surface p-2 rounded-full border border-secondary">
                    {/* Avatar Placeholder */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500" />
                </div>
            </header>

            {/* Active Plan / Workout Hub */}
            {routine ? (
                <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-primary/25 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

                    <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold mb-1">Up Next: {routine.days[routine.currentDayIndex].name}</h2>
                                    <p className="text-blue-100 text-xs mb-4">
                                        Day {routine.currentDayIndex + 1} of {routine.days.length} • {routine.name}
                                    </p>
                                </div>
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Calendar size={20} className="text-white" />
                                </div>
                            </div>

                            {/* Preview Exercises */}
                            <div className="space-y-1 mb-4">
                                {routine.days[routine.currentDayIndex].exercises.slice(0, 3).map((ex, i) => {
                                    if (!ex || !ex.exerciseId) return null;
                                    return (
                                        <div key={i} className="text-xs text-blue-50 flex items-center gap-2">
                                            <div className="w-1 h-1 bg-blue-200 rounded-full" />
                                            <span className="capitalize">{ex.exerciseId.replace(/_/g, ' ')}</span>
                                            <span className="opacity-60">({ex.targetSets} x {ex.targetReps})</span>
                                        </div>
                                    );
                                })}
                                {routine.days[routine.currentDayIndex].exercises.length > 3 && (
                                    <div className="text-xs text-blue-200 pl-3">+ {routine.days[routine.currentDayIndex].exercises.length - 3} more</div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/workout/active")}
                            className="bg-white text-primary font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform w-full"
                        >
                            <Play fill="currentColor" size={18} /> Start Session
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-secondary p-6 rounded-3xl border border-white/5 text-center space-y-4">
                    <h2 className="text-xl font-bold text-text-muted">No Active Plan</h2>
                    <p className="text-xs text-text-muted">Generate a custom plan to get started.</p>
                    <button
                        onClick={() => navigate("/workout/builder/new")}
                        className="btn w-full"
                    >
                        Create Plan
                    </button>
                </div>
            )}

            {/* AI Insight */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-start">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                    <h4 className="font-semibold text-amber-500 text-sm">Coach Insight</h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {insight}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <h3 className="font-semibold text-lg">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="card flex flex-col gap-2">
                    <TrendingUp className="text-green-500" size={24} />
                    <div>
                        <span className="text-2xl font-bold">{history.length}</span>
                        <p className="text-xs text-text-muted">Total Sets</p>
                    </div>
                </div>
                <div className="card flex flex-col gap-2">
                    <Calendar className="text-blue-500" size={24} />
                    <div>
                        <span className="text-2xl font-bold">
                            {lastWorkout ? format(new Date(lastWorkout.completedAt), "MMM d") : "-"}
                        </span>
                        <p className="text-xs text-text-muted">Last Activity</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
