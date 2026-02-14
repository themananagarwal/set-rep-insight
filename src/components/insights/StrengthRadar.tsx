import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import type { RadarDataPoint } from "../../lib/radar-helpers";
import { useState } from "react";
import { generateProgramAdjustments, type PlanPatch } from "../../lib/program-adjustment";
import { useTrainerStore } from "../../lib/store"; // Access routine
import { EXERCISE_LIBRARY } from "../../lib/exercises";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";

interface StrengthRadarProps {
    data: RadarDataPoint[];
}

export function StrengthRadar({ data }: StrengthRadarProps) {
    const { routines, activeRoutineId, history, applySchedulePatch } = useTrainerStore();
    const [patch, setPatch] = useState<PlanPatch | { status: "insufficient_data", daysCollected: number } | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderTick = (props: any) => {
        const { payload, x, y, textAnchor } = props;
        const dataPoint = data.find(d => d.label === payload.value);
        const tier = dataPoint ? dataPoint.tier : "?";
        let tierColor = "#666";
        if (tier === "S") tierColor = "#d946ef";
        if (tier === "A") tierColor = "#ef4444";
        if (tier === "B") tierColor = "#f97316";
        if (tier === "C") tierColor = "#eab308";
        if (tier === "D") tierColor = "#3b82f6";

        return (
            <g className="recharts-layer recharts-polar-angle-axis-tick">
                <text x={x} y={y} dy={0} textAnchor={textAnchor} fill="#ccc" fontSize={10} fontWeight="bold">{payload.value}</text>
                <text x={x} y={y + 12} dy={0} textAnchor={textAnchor} fill={tierColor} fontSize={12} fontWeight="800">{tier}</text>
            </g>
        );
    };

    const handleOptimize = () => {
        const routine = routines.find(r => r.id === activeRoutineId);
        if (!routine) return;

        // Pass history to check for learning period
        const result = generateProgramAdjustments(data, routine, history);
        setPatch(result);
    };

    return (
        <div className="flex flex-col items-center">
            <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#555" strokeWidth={1} />
                        <PolarAngleAxis dataKey="label" tick={renderTick} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Strength Score"
                            dataKey="score"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fill="#8b5cf6"
                            fillOpacity={0.4}
                            isAnimationActive={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any, _name: any, props: any) => {
                                const ratio = props.payload.ratio ? props.payload.ratio.toFixed(2) : "0.00";
                                return [`${value} (Ratio: ${ratio}x)`, "Score"];
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="text-xs text-text-muted mt-2 text-center max-w-xs mb-4">
                Scores (0-100) are based on your estimated 1RM vs Bodyweight. <br />
                <span className="text-primary font-bold">S-Rank</span> = Elite Strength.
            </div>

            {/* OPTIMIZER BUTTON */}
            {!patch && (
                <button
                    onClick={handleOptimize}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-violet-500/20 hover:scale-105 transition-transform"
                >
                    <Sparkles size={18} /> Optimize Program
                </button>
            )}

            {/* PATCH REVIEW UI */}
            {patch && (
                <div className="w-full mt-4 bg-surface/50 border border-white/10 rounded-2xl p-4 animate-in slide-in-from-bottom-4 fade-in">

                    {patch.status === "insufficient_data" ? (
                        <div className="text-center py-4 space-y-3">
                            <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="font-bold text-lg">AI Calibration in Progress</h3>
                            <p className="text-sm text-text-muted">
                                We need at least 14 days of data to make accurate recommendations.
                                Making premature adjustments can lead to overtraining.
                            </p>
                            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                                <div
                                    className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (patch.daysCollected / 14) * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-text-muted font-mono mt-1">
                                {patch.daysCollected} / 14 Days Collected
                            </p>
                            <button
                                onClick={() => setPatch(null)}
                                className="text-xs text-text-muted underline mt-2 hover:text-white"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <TrendingUp size={20} className="text-green-500" />
                                    Program Optimizations
                                </h3>
                                <div className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded">
                                    {patch.gapsFound.weakAxes.length} Weakness Detected
                                </div>
                            </div>

                            {patch.changes.length === 0 ? (
                                <p className="text-sm text-center text-text-muted py-4">
                                    No major imbalances found! Your current plan is solid. ✅
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {patch.changes.map((change, idx) => (
                                        <div key={idx} className="bg-background border border-white/5 rounded-xl p-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                                    {change.dayName}
                                                </span>
                                                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                                    {change.action === "add_exercise" ? "New Exercise" : "Volume Boost"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {change.action === "add_exercise" && <div className="text-green-400 font-bold">+</div>}
                                                <span className="font-bold text-base">
                                                    {change.exerciseId ? EXERCISE_LIBRARY[change.exerciseId]?.name : change.exerciseId}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-muted mb-2">
                                                {change.reason}
                                            </p>
                                            <div className="text-xs font-mono bg-black/30 p-2 rounded flex justify-between">
                                                <span>Target: 3 Sets x 8-12 Reps</span>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => {
                                            if (confirm("Apply these changes to your weekly schedule?")) {
                                                applySchedulePatch(patch);
                                                setPatch(null);
                                                // Optional: toast notification
                                            }
                                        }}
                                        className="w-full mt-2 btn btn-primary py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-500"
                                    >
                                        Apply Updates to Schedule
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
