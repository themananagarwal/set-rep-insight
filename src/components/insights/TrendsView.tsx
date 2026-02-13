import { format } from "date-fns";
import { useTrainerStore } from "../../lib/store";
import { useMemo, useState, useEffect } from "react";
import { getExerciseProgress, getMuscleHeatmapData } from "../../lib/insight-helpers";
import { calculateStrengthRadar } from "../../lib/radar-helpers";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dumbbell, Search, ChevronDown, Radar } from "lucide-react";
import clsx from "clsx";
import { BodyHeatmap } from "./BodyHeatmap";
import { StrengthRadar } from "./StrengthRadar";

const BODY_PARTS = [
    { id: "Chest", label: "Chest" },
    { id: "Back", label: "Back" },
    { id: "Shoulders", label: "Shoulders" },
    { id: "Biceps", label: "Arms" },
    { id: "Triceps", label: "Arms" }, // Grouped visually usually
    { id: "Legs", label: "Legs" },
    { id: "Core", label: "Core" },
    { id: "Cardio", label: "Cardio" }
];

export function TrendsView() {
    const { history, exercises, user } = useTrainerStore();
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [filterMuscle, setFilterMuscle] = useState<string | null>(null);

    // Default to first exercise if none selected
    useEffect(() => {
        if (!selectedExerciseId && exercises.length > 0) {
            // Try to find a popular one, or just the first
            const popular = exercises.find(e => e.name === "Bench Press (Barbell)") || exercises[0];
            setSelectedExerciseId(popular.id);
        }
    }, [exercises, selectedExerciseId]);

    // --- 1. Progress Chart Data ---
    const progressData = useMemo(() => {
        if (!selectedExerciseId) return [];
        return getExerciseProgress(history, selectedExerciseId);
    }, [selectedExerciseId, history]);


    const filteredExercises = useMemo(() => {
        if (!filterMuscle) return exercises;
        return exercises.filter(e => e.muscle === filterMuscle);
    }, [exercises, filterMuscle]);


    // --- 2. Heatmap Data ---
    const heatmapData = useMemo(() => {
        return getMuscleHeatmapData(history, exercises);
    }, [history, exercises]);

    // --- 3. Radar Data ---
    const radarData = useMemo(() => {
        // Default to 75kg if user weight not set
        const weight = user?.weight || 75;
        return calculateStrengthRadar(history, weight);
    }, [history, user]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

            {/* --- SECTION 1: VISUALIZATIONS (Grid Layout) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1A. BODY HEATMAP */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Search className="text-primary" size={20} /> Muscle Focus
                    </h3>

                    <div className="bg-surface border border-secondary rounded-2xl p-6 relative min-h-[400px]">
                        <BodyHeatmap data={heatmapData} />
                        <p className="text-xs text-text-muted text-center max-w-xs mx-auto mt-4">
                            Based on training volume (last 30 days).
                        </p>
                    </div>
                </div>

                {/* 1B. STRENGTH RADAR */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Radar className="text-primary" size={20} /> Strength Ranks
                    </h3>

                    <div className="bg-surface border border-secondary rounded-2xl p-6 relative min-h-[400px] flex flex-col justify-center">
                        <StrengthRadar data={radarData} />
                    </div>
                </div>

            </div>

            {/* --- SECTION 2: PROGRESS GRAPH --- */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Dumbbell className="text-primary" size={20} /> Progress Tracker
                </h3>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setFilterMuscle(null)}
                        className={clsx(
                            "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                            !filterMuscle ? "bg-primary text-white" : "bg-secondary text-text-muted"
                        )}
                    >
                        All
                    </button>
                    {BODY_PARTS.map(part => (
                        <button
                            key={part.id}
                            onClick={() => setFilterMuscle(part.id)}
                            className={clsx(
                                "px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                                filterMuscle === part.id ? "bg-primary text-white" : "bg-secondary text-text-muted"
                            )}
                        >
                            {part.label}
                        </button>
                    ))}
                </div>

                {/* Exercise Selector */}
                <div className="relative">
                    <select
                        value={selectedExerciseId || ""}
                        onChange={(e) => setSelectedExerciseId(e.target.value)}
                        className="w-full bg-surface border border-secondary rounded-xl p-3 pr-10 appearance-none font-bold outline-none focus:border-primary transition-colors"
                    >
                        {filteredExercises.map(ex => (
                            <option key={ex.id} value={ex.id}>
                                {ex.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                </div>

                {/* Chart */}
                <div className="bg-surface border border-secondary rounded-2xl p-4 h-[300px] relative">
                    {progressData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progressData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(ts) => format(new Date(ts), "MMM d")}
                                    stroke="#666"
                                    tick={{ fontSize: 10 }}
                                    tickMargin={10}
                                />
                                <YAxis
                                    stroke="#666"
                                    tick={{ fontSize: 10 }}
                                    domain={['auto', 'auto']}
                                    width={30}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                    labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    dot={{ fill: '#ef4444', r: 4 }}
                                    activeDot={{ r: 6, fill: '#fff' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted text-center p-6">
                            <p>Not enough data to graph.</p>
                            <p className="text-xs mt-2">Log at least 2 workouts for this exercise to see your progress.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
