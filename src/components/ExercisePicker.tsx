import { useState, useMemo } from "react";
import { useTrainerStore } from "../lib/store";
import { EXERCISE_LIBRARY } from "../lib/exercises";
import { Dumbbell, Plus, Search, ChevronRight, ArrowLeft, Clock, Zap, Target, Edit2, Trash2 } from "lucide-react";
import clsx from "clsx";

interface ExercisePickerProps {
    onSelect: (exerciseId: string) => void;
    onBack: () => void;
}

export default function ExercisePicker({ onSelect, onBack }: ExercisePickerProps) {
    const { exercises, addExercise, updateExerciseDef, deleteExerciseDef } = useTrainerStore();
    const [search, setSearch] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<"compound" | "isolation">("isolation");
    const [newMuscle, setNewMuscle] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const muscles = useMemo(() => 
        Array.from(new Set(exercises.map(e => {
            const m = e.muscle.trim();
            return m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
        }))).sort()
    , [exercises]);

    const filteredExercises = useMemo(() => {
        const query = search.toLowerCase();
        return exercises.filter(e => {
            const m = e.muscle.toLowerCase();
            const n = e.name.toLowerCase();
            return n.includes(query) || m.includes(query);
        });
    }, [exercises, search]);

    const groupedExercises = useMemo(() => {
        const groups: Record<string, typeof exercises> = {};
        filteredExercises.forEach(ex => {
            const m = ex.muscle.trim();
            const normalizedMuscle = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
            if (!groups[normalizedMuscle]) groups[normalizedMuscle] = [];
            groups[normalizedMuscle].push(ex);
        });
        return groups;
    }, [filteredExercises]);

    const handleCreateExercise = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newMuscle) return;

        if (editingId) {
            updateExerciseDef(editingId, newName, newMuscle, newType === "compound" ? "time" : "reps");
            setEditingId(null);
        } else {
            const trackingType = newType === "compound" ? "time" : "reps";
            const generatedId = addExercise(newName, newMuscle, trackingType);
            onSelect(generatedId);
        }
        
        setIsCreating(false);
        setNewName("");
        setNewMuscle("");
    };

    const startEdit = (e: React.MouseEvent, ex: any) => {
        e.stopPropagation();
        setEditingId(ex.id);
        setNewName(ex.name);
        setNewMuscle(ex.muscle);
        setNewType(ex.trackingType === "time" ? "compound" : "isolation");
        setIsCreating(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Delete this custom exercise? It will stay in your current routines but be removed from the library.")) {
            deleteExerciseDef(id);
        }
    };

    return (
        <div className="fixed inset-0 bg-background z-[100] flex flex-col animate-in fade-in slide-in-from-bottom-4 safe-area-inset">
            {/* Header */}
            <div className="px-4 py-4 border-b border-white/5 flex items-center gap-3 bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <button 
                    onClick={onBack} 
                    className="p-2 hover:bg-white/5 rounded-full text-text-muted active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        autoFocus={!isCreating}
                        placeholder="Search exercises..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-secondary rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 ring-primary/20 border border-white/5"
                    />
                </div>
                <button
                    onClick={() => {
                        setNewName("");
                        setNewMuscle("");
                        setIsCreating(true);
                    }}
                    className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all border border-primary/20 flex-shrink-0"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {isCreating ? (
                    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-right-4 pb-32">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">{editingId ? "Edit Exercise" : "New Exercise"}</h2>
                            <button 
                                onClick={() => setIsCreating(false)}
                                className="text-xs font-bold text-text-muted hover:text-white uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleCreateExercise} className="space-y-6">
                            <div className="bg-surface border border-white/5 p-5 rounded-2xl space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Name</label>
                                <input
                                    autoFocus
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="e.g. Bulgarian Split Squat"
                                    className="w-full bg-transparent text-lg font-bold text-white focus:outline-none placeholder:text-white/10"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-surface border border-white/5 p-5 rounded-2xl space-y-1">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Muscle Group</label>
                                    <select
                                        value={newMuscle}
                                        onChange={e => setNewMuscle(e.target.value)}
                                        className="w-full bg-transparent text-lg font-bold text-white focus:outline-none appearance-none"
                                        required
                                    >
                                        <option value="" className="bg-zinc-900">Select Area...</option>
                                        {muscles.map(m => (
                                            <option key={m} value={m} className="bg-zinc-900">{m}</option>
                                        ))}
                                        <option value="Other" className="bg-zinc-900">Other</option>
                                    </select>
                                </div>
                                
                                <div className="bg-surface border border-white/5 p-5 rounded-2xl space-y-3">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Tracking Style</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewType("isolation")}
                                            className={clsx(
                                                "py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                                                newType === "isolation" ? "bg-primary/10 border-primary text-primary" : "bg-black/20 border-white/5 text-text-muted"
                                            )}
                                        >
                                            <Target size={18} />
                                            <span className="font-bold text-[10px] uppercase">Reps</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewType("compound")}
                                            className={clsx(
                                                "py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                                                newType === "compound" ? "bg-primary/10 border-primary text-primary" : "bg-black/20 border-white/5 text-text-muted"
                                            )}
                                        >
                                            <Clock size={18} />
                                            <span className="font-bold text-[10px] uppercase">Time</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-white text-black font-bold rounded-xl shadow-xl active:scale-[0.98] transition-all"
                            >
                                {editingId ? "Save Changes" : "Create & Add"}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="p-4 space-y-8 pb-32">
                        {muscles.map(muscle => {
                            const group = groupedExercises[muscle];
                            if (!group) return null;

                            return (
                                <div key={muscle} className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">
                                        {muscle}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {group.map(ex => (
                                            <div
                                                key={ex.id}
                                                className="flex items-center justify-between p-3.5 bg-surface border border-white/5 rounded-xl transition-all group"
                                            >
                                                <button 
                                                    onClick={() => onSelect(ex.id)}
                                                    className="flex-1 flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                                                        <Dumbbell size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm leading-tight">{ex.name}</p>
                                                        <p className="text-[9px] text-text-muted uppercase font-bold tracking-wider mt-0.5">
                                                            {ex.trackingType} mode
                                                        </p>
                                                    </div>
                                                </button>
                                                
                                                <div className="flex items-center gap-1 ml-2">
                                                    {!EXERCISE_LIBRARY[ex.id] && (
                                                        <div className="flex items-center gap-0.5 mr-1">
                                                            <button 
                                                                onClick={(e) => startEdit(e, ex)}
                                                                className="p-2.5 text-text-muted hover:text-primary transition-colors active:scale-90"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => handleDelete(e, ex.id)}
                                                                className="p-2.5 text-text-muted hover:text-red-500 transition-colors active:scale-90"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button onClick={() => onSelect(ex.id)} className="p-2 text-white/10 active:scale-90">
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredExercises.length === 0 && (
                            <div className="text-center py-20 space-y-4">
                                <Zap size={40} className="mx-auto text-white/5" />
                                <p className="text-text-muted text-sm px-10">No exercises found. Use the + button to create a new one.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
