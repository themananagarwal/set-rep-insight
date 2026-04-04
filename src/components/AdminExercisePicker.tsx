import { useState, useMemo } from "react";
import { useMockBackendStore } from "../lib/mockBackend";
import { ALL_EXERCISES } from "../lib/exercises";
import { Dumbbell, Search, ArrowLeft } from "lucide-react";
import type { Exercise } from "../lib/types";

interface AdminExercisePickerProps {
    onSelect: (exercise: Exercise) => void;
    onBack: () => void;
}

export default function AdminExercisePicker({ onSelect, onBack }: AdminExercisePickerProps) {
    const globalExercises = useMockBackendStore(state => state.globalExercises);
    const [search, setSearch] = useState("");

    // Build the admin library (Built-ins + Global added by admin)
    const adminLibrary: Exercise[] = useMemo(() => {
        const builtIns = ALL_EXERCISES.map(def => ({
            id: def.id,
            name: def.name,
            muscle: def.primaryAxis,
            type: (def.tags.includes("compound") ? "compound" : "isolation") as "compound" | "isolation",
            trackingType: (def.primaryAxis === "Cardio" || def.id === "plank" || def.name.toLowerCase().includes("plank") ? "time" : "reps") as "reps" | "time",
            scope: "system" as const
        }));
        return [...builtIns, ...globalExercises];
    }, [globalExercises]);

    const muscles = useMemo(() => 
        Array.from(new Set(adminLibrary.map(e => {
            const m = e.muscle.trim();
            return m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
        }))).sort()
    , [adminLibrary]);

    const filteredExercises = useMemo(() => {
        const query = search.toLowerCase();
        return adminLibrary.filter(e => {
            const m = e.muscle.toLowerCase();
            const n = e.name.toLowerCase();
            return n.includes(query) || m.includes(query);
        });
    }, [adminLibrary, search]);

    const groupedExercises = useMemo(() => {
        const groups: Record<string, typeof adminLibrary> = {};
        filteredExercises.forEach(ex => {
            const m = ex.muscle.trim();
            const normalizedMuscle = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
            if (!groups[normalizedMuscle]) groups[normalizedMuscle] = [];
            groups[normalizedMuscle].push(ex);
        });
        return groups;
    }, [filteredExercises]);

    return (
        <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col safe-area-inset">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center gap-4 bg-zinc-950 sticky top-0 z-50">
                <button 
                    onClick={onBack} 
                    className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        autoFocus
                        placeholder="Search system & global exercises..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-red-500/50 border border-white/5 transition-colors placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
                <div className="space-y-8 max-w-3xl mx-auto">
                    {muscles.map(muscle => {
                        const exs = groupedExercises[muscle];
                        if (!exs || exs.length === 0) return null;

                        return (
                            <div key={muscle} className="space-y-3">
                                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest px-1">{muscle}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {exs.map(ex => (
                                        <button
                                            key={ex.id}
                                            onClick={() => onSelect(ex)}
                                            className="bg-zinc-900 border border-transparent hover:border-red-500/30 p-4 rounded-2xl flex justify-between items-center text-left group transition-all shrink-0 w-full"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-red-400 transition-colors">
                                                    <Dumbbell size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white tracking-tight">{ex.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 border border-white/5 py-0.5 px-2 rounded-md">
                                                            {ex.trackingType || 'reps'}
                                                        </span>
                                                        {ex.scope === 'global' && (
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-red-400 border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                Global
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {filteredExercises.length === 0 && (
                        <div className="text-center py-20 text-zinc-500">
                            No exercises found matching "{search}".
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
