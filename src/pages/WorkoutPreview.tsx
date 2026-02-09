import { useParams, useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import { Play, Calendar, ChevronLeft, Dumbbell, Clock } from "lucide-react";
import clsx from "clsx";

export default function WorkoutPreview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { routines, setActiveRoutine } = useTrainerStore();

    const routine = routines.find(r => r.id === id);

    if (!routine) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-bold text-red-500">Routine Not Found</h2>
                <button onClick={() => navigate("/workouts")} className="btn btn-secondary mt-4">
                    Back to Workouts
                </button>
            </div>
        );
    }

    const currentDay = routine.days[routine.currentDayIndex || 0];
    const totalExercises = currentDay?.exercises.length || 0;
    const estimatedTime = totalExercises * 5 + 10; // Rough estimate: 5 mins per exercise + 10 warmpup

    const handleActivate = () => {
        setActiveRoutine(routine.id);
        navigate("/workout/active");
    };

    return (
        <div className="min-h-screen pb-24 relative">
            {/* Header Image / Pattern */}
            <div className="h-64 bg-gradient-to-b from-primary/20 to-background flex flex-col justify-end p-6 relative">
                <button
                    onClick={() => navigate("/workouts")}
                    className="absolute top-6 left-4 p-2 bg-black/20 backdrop-blur rounded-full text-white hover:bg-white/10"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="z-10">
                    <h1 className="text-3xl font-bold text-white mb-2">{routine.name}</h1>
                    <p className="text-text-muted text-sm line-clamp-2">{routine.rationale}</p>
                </div>
            </div>

            <div className="p-6 space-y-6 -mt-6 bg-background rounded-t-3xl relative z-20">
                {/* Stats Row */}
                <div className="flex gap-4 overflow-x-auto pb-2">
                    <div className="bg-surface border border-white/5 p-3 rounded-xl min-w-[100px] flex-1">
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Calendar size={16} />
                            <span className="text-xs font-bold uppercase">Schedule</span>
                        </div>
                        <p className="font-bold">{routine.days.length} Days / Wk</p>
                    </div>
                    <div className="bg-surface border border-white/5 p-3 rounded-xl min-w-[100px] flex-1">
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Clock size={16} />
                            <span className="text-xs font-bold uppercase">Duration</span>
                        </div>
                        <p className="font-bold">~{estimatedTime} Min</p>
                    </div>
                </div>

                {/* Day Preview */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Today's Session</h2>
                        <span className="text-sm text-primary font-bold">{currentDay?.name}</span>
                    </div>

                    <div className="space-y-3">
                        {currentDay?.exercises.map((ex, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl border border-white/5">
                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-muted">
                                    <Dumbbell size={18} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold capitalize">{ex.exerciseId.replace(/_/g, " ")}</h3>
                                    <p className="text-xs text-text-muted">
                                        {ex.sets.length} Sets • {ex.targetReps || "8-12"} Reps
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!currentDay || currentDay.exercises.length === 0) && (
                            <p className="text-text-muted text-center py-4">Rest Day or No Exercises Scheduled</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            {/* Floating Action Button */}
            <div className="fixed bottom-20 left-0 w-full px-6 z-40 pointer-events-none">
                <button
                    onClick={handleActivate}
                    className="btn btn-primary w-full py-3 text-base font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 pointer-events-auto rounded-2xl"
                >
                    <Play size={20} fill="currentColor" /> Start Workout
                </button>
            </div>
        </div>
    );
}
