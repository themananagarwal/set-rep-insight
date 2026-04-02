import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrainerStore } from "../lib/store";
import type { Routine, WorkoutExercisePattern, TargetSet } from "../lib/types";
import { Save, Plus, Trash2, ChevronDown, Copy, Dumbbell, Clock, Search } from "lucide-react";
import { generateID } from "../lib/utils";
import ExercisePicker from "../components/ExercisePicker";
import clsx from "clsx";

const DEFAULT_SET: TargetSet = {
    id: "new",
    type: "working",
    reps: "10",
    weight: "",
    rpe: "8"
};

export default function WorkoutBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { routines, exercises, addRoutine, updateRoutine } = useTrainerStore();

    // Local Draft State
    const [draft, setDraft] = useState<Routine>({
        id: id === "new" ? generateID() : "",
        name: "",
        rationale: "",
        description: "",
        days: [],
        currentDayIndex: 0,
        startDate: Date.now(),
        lastModified: Date.now()
    });

    const [activeDayId, setActiveDayId] = useState<string | null>(null);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    
    // UI Local State
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<{ dayId: string; exIndex?: number } | null>(null);

    // Initialize (Load existing or start fresh)
    useEffect(() => {
        if (id && id !== "new") {
            const existing = routines.find(r => r.id === id);
            if (existing) {
                setDraft(JSON.parse(JSON.stringify(existing))); // Deep copy
                setActiveDayId(existing.days[0]?.id || null);
            }
        } else if (id === "new") {
            // Default setup for new plan (Mon-Sun) (Mon-Sun)
            const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const newDays = daysOfWeek.map(dayName => ({
                id: generateID(),
                name: dayName,
                exercises: []
            }));

            setDraft(prev => ({
                ...prev,
                name: "My New Routine",
                days: newDays
            }));
            setActiveDayId(newDays[0].id);
        }
    }, [id, routines]);

    const handleSave = () => {
        if (!draft.name.trim()) return alert("Please name your workout plan.");
        if (draft.days.length === 0) return alert("Please add at least one workout day.");
        if (draft.days.every(d => d.exercises.length === 0)) return alert("Please add at least one exercise.");

        if (id === "new") {
            addRoutine(draft);
        } else {
            updateRoutine(draft.id, draft);
        }
        navigate("/workout");
    };

    // --- DAY MANAGEMENT ---
    // const addDay = () => {
    //     const newDay: WorkoutDay = {
    //         id: generateID(),
    //         name: `Day ${draft.days.length + 1}`,
    //         exercises: []
    //     };
    //     setDraft(prev => ({ ...prev, days: [...prev.days, newDay] }));
    //     setActiveDayId(newDay.id);
    // };

    // const updateDayName = (dayId: string, name: string) => {
    //     setDraft(prev => ({
    //         ...prev,
    //         days: prev.days.map(d => d.id === dayId ? { ...d, name } : d)
    //     }));
    // };

    // const deleteDay = (dayId: string) => {
    //     // ... (Logic removed as we fixed days, but keeping function structure if needed or removing it)
    //     // Since we removed the delete button, this is dead code, but let's effectively disable it or repurpose
    // };

    const handleCopyDay = (sourceDayId: string) => {
        const sourceDay = draft.days.find(d => d.id === sourceDayId);
        if (!sourceDay || !activeDayId) return;

        // Deep copy exercises
        const copiedExercises: WorkoutExercisePattern[] = sourceDay.exercises.map(ex => ({
            ...ex,
            sets: ex.sets.map(s => ({ ...s, id: generateID() })) // Regenerate Set IDs
        }));

        setDraft(prev => ({
            ...prev,
            days: prev.days.map(d => d.id === activeDayId ? { ...d, exercises: copiedExercises } : d)
        }));
        setIsCopyModalOpen(false);
    };

    // --- EXERCISE MANAGEMENT ---
    const openExercisePicker = (dayId: string, exIndex?: number) => {
        setPickerTarget({ dayId, exIndex });
        setPickerOpen(true);
    };

    const handlePickerSelect = (exerciseId: string) => {
        if (!pickerTarget) return;
        const { dayId, exIndex } = pickerTarget;

        if (exIndex === undefined) {
            // Adding fresh exercise
            const newPattern: WorkoutExercisePattern = {
                exerciseId: exerciseId,
                targetSets: 3,
                targetReps: 10,
                sets: [
                    { ...DEFAULT_SET, id: generateID() },
                    { ...DEFAULT_SET, id: generateID() },
                    { ...DEFAULT_SET, id: generateID() }
                ]
            };

            setDraft(prev => ({
                ...prev,
                days: prev.days.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, newPattern] } : d)
            }));
        } else {
            // Updating existing
            updateExercise(dayId, exIndex, 'exerciseId', exerciseId);
        }

        setPickerOpen(false);
        setPickerTarget(null);
    };

    const updateExercise = (dayId: string, exerciseIndex: number, field: keyof WorkoutExercisePattern, value: any) => {
        setDraft(prev => ({
            ...prev,
            days: prev.days.map(d => {
                if (d.id !== dayId) return d;
                const newExs = [...d.exercises];
                newExs[exerciseIndex] = { ...newExs[exerciseIndex], [field]: value };
                return { ...d, exercises: newExs };
            })
        }));
    };

    const deleteExercise = (dayId: string, exerciseIndex: number) => {
        setDraft(prev => ({
            ...prev,
            days: prev.days.map(d => {
                if (d.id !== dayId) return d;
                return { ...d, exercises: d.exercises.filter((_, i) => i !== exerciseIndex) };
            })
        }));
    };

    // --- SET MANAGEMENT ---
    const updateSet = (dayId: string, exerciseIndex: number, setIndex: number, field: keyof TargetSet, value: any) => {
        setDraft(prev => ({
            ...prev,
            days: prev.days.map(d => {
                if (d.id !== dayId) return d;
                const newExs = [...d.exercises];
                const newSets = [...newExs[exerciseIndex].sets];
                newSets[setIndex] = { ...newSets[setIndex], [field]: value };
                newExs[exerciseIndex] = { ...newExs[exerciseIndex], sets: newSets };
                return { ...d, exercises: newExs };
            })
        }));
    };

    const addSet = (dayId: string, exerciseIndex: number) => {
        setDraft(prev => ({
            ...prev,
            days: prev.days.map(d => {
                if (d.id !== dayId) return d;
                const newExs = [...d.exercises];
                newExs[exerciseIndex] = {
                    ...newExs[exerciseIndex],
                    sets: [...newExs[exerciseIndex].sets, { ...DEFAULT_SET, id: generateID() }]
                };
                return { ...d, exercises: newExs };
            })
        }));
    };

    const removeSet = (dayId: string, exerciseIndex: number, setIndex: number) => {
        setDraft(prev => ({
            ...prev,
            days: prev.days.map(d => {
                if (d.id !== dayId) return d;
                const newExs = [...d.exercises];
                newExs[exerciseIndex] = {
                    ...newExs[exerciseIndex],
                    // Don't modify targetSets/Reps here as they are deprecated, we rely on sets.length
                    sets: newExs[exerciseIndex].sets.filter((_, i) => i !== setIndex)
                };
                return { ...d, exercises: newExs };
            })
        }));
    };


    const currentDay = draft.days.find(d => d.id === activeDayId);

    return (
        <div className="pt-4 pb-24 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md py-2 z-40 border-b border-white/5">
                <input
                    value={draft.name}
                    onChange={(e) => setDraft(p => ({ ...p, name: e.target.value }))}
                    placeholder="Routine Name (e.g. Strength Phase 1)"
                    className="bg-transparent text-xl font-bold w-full focus:outline-none placeholder:text-text-muted/50"
                />
                <button
                    onClick={handleSave}
                    className="btn btn-sm bg-primary text-white"
                >
                    <Save size={16} className="mr-2" /> Finish
                </button>
            </div>

            {isCopyModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 p-6 rounded-2xl w-full max-w-sm space-y-4">
                        <h3 className="text-lg font-bold">Copy Workout From...</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {draft.days.filter(d => d.id !== activeDayId).map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => handleCopyDay(d.id)}
                                    className="p-3 bg-secondary rounded-xl text-left hover:bg-white/10 flex justify-between items-center"
                                >
                                    <span className="font-medium">{d.name}</span>
                                    <span className="text-xs text-text-muted">{d.exercises.length} exercises</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsCopyModalOpen(false)}
                            className="w-full py-3 text-text-muted hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Day Selector (Horizontal Scroll) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {draft.days.map(day => (
                    <button
                        key={day.id}
                        onClick={() => setActiveDayId(day.id)}
                        className={clsx(
                            "px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold border transition-colors min-w-[80px]",
                            activeDayId === day.id
                                ? "bg-white text-background border-white"
                                : "bg-secondary text-text-muted border-transparent hover:bg-white/10"
                        )}
                    >
                        {day.name.slice(0, 3)}
                    </button>
                ))}
            </div>

            {/* Active Day Editor */}
            {currentDay ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h2 className="text-2xl font-bold">{currentDay.name}</h2>
                        <button
                            onClick={() => setIsCopyModalOpen(true)}
                            className="bg-secondary p-2 rounded-lg text-xs font-bold text-primary flex items-center gap-2 hover:bg-white/10 transition-colors"
                        >
                            <Copy size={16} /> Copy from...
                        </button>
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-4">
                        {currentDay.exercises.map((exPattern, exIndex) => {
                            const exerciseData = exercises.find(e => e.id === exPattern.exerciseId);
                            const isTimed = exerciseData?.trackingType === "time";

                            return (
                                <div key={exIndex} className="bg-surface border border-secondary p-4 rounded-xl relative group">
                                    {/* Exercise Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2 w-full pr-8">
                                            <button 
                                                onClick={() => openExercisePicker(currentDay.id, exIndex)}
                                                className="flex items-center gap-2 group/btn py-1"
                                            >
                                                <h3 className="font-bold text-lg text-white group-hover/btn:text-primary transition-colors">
                                                    {exerciseData?.name || "Select Exercise"}
                                                </h3>
                                                <Search size={16} className="text-text-muted group-hover/btn:text-primary transition-colors" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => deleteExercise(currentDay.id, exIndex)}
                                            className="text-text-muted hover:text-red-400 p-1 absolute top-4 right-4"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Sets Table or Cardio Message */}
                                    {isTimed ? (
                                        <div className="bg-secondary/30 rounded-lg p-4 text-center border border-white/5">
                                            <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm mb-1">
                                                <Clock size={16} />
                                                <span>Timed Mode</span>
                                            </div>
                                            <p className="text-xs text-text-muted">
                                                Duration and intervals will be configured during the workout.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-[30px_1fr_1fr_1fr_30px] gap-2 text-xs text-text-muted uppercase font-bold text-center mb-1">
                                                <span>#</span>
                                                <span>Reps</span>
                                                <span>kg</span>
                                                <span>RPE</span>
                                                <span></span>
                                            </div>
                                            {(exPattern.sets || []).map((set, setIndex) => (
                                                <div key={set.id || setIndex} className="grid grid-cols-[30px_1fr_1fr_1fr_30px] gap-2 items-center">
                                                    <span className="text-center text-xs text-text-muted font-mono">{setIndex + 1}</span>
                                                    <input
                                                        value={set.reps}
                                                        onChange={(e) => updateSet(currentDay.id, exIndex, setIndex, 'reps', e.target.value)}
                                                        className="bg-secondary rounded p-1 text-center text-sm font-bold focus:ring-1 ring-primary outline-none w-full min-w-0"
                                                        placeholder="10"
                                                    />
                                                    <input
                                                        value={set.weight || ""}
                                                        onChange={(e) => updateSet(currentDay.id, exIndex, setIndex, 'weight', e.target.value)}
                                                        className="bg-secondary rounded p-1 text-center text-sm focus:ring-1 ring-primary outline-none w-full min-w-0"
                                                        placeholder="-"
                                                    />
                                                    <input
                                                        value={set.rpe || ""}
                                                        onChange={(e) => updateSet(currentDay.id, exIndex, setIndex, 'rpe', e.target.value)}
                                                        className="bg-secondary rounded p-1 text-center text-sm focus:ring-1 ring-primary outline-none w-full min-w-0"
                                                        placeholder="8"
                                                    />
                                                    <button
                                                        onClick={() => removeSet(currentDay.id, exIndex, setIndex)}
                                                        className="text-text-muted hover:text-red-400 flex justify-center"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => addSet(currentDay.id, exIndex)}
                                                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg mt-2 transition-colors"
                                            >
                                                <Plus size={14} /> Add Set
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <button
                            onClick={() => openExercisePicker(currentDay.id)}
                            className="w-full py-4 border-2 border-dashed border-secondary rounded-xl text-text-muted hover:border-primary hover:text-primary transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                            <Dumbbell size={20} /> Add Exercise
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                    <p>Select or Add a Day to start editing.</p>
                </div>
            )}

            {pickerOpen && (
                <ExercisePicker 
                    onSelect={handlePickerSelect} 
                    onBack={() => setPickerOpen(false)} 
                />
            )}
        </div>
    );
}
