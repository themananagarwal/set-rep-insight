import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import type { RadarDataPoint } from "../../lib/radar-helpers";

interface StrengthRadarProps {
    data: RadarDataPoint[];
}

export function StrengthRadar({ data }: StrengthRadarProps) {
    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-text-muted">
                Need more workout data to generate Analysis.
            </div>
        );
    }

    // Custom Tick for Axis Labels to include Tier
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderTick = (props: any) => {
        const { payload, x, y, textAnchor } = props;
        const dataPoint = data.find(d => d.label === payload.value);
        const tier = dataPoint ? dataPoint.tier : "?";

        // Define color based on Tier
        let tierColor = "#666";
        if (tier === "S") tierColor = "#d946ef"; // Fuchsia
        if (tier === "A") tierColor = "#ef4444"; // Red
        if (tier === "B") tierColor = "#f97316"; // Orange
        if (tier === "C") tierColor = "#eab308"; // Yellow
        if (tier === "D") tierColor = "#3b82f6"; // Blue

        return (
            <g className="recharts-layer recharts-polar-angle-axis-tick">
                <text
                    x={x}
                    y={y}
                    dy={0}
                    textAnchor={textAnchor}
                    fill="#ccc"
                    fontSize={10}
                    fontWeight="bold"
                >
                    {payload.value}
                </text>
                <text
                    x={x}
                    y={y + 12}
                    dy={0}
                    textAnchor={textAnchor}
                    fill={tierColor}
                    fontSize={12}
                    fontWeight="800"
                >
                    {tier}
                </text>
            </g>
        );
    };

    return (
        <div className="flex flex-col items-center">
            <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#333" />
                        <PolarAngleAxis
                            dataKey="label"
                            tick={renderTick}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Strength Score"
                            dataKey="score"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="#8b5cf6"
                            fillOpacity={0.4}
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

            <div className="text-xs text-text-muted mt-2 text-center max-w-xs">
                Scores (0-100) are based on your estimated 1RM vs Bodyweight. <br />
                <span className="text-primary font-bold">S-Rank</span> = Elite Strength.
            </div>
        </div>
    );
}
