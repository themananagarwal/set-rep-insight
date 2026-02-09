import { useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { Plus, Calendar, Dumbbell, Trash2, Edit } from "lucide-react";

export default function WorkoutManager() {
    const navigate = useNavigate();
    const { routines, deleteRoutine } = useTrainerStore();

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this plan?")) {
            deleteRoutine(id);
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
                                        onClick={(e) => handleDelete(e, routine.id)}
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

            <button
                onClick={() => navigate("/workout/builder/new")}
                className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform z-50"
            >
                <Plus size={28} />
            </button>
        </div>
    );
}
