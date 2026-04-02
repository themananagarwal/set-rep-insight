import { useState, useMemo } from "react";
import { useTrainerStore } from "../lib/store";
import { Dumbbell, Plus, Search, ChevronRight, ArrowLeft, Clock, Zap, Target } from "lucide-react";
import { generateID } from "../lib/utils";
import clsx from "clsx";

interface ExercisePickerProps {
    onSelect: (exerciseId: string) => void;
    onBack: () => void;
}

export default function ExercisePicker({ onSelect, onBack }: ExercisePickerProps) {
    const { exercises, addExercise } = useTrainerStore();
    const [search, setSearch] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    
    // New Exercise Form State
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<"compound" | "isolation">("isolation");
    const [newMuscle, setNewMuscle] = useState("");

    const muscles = useMemo(() => 
        Array.from(new Set(exercises.map(e => e.muscle))).sort()
    , [exercises]);

    const filteredExercises = useMemo(() => {
        const query = search.toLowerCase();
        return exercises.filter(e => 
            e.name.toLowerCase().includes(query) || 
            e.muscle.toLowerCase().includes(query)
        );
    }, [exercises, search]);

    const groupedExercises = useMemo(() => {
        const groups: Record<string, typeof exercises> = {};
        filteredExercises.forEach(ex => {
            if (!groups[ex.muscle]) groups[ex.muscle] = [];
            groups[ex.muscle].push(ex);
        });
        return groups;
    }, [filteredExercises]);

    const handleCreateExercise = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newMuscle) return;

        addExercise(newName, newMuscle);
        
        // The ID generation in store is name.toLowerCase().replace(/\s/g, '_')
        const generatedId = newName.toLowerCase().replace(/\s/g, '_');
        onSelect(generatedId);
    };

    if (isCreating) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/5 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold">New Exercise</h2>
                </div>

                <form onSubmit={handleCreateExercise} className="space-y-6 bg-surface border border-white/5 p-6 rounded-2xl">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Exercise Name</label>
                        <input
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="e.g. Bulgarian Split Squat"
                            className="w-full bg-secondary border border-white/5 rounded-xl py-4 px-4 text-white focus:outline-none focus:ring-2 ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Target Area</label>
                            <select
                                value={newMuscle}
                                onChange={e => setNewMuscle(e.target.value)}
                                className="w-full bg-secondary border border-white/5 rounded-xl py-4 px-4 text-white focus:outline-none"
                                required
                            >
                                <option value="">Select Area...</option>
                                {muscles.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Structure</label>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setNewType("isolation")}
                                    className={clsx(
                                        "py-4 px-4 rounded-xl border flex items-center gap-2 transition-all",
                                        newType === "isolation" ? "bg-primary/10 border-primary text-primary" : "bg-black/20 border-white/5 text-text-muted"
                                    )}
                                >
                                    <Target size={16} />
                                    <span className="font-bold text-sm">Reps Based</span>
                                </button>
                                {/* Time based logic placeholder as per types.ts */}
                                <button
                                    type="button"
                                    onClick={() => setNewType("compound")}
                                    className={clsx(
                                        "py-4 px-4 rounded-xl border flex items-center gap-2 transition-all opacity-50 cursor-not-allowed",
                                        newType === "compound" ? "bg-primary/10 border-primary text-primary" : "bg-black/20 border-white/5 text-text-muted"
                                    )}
                                    title="Time-based coming soon"
                                >
                                    <Clock size={16} />
                                    <span className="font-bold text-sm">Time Based</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-white text-black font-bold rounded-xl shadow-lg hover:shadow-white/5 hover:translate-y-[-1px] active:translate-y-0 transition-all mt-4"
                    >
                        Create & Add Exercise
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-background/80 backdrop-blur-md">
                <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-text-muted">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        placeholder="Search exercises or areas..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-secondary rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 ring-primary/20"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {muscles.map(muscle => {
                    const group = groupedExercises[muscle];
                    if (!group) return null;

                    return (
                        <div key={muscle} className="space-y-4">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">
                                {muscle}
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {group.map(ex => (
                                    <button
                                        key={ex.id}
                                        onClick={() => onSelect(ex.id)}
                                        className="flex items-center justify-between p-4 bg-surface border border-white/5 rounded-xl hover:bg-white/5 active:scale-[0.98] transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-text-muted group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                <Dumbbell size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-white text-sm">{ex.name}</p>
                                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">
                                                    {ex.type}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-white/10 group-hover:text-white transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {filteredExercises.length === 0 && (
                    <div className="text-center py-12 space-y-4">
                        <Zap size={40} className="mx-auto text-white/5" />
                        <p className="text-text-muted text-sm">No exercises found matching "{search}"</p>
                    </div>
                )}
            </div>

            {/* Create Bar */}
            <div className="p-6 bg-background border-t border-white/5">
                <button
                    onClick={() => setIsCreating(true)}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-bold flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Can't find it? Create Exercise
                </button>
            </div>
        </div>
    );
}
