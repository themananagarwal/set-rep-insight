import { useState } from "react";
import type { MuscleHeatmapData } from "../../lib/insight-helpers";
import { RotateCw } from "lucide-react";

// Types for our internal anatomy model
type AnatomyPart = "traps" | "shoulders" | "chest" | "biceps" | "triceps" | "forearms" | "abs" | "obliques" | "lats" | "lower_back" | "glutes" | "quads" | "hamstrings" | "calves";

interface BodyHeatmapProps {
    data: MuscleHeatmapData;
}

export function BodyHeatmap({ data }: BodyHeatmapProps) {
    const [view, setView] = useState<"front" | "back">("front");

    // --- MAPPING LOGIC ---
    const getIntensity = (part: AnatomyPart): number => {
        switch (part) {
            case "chest": return data["Chest"] || 0;
            case "abs":
            case "obliques": return data["Core"] || 0;
            case "shoulders": return data["Shoulders"] || 0;
            case "traps": return (data["Back"] || 0) * 0.5 + (data["Shoulders"] || 0) * 0.5;
            case "lats":
            case "lower_back": return data["Back"] || 0;
            case "biceps": return data["Arms"] || data["Biceps"] || 0;
            case "triceps": return data["Arms"] || data["Triceps"] || 0;
            case "forearms": return (data["Arms"] || 0) * 0.5;
            case "quads": return data["Legs"] || 0;
            case "hamstrings":
            case "glutes":
            case "calves": return data["Legs"] || 0;
            default: return 0;
        }
    };

    // --- PROGRESSIVE COLOR SCALE ---
    const getColor = (part: AnatomyPart) => {
        const val = getIntensity(part);

        if (val === 0) return "#e5e7eb"; // Neutral light grey for "flesh" / inactive muscles in this style

        // Gradient logic
        if (val < 0.4) return `rgba(6, 182, 212, ${0.6 + val})`; // Cyan
        if (val < 0.7) return `rgba(139, 92, 246, ${0.7 + val})`; // Violet
        return `rgba(217, 70, 239, ${0.8 + val * 0.2})`; // Fuchsia
    };

    // Base silhouette color
    const baseColor = "#9ca3af"; // Solid Grey for the body silhouette

    return (
        <div className="relative flex flex-col items-center">
            {/* View Toggle */}
            <div className="absolute top-0 right-0 z-10">
                <button
                    onClick={() => setView(v => v === "front" ? "back" : "front")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-white/10 rounded-full text-xs font-bold transition-colors"
                >
                    <RotateCw size={14} />
                    {view === "front" ? "Front" : "Back"}
                </button>
            </div>

            {/* SVG CONTAINER - Clean Medical Style (Slim Waist Edition) */}
            <div className="h-[350px] w-full flex items-center justify-center py-4">
                <svg viewBox="0 0 240 420" className="h-full w-auto drop-shadow-lg overflow-visible">
                    <defs>
                        {/* Subtle inner shadow for depth maybe? Keeping it flat for now to match chart style */}
                    </defs>

                    {view === "front" ? (
                        <g transform="translate(20, 10)">
                            {/* --- FRONT VIEW SILHOUETTE --- */}
                            {/* Head */}
                            <path d="M90 20 Q100 10 110 20 L112 40 L88 40 Z" fill={baseColor} />
                            {/* Neck */}
                            <rect x="92" y="40" width="16" height="10" fill={baseColor} />

                            {/* Torso Base - Slimmer Waist */}
                            <path d="M70 60 L130 60 L122 120 L115 160 L85 160 L78 120 Z" fill={baseColor} opacity="0.3" />
                            {/* Arms Base */}
                            <path d="M50 70 L40 120 L35 150 L55 150 L60 120 Z" fill={baseColor} opacity="0.3" />
                            <path d="M150 70 L160 120 L165 150 L145 150 L140 120 Z" fill={baseColor} opacity="0.3" />
                            {/* Legs Base */}
                            <path d="M85 160 L75 230 L80 300 L95 300 L100 230 L100 160 Z" fill={baseColor} opacity="0.3" />
                            <path d="M115 160 L125 230 L120 300 L105 300 L100 230 L100 160 Z" fill={baseColor} opacity="0.3" />


                            {/* --- MUSCLE PATCHES (Anatomical) --- */}

                            {/* Traps */}
                            <path d="M88 45 L70 55 L90 55 z" fill={getColor("traps")} stroke="white" strokeWidth="1" />
                            <path d="M112 45 L130 55 L110 55 z" fill={getColor("traps")} stroke="white" strokeWidth="1" />

                            {/* Shoulders (Deltoids - Cap) */}
                            <path d="M70 55 L45 65 Q40 80 48 90 L65 75 Z" fill={getColor("shoulders")} stroke="white" strokeWidth="1" />
                            <path d="M130 55 L155 65 Q160 80 152 90 L135 75 Z" fill={getColor("shoulders")} stroke="white" strokeWidth="1" />

                            {/* Chest (Pecs - Split Plates) */}
                            <path d="M70 60 L100 60 L100 100 Q80 105 70 85 Z" fill={getColor("chest")} stroke="white" strokeWidth="1" />
                            <path d="M130 60 L100 60 L100 100 Q120 105 130 85 Z" fill={getColor("chest")} stroke="white" strokeWidth="1" />

                            {/* Biceps (Fusiform) */}
                            <path d="M48 90 L42 125 Q50 130 55 125 L58 90 Z" fill={getColor("biceps")} stroke="white" strokeWidth="1" />
                            <path d="M152 90 L158 125 Q150 130 145 125 L142 90 Z" fill={getColor("biceps")} stroke="white" strokeWidth="1" />

                            {/* Forearms */}
                            <path d="M42 125 L35 160 Q40 165 50 160 L55 125 Z" fill={getColor("forearms")} stroke="white" strokeWidth="1" />
                            <path d="M158 125 L165 160 Q160 165 150 160 L145 125 Z" fill={getColor("forearms")} stroke="white" strokeWidth="1" />

                            {/* Abs (Six pack segmentation - Narrower) */}
                            <path d="M88 100 L112 100 L112 145 L88 145 Z" fill={getColor("abs")} stroke="white" strokeWidth="1" />
                            {/* Horizontal lines for abs definition */}
                            <line x1="88" y1="115" x2="112" y2="115" stroke="white" strokeWidth="1" opacity={getIntensity("abs") > 0 ? 1 : 0} />
                            <line x1="88" y1="130" x2="112" y2="130" stroke="white" strokeWidth="1" opacity={getIntensity("abs") > 0 ? 1 : 0} />
                            <line x1="100" y1="100" x2="100" y2="145" stroke="white" strokeWidth="1" opacity={getIntensity("abs") > 0 ? 1 : 0} />

                            {/* Obliques (Flanks - Slimmer) */}
                            <path d="M70 85 L88 100 L88 145 L75 140 Z" fill={getColor("obliques")} stroke="white" strokeWidth="1" />
                            <path d="M130 85 L112 100 L112 145 L125 140 Z" fill={getColor("obliques")} stroke="white" strokeWidth="1" />

                            {/* Quads (Large tear drops) */}
                            <path d="M75 160 L98 165 L95 230 Q85 240 75 230 L70 190 Z" fill={getColor("quads")} stroke="white" strokeWidth="1" />
                            <path d="M125 160 L102 165 L105 230 Q115 240 125 230 L130 190 Z" fill={getColor("quads")} stroke="white" strokeWidth="1" />
                            {/* Inner thigh gap handled by silhouette separation */}

                            {/* Calves (Front Tibialis/Outer) */}
                            <path d="M75 240 L80 290 L90 280 L85 245 Z" fill={getColor("calves")} stroke="white" strokeWidth="1" />
                            <path d="M125 240 L120 290 L110 280 L115 245 Z" fill={getColor("calves")} stroke="white" strokeWidth="1" />

                            {/* Hands/Feet (Silhouette) */}
                            <circle cx="45" cy="175" r="8" fill={baseColor} />
                            <circle cx="155" cy="175" r="8" fill={baseColor} />
                            <path d="M80 300 L100 300 L105 310 L75 310 Z" fill={baseColor} />
                            <path d="M120 300 L100 300 L95 310 L125 310 Z" fill={baseColor} />
                        </g>

                    ) : (
                        <g transform="translate(20, 10)">
                            {/* --- BACK VIEW --- */}

                            {/* Head & Neck Base */}
                            <path d="M90 20 Q100 10 110 20 L112 40 L88 40 Z" fill={baseColor} />
                            <rect x="92" y="40" width="16" height="10" fill={baseColor} />

                            {/* Torso Base - Slimmer Waist */}
                            <path d="M70 60 L130 60 L120 120 L115 160 L85 160 L80 120 Z" fill={baseColor} opacity="0.3" />

                            {/* Arm/Leg Silhouette bases implicit under muscles mostly */}

                            {/* Traps (Diamond Kite) */}
                            <path d="M88 45 L60 60 L100 85 L140 60 L112 45 L100 42 Z" fill={getColor("traps")} stroke="white" strokeWidth="1" />
                            <line x1="100" y1="42" x2="100" y2="85" stroke="white" strokeWidth="1" />

                            {/* Delts (Rear) */}
                            <path d="M60 60 L40 70 Q45 85 52 90 L65 80 Z" fill={getColor("shoulders")} stroke="white" strokeWidth="1" />
                            <path d="M140 60 L160 70 Q155 85 148 90 L135 80 Z" fill={getColor("shoulders")} stroke="white" strokeWidth="1" />

                            {/* Triceps (Horseshoe) */}
                            <path d="M52 90 L45 125 L60 125 L65 90 Z" fill={getColor("triceps")} stroke="white" strokeWidth="1" />
                            <path d="M148 90 L155 125 L140 125 L135 90 Z" fill={getColor("triceps")} stroke="white" strokeWidth="1" />

                            {/* Lats (Wings - Tapered more sharply) */}
                            <path d="M68 80 L90 95 L90 145 L70 130 Z" fill={getColor("lats")} stroke="white" strokeWidth="1" />
                            <path d="M132 80 L110 95 L110 145 L130 130 Z" fill={getColor("lats")} stroke="white" strokeWidth="1" />

                            {/* Lower Back (Erectors) */}
                            <path d="M90 145 L110 145 L105 165 L95 165 Z" fill={getColor("lower_back")} stroke="white" strokeWidth="1" />

                            {/* Glutes (Butterfly) */}
                            <path d="M65 165 L100 165 L100 210 Q80 220 60 200 Z" fill={getColor("glutes")} stroke="white" strokeWidth="1" />
                            <path d="M135 165 L100 165 L100 210 Q120 220 140 200 Z" fill={getColor("glutes")} stroke="white" strokeWidth="1" />

                            {/* Hamstrings (Thigh backs) */}
                            <path d="M65 205 L95 215 L90 260 L60 260 Z" fill={getColor("hamstrings")} stroke="white" strokeWidth="1" />
                            <path d="M135 205 L105 215 L110 260 L140 260 Z" fill={getColor("hamstrings")} stroke="white" strokeWidth="1" />

                            {/* Calves (Gastrocnemius - Heart/Diamond) */}
                            <path d="M60 260 L65 310 Q75 320 85 310 L90 265 Z" fill={getColor("calves")} stroke="white" strokeWidth="1" />
                            <path d="M140 260 L135 310 Q125 320 115 310 L110 265 Z" fill={getColor("calves")} stroke="white" strokeWidth="1" />

                            {/* Hands/Feet (Silhouette) */}
                            <circle cx="45" cy="175" r="8" fill={baseColor} />
                            <circle cx="155" cy="175" r="8" fill={baseColor} />
                            <path d="M80 310 L100 310 L105 320 L75 320 Z" fill={baseColor} />
                            <path d="M120 310 L100 310 L95 320 L125 320 Z" fill={baseColor} />
                        </g>
                    )}
                </svg>
            </div>

            {/* Gradient Legend */}
            <div className="flex gap-6 text-xs font-bold text-text-muted mt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div> Warmup
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-violet-500"></div> Active
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-fuchsia-500"></div> Intense
                </div>
            </div>
        </div>
    );
}
