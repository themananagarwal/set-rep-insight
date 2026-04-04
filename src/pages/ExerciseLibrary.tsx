import { useState, useMemo } from "react";
import { useTrainerStore } from "../lib/store";
import { useMockBackendStore } from "../lib/mockBackend";
import { EXERCISE_LIBRARY } from "../lib/exercises";
import { Dumbbell, Search, Edit2, Trash2, Plus, Clock, Target, MoreVertical, Globe } from "lucide-react";
import clsx from "clsx";

export default function ExerciseLibrary() {
    const { exercises, addExercise, updateExerciseDef, deleteExerciseDef } = useTrainerStore();
    const globalExercises = useMockBackendStore(state => state.globalExercises);
    const [search, setSearch] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Merge: system/private exercises + global admin exercises (dedup by ID)
    const allExercises = useMemo(() => {
        const ids = new Set(exercises.map(e => e.id));
        const merged = [...exercises];
        globalExercises.forEach(g => {
            if (!ids.has(g.id)) merged.push({ ...g, scope: 'global' as const });
        });
        return merged;
    }, [exercises, globalExercises]);

    // Form State
    const [newName, setNewName] = useState("");
    const [newMuscle, setNewMuscle] = useState("");
    const [newType, setNewType] = useState<"reps" | "time">("reps");

    const muscles = useMemo(() => 
        Array.from(new Set(allExercises.map(e => {
            const m = e.muscle.trim();
            return m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
        }))).sort()
    , [allExercises]);

    const filteredExercises = useMemo(() => {
        const query = search.toLowerCase();
        return allExercises.filter(e => 
            e.name.toLowerCase().includes(query) || 
            e.muscle.toLowerCase().includes(query)
        );
    }, [allExercises, search]);

    const groupedExercises = useMemo(() => {
        const groups: Record<string, typeof allExercises> = {};
        filteredExercises.forEach(ex => {
            const m = ex.muscle.trim();
            const normalizedMuscle = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
            if (!groups[normalizedMuscle]) groups[normalizedMuscle] = [];
            groups[normalizedMuscle].push(ex);
        });
        return groups;
    }, [filteredExercises]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newMuscle) return;

        if (editingId) {
            updateExerciseDef(editingId, newName, newMuscle, newType);
            setEditingId(null);
        } else {
            addExercise(newName, newMuscle, newType);
        }
        
        setIsCreating(false);
        setNewName("");
        setNewMuscle("");
        setNewType("reps");
    };

    const startEdit = (ex: any) => {
        setEditingId(ex.id);
        setNewName(ex.name);
        setNewMuscle(ex.muscle);
        setNewType(ex.trackingType);
        setIsCreating(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this custom exercise?")) {
            deleteExerciseDef(id);
        }
    };

    return (
        <div className="pt-6 pb-24 space-y-6">
            <header className="flex justify-between items-center px-1">
                <h1 className="text-2xl font-bold">Library</h1>
                <button 
                    onClick={() => {
                        setEditingId(null);
                        setNewName("");
                        setNewMuscle("");
                        setNewType("reps");
                        setIsCreating(true);
                    }}
                    className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={20} />
                </button>
            </header>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                    placeholder="Search exercises..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-surface border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-1 ring-primary outline-none transition-all"
                />
            </div>

            <div className="space-y-8">
                {Object.keys(groupedExercises).sort().map(muscle => (
                    <div key={muscle} className="space-y-3">
                        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-1">{muscle}</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {groupedExercises[muscle].map(ex => {
                                const isCustom = !EXERCISE_LIBRARY[ex.id] && ex.scope !== 'global';
                                const isGlobal = ex.scope === 'global';
                                return (
                                    <div key={ex.id} className="bg-surface border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                                                <Dumbbell size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white tracking-tight">{ex.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-text-muted border border-white/10 px-1.5 py-0.5 rounded">
                                                        {ex.trackingType || 'reps'}
                                                    </span>
                                                    {isGlobal && (
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-red-400 border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <Globe size={8} /> Global
                                                        </span>
                                                    )}
                                                    {isCustom && (
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                                                            Custom
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isGlobal ? (
                                                <span className="text-[9px] text-zinc-600 uppercase tracking-widest pr-1">Admin Added</span>
                                            ) : isCustom ? (
                                                <>
                                                    <button 
                                                        onClick={() => startEdit(ex)}
                                                        className="p-2 text-text-muted hover:text-primary hover:bg-white/5 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(ex.id)}
                                                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>
                                        {/* Mobile view */}
                                        <div className="lg:hidden">
                                            {isCustom ? (
                                                <button onClick={() => startEdit(ex)} className="p-2 text-text-muted"><MoreVertical size={18} /></button>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for Creating/Editing */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in">
                    <form 
                        onSubmit={handleSubmit}
                        className="bg-surface border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                    >
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">{editingId ? "Edit Exercise" : "New Exercise"}</h2>
                                <button type="button" onClick={() => setIsCreating(false)} className="text-text-muted hover:text-white transition-colors">
                                    <Plus className="rotate-45" size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Exercise Name</label>
                                    <input
                                        autoFocus
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full bg-secondary border border-transparent focus:border-primary/50 rounded-2xl py-3 px-4 outline-none transition-all"
                                        placeholder="E.g. Decline Bench Press"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Muscle Group</label>
                                    <select
                                        value={newMuscle}
                                        onChange={(e) => setNewMuscle(e.target.value)}
                                        className="w-full bg-secondary border border-transparent focus:border-primary/50 rounded-2xl py-3 px-4 outline-none transition-all appearance-none"
                                        required
                                    >
                                        <option value="">Select Area...</option>
                                        {muscles.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Tracking Style</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewType("reps")}
                                            className={clsx(
                                                "py-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all",
                                                newType === "reps" ? "bg-primary/10 border-primary text-primary" : "bg-black/20 border-white/5 text-text-muted"
                                            )}
                                        >
                                            <Target size={20} />
                                            <span className="font-bold text-[10px] uppercase tracking-wider">Reps Mode</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewType("time")}
                                            className={clsx(
                                                "py-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all",
                                                newType === "time" ? "bg-primary/10 border-primary text-primary" : "bg-black/20 border-white/5 text-text-muted"
                                            )}
                                        >
                                            <Clock size={20} />
                                            <span className="font-bold text-[10px] uppercase tracking-wider">Time Mode</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-white text-black font-bold rounded-2xl shadow-xl shadow-white/5 active:scale-[0.98] transition-all"
                            >
                                {editingId ? "Save Changes" : "Create Exercise"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
