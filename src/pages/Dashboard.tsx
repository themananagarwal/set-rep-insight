import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { Play, TrendingUp, AlertCircle, Calendar, Activity, Zap, Layers } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, history, routines, activeRoutineId } = useTrainerStore();
    const routine = routines.find(r => r.id === activeRoutineId);

    const lastWorkout = history.length > 0 ? history[history.length - 1] : null;

    // Simple "Imbalance" Logic (Placeholder for advanced AI)
    const legVolume = history.filter(h => ["sq", "dl"].includes(h.exerciseId)).length;
    const pushVolume = history.filter(h => ["bp", "ohp"].includes(h.exerciseId)).length;

    let insight = "Consistency is key. Keep maintaining your streak.";
    if (history.length > 5) {
        if (legVolume < pushVolume * 0.5) {
            insight = "Leg volume is trailing. Recommendation: Prioritize squats in your next session.";
        }
    }

    // Quick Stats Calculation
    const totalSets = history.length;
    const totalVolume = history.reduce((acc, curr) => acc + (curr.weight || 0) * (curr.reps || 0), 0);

    return (
        <div className="space-y-8 pt-6 pb-32">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-xs font-medium text-text-muted tracking-wide uppercase mb-1">
                        Overview
                    </h2>
                    <h1 className="text-3xl font-semibold tracking-tight text-white">
                        Welcome, {user?.name}
                    </h1>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-medium text-emerald-500 tracking-wide">
                        Online
                    </span>
                </div>
            </div>

            {/* Active Protocol Card */}
            {routine ? (
                <div className="group relative overflow-hidden rounded-2xl bg-surface border border-white/5 p-1 transition-all hover:border-white/10">
                    <div className="relative z-10 bg-surface-highlight/10 backdrop-blur-sm p-6 rounded-xl space-y-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-primary/10 text-primary mb-2">
                                    Up Next
                                </span>
                                <h2 className="text-2xl font-semibold text-white tracking-tight">
                                    {routine.days[routine.currentDayIndex].name}
                                </h2>
                                <p className="text-xs text-text-muted font-medium tracking-wide">
                                    Phase {routine.currentDayIndex + 1} of {routine.days.length} • {routine.name}
                                </p>
                            </div>
                            <Calendar size={24} className="text-white/20" />
                        </div>

                        {/* Preview List */}
                        <div className="space-y-3 border-l-2 border-white/5 pl-4 py-1">
                            {routine.days[routine.currentDayIndex].exercises.slice(0, 3).map((ex, i) => {
                                if (!ex || !ex.exerciseId) return null;
                                return (
                                    <div key={i} className="flex items-center gap-3 text-sm text-text-muted">
                                        <div className="w-1 h-1 bg-primary rounded-full" />
                                        <span className="font-medium text-white/80 flex-1 capitalize">{ex.exerciseId.replace(/_/g, ' ')}</span>
                                        <span className="text-xs opacity-60">{ex.targetSets} x {ex.targetReps}</span>
                                    </div>
                                );
                            })}
                            {routine.days[routine.currentDayIndex].exercises.length > 3 && (
                                <div className="text-xs font-medium text-text-muted pl-4">
                                    + {routine.days[routine.currentDayIndex].exercises.length - 3} more exercises
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => navigate("/workout/active")}
                            className="w-full py-4 bg-white text-black hover:bg-white/90 font-semibold rounded-xl transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2"
                        >
                            <Play size={16} fill="currentColor" />
                            <span>Start Workout</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center space-y-4">
                    <Layers className="mx-auto text-white/10" size={40} />
                    <div className="space-y-1">
                        <h2 className="text-base font-medium text-white">No Active Plan</h2>
                        <p className="text-xs text-text-muted">Configure your training protocol to begin.</p>
                    </div>
                    <button
                        onClick={() => navigate("/workout/builder/new")}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium uppercase tracking-wide transition-colors text-white"
                    >
                        Create Plan
                    </button>
                </div>
            )}

            {/* Performance Metrics */}
            <div className="space-y-4">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide px-1">
                    Performance
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface border border-white/5 p-5 rounded-2xl space-y-2 group hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start">
                            <Activity size={18} className="text-emerald-500" />
                            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Total Sets</span>
                        </div>
                        <div className="text-2xl font-semibold text-white tracking-tight">{totalSets}</div>
                    </div>
                    <div className="bg-surface border border-white/5 p-5 rounded-2xl space-y-2 group hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start">
                            <Zap size={18} className="text-amber-500" />
                            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Last Active</span>
                        </div>
                        <div className="text-lg font-semibold text-white tracking-tight truncate">
                            {lastWorkout ? format(new Date(lastWorkout.completedAt), "MMM d") : "N/A"}
                        </div>
                    </div>
                    <div className="bg-surface border border-white/5 p-5 rounded-2xl space-y-2 col-span-2 group hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start">
                            <TrendingUp size={18} className="text-blue-500" />
                            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Volume Load</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-semibold text-white tracking-tight">{(totalVolume / 1000).toFixed(1)}k</div>
                            <span className="text-xs text-text-muted font-medium">kg total</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insight */}
            <div className="bg-surface border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex gap-4 items-start relative z-10">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                        <AlertCircle size={20} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium text-white">Coach Insight</h4>
                        <p className="text-xs text-text-muted leading-relaxed">
                            {insight}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
