import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from "date-fns";
import { useTrainerStore } from "../lib/store";
import { ChevronLeft, ChevronRight, BarChart2, Calendar as CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";
import clsx from "clsx";
import { TrendsView } from "../components/insights/TrendsView";

export default function HistoryPage() {
    const { history, exercises } = useTrainerStore();
    const [viewMode, setViewMode] = useState<"log" | "trends">("log");

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Calendar Generation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Dates with workouts
    const workoutDates = history.map(h => new Date(h.completedAt));
    const hasWorkout = (date: Date) => workoutDates.some(d => isSameDay(d, date));

    // Get selected day's workouts
    const selectedSets = selectedDate
        ? history.filter(h => isSameDay(new Date(h.completedAt), selectedDate))
        : [];

    const groupedByExercise = useMemo(() => {
        const groups: Record<string, { exerciseId: string; sets: typeof selectedSets; timestamp: number }> = {};
        selectedSets.forEach(set => {
            if (!groups[set.exerciseId]) {
                groups[set.exerciseId] = { exerciseId: set.exerciseId, sets: [], timestamp: set.completedAt };
            }
            groups[set.exerciseId].sets.push(set);
        });
        return Object.values(groups).sort((a, b) => b.timestamp - a.timestamp);
    }, [selectedSets]);

    const [expandedExId, setExpandedExId] = useState<string | null>(null);

    return (
        <div className="pt-6 pb-24 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">History</h1>

                {/* View/Tab Switcher */}
                <div className="flex bg-secondary p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode("log")}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all",
                            viewMode === "log" ? "bg-primary text-white shadow" : "text-text-muted hover:text-white"
                        )}
                    >
                        <CalendarIcon size={14} /> Log
                    </button>
                    <button
                        onClick={() => setViewMode("trends")}
                        className={clsx(
                            "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all",
                            viewMode === "trends" ? "bg-primary text-white shadow" : "text-text-muted hover:text-white"
                        )}
                    >
                        <BarChart2 size={14} /> Trends
                    </button>
                </div>
            </div>

            {viewMode === "log" ? (
                <>
                    {/* Calendar Header */}
                    <div className="bg-surface border border-secondary rounded-3xl p-6 animate-in fade-in slide-in-from-left-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">
                                {format(currentDate, "MMMM yyyy")}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                                    className="p-2 hover:bg-secondary rounded-full"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                                    className="p-2 hover:bg-secondary rounded-full"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-7 gap-2 text-center mb-2">
                            {["S", "M", "T", "W", "T", "F", "S"].map(d => (
                                <div key={d} className="text-xs text-text-muted font-bold">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {/* Padding for start of month - simplified for MVP, ideally correct alignment */}
                            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                                <div key={`pad-${i}`} />
                            ))}

                            {days.map(day => {
                                const worked = hasWorkout(day);
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={clsx(
                                            "aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all relative",
                                            isSelected ? "bg-white text-background scale-110 shadow-lg z-10" : "bg-secondary/30 hover:bg-secondary",
                                            worked && !isSelected && "border border-green-500/50 text-green-400 bg-green-500/10"
                                        )}
                                    >
                                        {format(day, "d")}
                                        {worked && (
                                            <div className="absolute bottom-1 w-1 h-1 bg-green-500 rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Day Details */}
                    {selectedDate && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                {format(selectedDate, "EEEE, MMM do")}
                                <span className="text-xs font-normal text-text-muted bg-secondary px-2 py-1 rounded-full">
                                    {selectedSets.length} Sets
                                </span>
                            </h3>

                            {selectedSets.length === 0 ? (
                                <div className="text-text-muted italic bg-secondary/20 p-4 rounded-xl text-center text-sm">
                                    No workout data for this day.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {groupedByExercise.map(group => {
                                        const exData = exercises.find(e => e.id === group.exerciseId);
                                        const isExpanded = expandedExId === group.exerciseId;
                                        
                                        return (
                                            <div key={group.exerciseId} className="space-y-2">
                                                <button 
                                                    onClick={() => setExpandedExId(isExpanded ? null : group.exerciseId)}
                                                    className="w-full bg-surface border border-secondary p-4 rounded-xl flex justify-between items-center active:scale-[0.99] transition-all"
                                                >
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-bold text-white">
                                                            {exData?.name || group.exerciseId}
                                                        </span>
                                                        <span className="text-xs text-text-muted">
                                                            {group.sets.length} sets • Last at {format(new Date(group.timestamp), "h:mm a")}
                                                        </span>
                                                    </div>
                                                    <div className="text-right flex items-center gap-3">
                                                        <div className="text-sm font-bold text-primary">
                                                            {group.sets[0].weight ? `${group.sets[0].weight}kg` : "Timed"}
                                                        </div>
                                                        <ChevronRight size={16} className={clsx("text-text-muted transition-transform", isExpanded && "rotate-90")} />
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="bg-secondary/20 rounded-xl p-4 mx-2 space-y-4 animate-in slide-in-from-top-2 fade-in">
                                                        {/* Persistent Notes for this Exercise */}
                                                        {exData?.notes && (
                                                            <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">General Notes</p>
                                                                <p className="text-xs text-text-muted leading-relaxed">{exData.notes}</p>
                                                            </div>
                                                        )}

                                                        <div className="space-y-2">
                                                            <div className="grid grid-cols-[30px_1fr_1fr_1fr] gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">
                                                                <span>#</span>
                                                                <span>Metric</span>
                                                                <span>RPE</span>
                                                                <span>Time</span>
                                                            </div>
                                                            {group.sets.sort((a, b) => a.completedAt - b.completedAt).map((set, i) => (
                                                                <div key={set.id} className="grid grid-cols-[30px_1fr_1fr_1fr] gap-2 items-center text-center py-1 border-b border-white/5 last:border-0">
                                                                    <span className="text-xs text-text-muted font-mono">{i+1}</span>
                                                                    <span className="text-xs font-bold text-white">
                                                                        {set.duration ? `${Math.floor(set.duration/60)}m ${set.duration%60}s` : `${set.weight}kg x ${set.reps}`}
                                                                    </span>
                                                                    <span className="text-xs text-text-muted">RPE {set.rpe}</span>
                                                                    <span className="text-[10px] text-text-muted font-mono">{format(new Date(set.completedAt), "h:mm a")}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <TrendsView />
            )}
        </div>
    );
}
