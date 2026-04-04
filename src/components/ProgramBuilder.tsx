import { useState, useMemo } from 'react';
import { ArrowLeft, Save, Trash2, Dumbbell, X, Plus, GripVertical } from 'lucide-react';
import type { TrainerRoutine, WorkoutDay } from '../lib/types';
import { useMockBackendStore } from '../lib/mockBackend';
import { useTrainerStore } from '../lib/store';
import ExercisePicker from './ExercisePicker';

type Props = {
    routine: TrainerRoutine;
    onClose: () => void;
};

export function ProgramBuilder({ routine: initialRoutine, onClose }: Props) {
    const updateTrainerRoutine = useMockBackendStore(state => state.updateTrainerRoutine);
    const globalExercises = useMockBackendStore(state => state.globalExercises);
    const { exercises: clientExercises } = useTrainerStore();

    // Local state for editing the routine
    const [routine, setRoutine] = useState<TrainerRoutine>(initialRoutine);
    const [showPickerForDay, setShowPickerForDay] = useState<string | null>(null);
    const [dayToDelete, setDayToDelete] = useState<string | null>(null);

    // Provide the combined library to display exercise full names
    const adminLibrary = useMemo(() => {
        const sys = clientExercises.map(e => ({ ...e, scope: e.scope || 'system' as const }));
        return [...sys, ...globalExercises];
    }, [clientExercises, globalExercises]);

    const handleSave = () => {
        updateTrainerRoutine(routine.id, {
            name: routine.name,
            description: routine.description,
            days: routine.days
        });
        onClose();
    };

    const addDay = () => {
        setRoutine(r => ({
            ...r,
            days: [...r.days, { id: crypto.randomUUID(), name: `Day ${r.days.length + 1}`, exercises: [] }]
        }));
    };

    const removeDay = () => {
        if (!dayToDelete) return;
        setRoutine(r => ({ ...r, days: r.days.filter(d => d.id !== dayToDelete) }));
        setDayToDelete(null);
    };

    const updateDayName = (dayId: string, name: string) => {
        setRoutine(r => ({
            ...r,
            days: r.days.map(d => d.id === dayId ? { ...d, name } : d)
        }));
    };

    const removeExercise = (dayId: string, exIndex: number) => {
        setRoutine(r => ({
            ...r,
            days: r.days.map(d => {
                if (d.id !== dayId) return d;
                const newEx = [...d.exercises];
                newEx.splice(exIndex, 1);
                return { ...d, exercises: newEx };
            })
        }));
    };

    const addSet = (dayId: string, exIndex: number) => {
        setRoutine(r => ({
            ...r,
            days: r.days.map(d => {
                if (d.id !== dayId) return d;
                const newEx = [...d.exercises];
                const sets = newEx[exIndex].sets;
                const lastSet = sets.length > 0 ? sets[sets.length - 1] : { type: 'working' as const, reps: '10' };
                newEx[exIndex].sets = [...sets, { ...lastSet, id: crypto.randomUUID() }];
                return { ...d, exercises: newEx };
            })
        }));
    };

    const removeSet = (dayId: string, exIndex: number, setIndex: number) => {
        setRoutine(r => ({
            ...r,
            days: r.days.map(d => {
                if (d.id !== dayId) return d;
                const newEx = [...d.exercises];
                newEx[exIndex].sets = newEx[exIndex].sets.filter((_, i) => i !== setIndex);
                return { ...d, exercises: newEx };
            })
        }));
    };

    const updateSet = (dayId: string, exIndex: number, setIndex: number, key: 'weight' | 'reps' | 'duration', val: string) => {
        setRoutine(r => ({
            ...r,
            days: r.days.map(d => {
                if (d.id !== dayId) return d;
                const newEx = [...d.exercises];
                const numericVal = val === '' ? undefined : Number(val);
                newEx[exIndex].sets[setIndex] = { ...newEx[exIndex].sets[setIndex], [key]: numericVal };
                return { ...d, exercises: newEx };
            })
        }));
    };

    return (
        <div className="space-y-6 relative pb-20">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button onClick={onClose} className="mt-1 p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <input 
                        value={routine.name}
                        onChange={e => setRoutine(r => ({ ...r, name: e.target.value }))}
                        className="text-4xl font-bold bg-transparent border-none outline-none focus:ring-0 p-0 text-white w-full placeholder:text-zinc-700"
                        placeholder="Program Name"
                    />
                    <input 
                        value={routine.description || ''}
                        onChange={e => setRoutine(r => ({ ...r, description: e.target.value }))}
                        placeholder="Write a description for this program..."
                        className="text-zinc-400 bg-transparent border-none outline-none focus:ring-0 p-0 w-full mt-2 text-lg placeholder:text-zinc-700"
                    />
                </div>
            </div>

            {/* Days list */}
            <div className="space-y-6 mt-8">
                {routine.days.map((day) => (
                    <div key={day.id} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                        <div className="bg-black/40 border-b border-white/5 p-4 flex items-center justify-between">
                            <input 
                                value={day.name}
                                onChange={e => updateDayName(day.id, e.target.value)}
                                className="font-bold text-lg text-white bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-zinc-600 w-full"
                                placeholder="E.g., Pull Day"
                            />
                            <button 
                                onClick={() => setDayToDelete(day.id)}
                                className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors ml-4"
                            ><Trash2 size={18} /></button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            {day.exercises.map((p, exIndex) => {
                                const exDef = adminLibrary.find(e => e.id === p.exerciseId);
                                const isTime = exDef?.trackingType === 'time';
                                return (
                                    <div key={`${day.id}-${exIndex}`} className="flex flex-col p-4 bg-black/20 border border-white/5 rounded-xl group relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400"><Dumbbell size={18}/></div>
                                                <span className="font-bold text-white text-lg">{exDef?.name || "Unknown Exercise"}</span>
                                            </div>
                                            <button 
                                                onClick={() => removeExercise(day.id, exIndex)}
                                                className="text-red-400/50 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                            ><X size={18} /></button>
                                        </div>
                                        
                                        {/* Sets Table Header */}
                                        <div className="grid grid-cols-[30px_1fr_1fr_40px] gap-3 items-center text-xs font-bold tracking-wider text-zinc-500 px-2 mt-2 mb-2">
                                            <span className="text-center">SET</span>
                                            <span>WEIGHT</span>
                                            <span>{isTime ? 'DURATION (s)' : 'REPS'}</span>
                                            <span></span>
                                        </div>
                                        
                                        {/* Sets Rows */}
                                        <div className="space-y-2">
                                            {p.sets.map((set, setIndex) => (
                                                <div key={setIndex} className="grid grid-cols-[30px_1fr_1fr_40px] gap-3 items-center group/set">
                                                    <span className="text-xs font-bold text-center text-zinc-400">{setIndex + 1}</span>
                                                    <input 
                                                        type="number" value={set.weight ?? ''} placeholder="0"
                                                        onChange={e => updateSet(day.id, exIndex, setIndex, 'weight', e.target.value)}
                                                        className="bg-zinc-800 border border-transparent hover:border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                                                    />
                                                    <input 
                                                        type="number" value={(isTime ? set.duration : set.reps) ?? ''} placeholder="0"
                                                        onChange={e => updateSet(day.id, exIndex, setIndex, isTime ? 'duration' : 'reps', e.target.value)}
                                                        className="bg-zinc-800 border border-transparent hover:border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                                                    />
                                                    <div className="flex justify-end">
                                                        <button 
                                                            onClick={() => removeSet(day.id, exIndex, setIndex)}
                                                            className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover/set:opacity-100 transition-all focus:opacity-100"
                                                            title="Remove set"
                                                        ><X size={16}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <button 
                                            onClick={() => addSet(day.id, exIndex)}
                                            className="text-sm font-bold text-red-500 mt-4 hover:text-red-400 hover:bg-red-500/10 w-fit px-3 py-1.5 rounded-lg transition-colors"
                                        >+ Add Set</button>
                                    </div>
                                );
                            })}
                            <button 
                                onClick={() => setShowPickerForDay(day.id)}
                                className="w-full py-5 border-2 border-dashed border-white/10 hover:border-red-500/30 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 font-bold flex items-center justify-center gap-2 transition-all"
                            ><Plus size={20} /> Add Exercise</button>
                        </div>
                    </div>
                ))}
                
                <button 
                    onClick={addDay}
                    className="w-full py-6 border-2 border-dashed border-zinc-800 hover:border-red-500/50 hover:bg-zinc-900 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                ><Plus size={22} /> Add Workout Day</button>
            </div>

            {/* Bottom Actions Bar */}
            <div className="fixed bottom-0 left-64 right-0 p-6 bg-gradient-to-t from-black via-zinc-950 to-transparent pointer-events-none flex justify-end z-10">
                <button 
                    onClick={handleSave}
                    className="pointer-events-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                ><Save size={20} /> Save Program</button>
            </div>

            {/* Exercise Picker Modal */}
            {showPickerForDay && (
                <div className="fixed inset-0 z-[100]">
                    <ExercisePicker 
                        onSelect={(ex: any) => {
                            setRoutine(r => {
                                const isTime = ex.trackingType === 'time';
                                const newExercise = {
                                    exerciseId: ex.id,
                                    targetSets: 3,
                                    targetReps: isTime ? 0 : 10,
                                    sets: [
                                        { id: crypto.randomUUID(), type: 'working' as const, reps: isTime ? '0' : '10', duration: isTime ? 60 : undefined },
                                    ]
                                };
                                return {
                                    ...r,
                                    days: r.days.map(d => 
                                        d.id === showPickerForDay 
                                            ? { ...d, exercises: [...d.exercises, newExercise] }
                                            : d
                                    )
                                };
                            });
                            setShowPickerForDay(null);
                        }}
                        onBack={() => setShowPickerForDay(null)}
                    />
                </div>
            )}

            {/* In-App Delete Confirmation Modal */}
            {dayToDelete && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Workout Day?</h3>
                        <p className="text-zinc-400 text-sm mb-6">Are you sure you want to remove this day? All exercises and sets inside it will be lost.</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={removeDay}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold transition-colors"
                            >Delete</button>
                            <button 
                                onClick={() => setDayToDelete(null)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl font-bold transition-colors"
                            >Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
