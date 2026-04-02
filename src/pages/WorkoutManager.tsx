import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { Plus, Calendar, Dumbbell, Trash2, Edit, Zap, ChevronRight } from "lucide-react";

export default function WorkoutManager() {
    const navigate = useNavigate();
    const { routines, deleteRoutine, startOnTheGo } = useTrainerStore();
    const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteCandidateId(id);
    };

    const confirmDelete = () => {
        if (deleteCandidateId) {
            deleteRoutine(deleteCandidateId);
            setDeleteCandidateId(null);
        }
    };

    return (
        <div className="pt-6 pb-24 space-y-6">
            <h1 className="text-2xl font-bold">My Plans</h1>

            {routines.length === 0 ? (
                <div className="text-center py-12 card border-dashed border-2 bg-transparent space-y-4">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-text-muted">
                        <Dumbbell size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">No Plans Yet</h3>
                        <p className="text-text-muted text-sm">Create your first custom workout routine.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {routines.map(routine => (
                        <div
                            key={routine.id}
                            onClick={() => {
                                // Navigate to Preview first
                                navigate(`/workout/preview/${routine.id}`);
                            }}
                            className="bg-surface border border-secondary p-4 rounded-2xl active:scale-[0.98] transition-transform relative group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg">{routine.name}</h3>
                                    <p className="text-xs text-text-muted line-clamp-1">{routine.description || routine.rationale}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/workout/builder/${routine.id}`);
                                        }}
                                        className="p-2 bg-secondary hover:bg-white/10 rounded-full text-text-muted hover:text-primary transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, routine.id)}
                                        className="p-2 bg-secondary hover:bg-red-500/20 rounded-full text-text-muted hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 text-xs text-text-muted">
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span>{routine.days.length} Days</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Dumbbell size={14} />
                                    <span>{routine.days.reduce((acc, d) => acc + d.exercises.length, 0)} Exercises</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* On The Go Entry - Positioned below routines but distinct */}
            <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Zap size={14} className="text-amber-400" />
                    <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Live Training</h2>
                </div>
                
                <button
                    onClick={() => {
                        startOnTheGo();
                        navigate("/workout/active?intro=true");
                    }}
                    className="w-full group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent hover:from-primary/30 transition-all p-[1px]"
                >
                    <div className="bg-surface rounded-[23px] p-6 flex items-center justify-between relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.05] transition-all duration-700">
                            <Zap size={120} fill="white" />
                        </div>
                        
                        <div className="flex gap-5 items-center relative z-10">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all">
                                <Zap size={28} fill="currentColor" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-black text-xl text-white tracking-tight">On The Go</h3>
                                <p className="text-xs text-text-muted font-medium">Flash session. No plan needed.</p>
                            </div>
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </button>
            </div>

            <button
                onClick={() => navigate("/workout/builder/new")}
                className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform z-50"
            >
                <Plus size={28} />
            </button>

            {/* Delete Confirmation Modal */}
            {deleteCandidateId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-surface border border-white/10 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-xl font-bold">Delete Plan?</h3>
                            <p className="text-sm text-text-muted">
                                This action cannot be undone. The workout plan will be permanently removed.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setDeleteCandidateId(null)}
                                className="flex-1 py-3 rounded-xl font-bold bg-secondary hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
