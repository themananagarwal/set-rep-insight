import { format } from "date-fns";
import { useTrainerStore } from "../../lib/store";
import { useMemo, useState, useEffect } from "react";
import { getExerciseProgress, getMuscleHeatmapData, getPersonalRecords, type InsightTimeRange } from "../../lib/insight-helpers";
import { calculateStrengthRadar } from "../../lib/radar-helpers";
import { CartesianGrid, Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search, ChevronDown, Radar, Activity, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { BodyHeatmap } from "./BodyHeatmap";
import { StrengthRadar } from "./StrengthRadar";
import { EXERCISE_LIBRARY } from "../../lib/exercises";

const TABS = ["Overview", "Analysis", "Records"] as const;
type Tab = typeof TABS[number];

const METRICS = [
    { id: "weight", label: "Max Weight" },
    { id: "e1rm", label: "Est. 1RM" },
    { id: "volume", label: "Total Volume" }
] as const;

const TIME_RANGES: InsightTimeRange[] = ["1M", "3M", "6M", "ALL"];

export function TrendsView() {
    const { history, exercises, user } = useTrainerStore();
    const [activeTab, setActiveTab] = useState<Tab>("Overview");

    // Analysis State
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [activeMetric, setActiveMetric] = useState<"weight" | "e1rm" | "volume">("e1rm");
    const [timeRange, setTimeRange] = useState<InsightTimeRange>("3M");

    // Default to first exercise
    useEffect(() => {
        if (!selectedExerciseId && exercises.length > 0) {
            const popular = exercises.find(e => e.name.includes("Bench") || e.name.includes("Squat")) || exercises[0];
            setSelectedExerciseId(popular.id);
        }
    }, [exercises, selectedExerciseId]);

    // --- 1. Progress Chart Data ---
    const progressData = useMemo(() => {
        if (!selectedExerciseId) return [];
        return getExerciseProgress(history, selectedExerciseId, timeRange);
    }, [selectedExerciseId, history, timeRange]);

    // --- 2. Heatmap Data ---
    const heatmapData = useMemo(() => getMuscleHeatmapData(history, exercises), [history, exercises]);

    // --- 3. Radar Data ---
    const radarData = useMemo(() => {
        const weight = user?.weight || 75;
        return calculateStrengthRadar(history, weight);
    }, [history, user]);

    // --- 4. Personal Records ---
    const prs = useMemo(() => getPersonalRecords(history), [history]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">

            {/* --- TOP NAVIGATION --- */}
            <div className="flex p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 sticky top-0 z-20">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                            "flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300",
                            activeTab === tab
                                ? "bg-gradient-to-br from-primary to-fuchsia-600 text-white shadow-lg shadow-primary/20"
                                : "text-text-muted hover:text-white hover:bg-white/5"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* --- VIEW: OVERVIEW --- */}
            {activeTab === "Overview" && (
                <div className="grid grid-cols-1 gap-6 animate-in zoom-in-95 duration-300">

                    {/* Radar Card */}
                    <div className="bg-surface/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Radar size={120} />
                        </div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 relative z-10">
                            <Activity className="text-fuchsia-400" size={20} /> Strength Balance
                        </h3>
                        <StrengthRadar data={radarData} />
                    </div>

                    {/* Heatmap Card */}
                    <div className="bg-surface/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Search size={120} />
                        </div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 relative z-10">
                            <TrendingUp className="text-blue-400" size={20} /> Muscle Focus
                        </h3>
                        <div className="flex justify-center">
                            <BodyHeatmap data={heatmapData} />
                        </div>
                        <p className="text-xs text-text-muted text-center mt-6">
                            Heatmap based on training volume intensity (last 30d).
                        </p>
                    </div>
                </div>
            )}

            {/* --- VIEW: ANALYSIS --- */}
            {activeTab === "Analysis" && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">

                    {/* Controls Card */}
                    <div className="bg-surface border border-white/5 rounded-2xl p-4 space-y-4">
                        <div className="relative">
                            <select
                                value={selectedExerciseId || ""}
                                onChange={(e) => setSelectedExerciseId(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pr-10 text-lg font-bold outline-none focus:border-primary transition-colors appearance-none"
                            >
                                {exercises.map(ex => (
                                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>

                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                            {METRICS.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setActiveMetric(m.id as any)}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-all",
                                        activeMetric === m.id
                                            ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                            : "bg-transparent border-white/10 text-text-muted hover:border-white/30"
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-xs text-text-muted font-mono uppercase tracking-wider">Time Range</span>
                            <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                                {TIME_RANGES.map(tr => (
                                    <button
                                        key={tr}
                                        onClick={() => setTimeRange(tr)}
                                        className={clsx(
                                            "px-3 py-1 rounded-md text-[10px] font-bold transition-colors",
                                            timeRange === tr ? "bg-white/20 text-white" : "text-text-muted hover:text-white"
                                        )}
                                    >
                                        {tr}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chart Card */}
                    <div className="bg-surface border border-white/5 rounded-3xl p-2 h-[350px] relative shadow-2xl">
                        {progressData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={progressData}>
                                    <defs>
                                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(ts) => format(new Date(ts), "MMM d")}
                                        stroke="#444"
                                        tick={{ fontSize: 10 }}
                                        tickMargin={10}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#444"
                                        tick={{ fontSize: 10 }}
                                        domain={['auto', 'auto']}
                                        width={30}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderColor: '#333', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey={activeMetric}
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorMetric)"
                                        activeDot={{ r: 6, fill: '#fff', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
                                <Activity size={48} className="opacity-20 mb-4" />
                                <p>Not enough data points yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- VIEW: RECORDS --- */}
            {activeTab === "Records" && (
                <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                    <div className="grid grid-cols-1 gap-4">
                        {prs.slice(0, 10).map((pr, i) => {
                            const exName = EXERCISE_LIBRARY[pr.exerciseId]?.name || pr.exerciseId;
                            return (
                                <div key={i} className="bg-surface border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                            i < 3 ? "bg-amber-500/20 text-amber-500" : "bg-white/5 text-text-muted"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold">{exName}</h4>
                                            <p className="text-xs text-text-muted">{format(new Date(pr.date), "MMM d, yyyy")}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold font-mono text-primary">
                                            {Math.round(pr.value)}<span className="text-xs text-text-muted ml-0.5">kg</span>
                                        </p>
                                        <p className="text-[10px] text-text-muted uppercase tracking-wider">Est. 1RM</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
