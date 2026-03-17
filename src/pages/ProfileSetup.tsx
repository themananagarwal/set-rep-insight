import { useState, useEffect } from "react";
import type { UserProfile } from "../lib/types";
import { useTrainerStore } from "../lib/store";
import { calculateBMI, estimateBodyFat, getIdealWeight } from "../lib/generator";
import { ChevronRight, Activity, Ruler, Weight, User as UserIcon, Calculator, Target } from "lucide-react";

export default function ProfileSetup() {
    // const navigate = useNavigate();
    const { setUser } = useTrainerStore();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        name: "",
        gender: "male",
        weight: 0,
        height: 0,
        goal: "strength",
        activityLevel: "active",
        bloodwork: { lastUpdated: Date.now() },
        goalWeight: 0,
        bodyFat: 0
    });

    const [showEstimates, setShowEstimates] = useState(false);

    // Auto-calculate estimates when height/weight/gender changes
    useEffect(() => {
        if (formData.weight && formData.height && formData.gender && showEstimates) {
            const bmi = calculateBMI(formData.weight, formData.height);
            const bf = estimateBodyFat(bmi, formData.gender);
            const idealW = getIdealWeight(formData.height);

            setFormData(prev => ({
                ...prev,
                bodyFat: Number(bf.toFixed(1)),
                goalWeight: Number(idealW.toFixed(1))
            }));
        }
    }, [formData.weight, formData.height, formData.gender, showEstimates]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.weight || !formData.height) return;

        setUser(formData as UserProfile);
        
        // Force fully reload to let AuthContext read fully updated local storage profile values
        window.location.href = "/";
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const weightDifference = (formData.goalWeight || 0) - (formData.weight || 0);

    return (
        <div className="min-h-screen bg-background text-text flex flex-col justify-center p-6 relative overflow-hidden">
            <div className="max-w-md mx-auto w-full space-y-6 z-10">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        Setup Your AI Coach
                    </h1>
                    <p className="text-text-muted">
                        Step {step} of 2
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* Name & Gender */}
                            <div className="flex gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 ml-1">
                                        <UserIcon className="text-text-muted" size={16} />
                                        <label className="text-sm font-medium">Name</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="input w-full"
                                            placeholder="Your Name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 w-1/3">
                                    <label className="text-sm font-medium ml-1">Gender</label>
                                    <select
                                        className="input w-full appearance-none text-center"
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value as "male" | "female" })}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 ml-1">
                                        <Weight className="text-text-muted" size={16} />
                                        <label className="text-sm font-medium">Weight (kg)</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="input w-full"
                                            placeholder="0"
                                            value={formData.weight || ""}
                                            onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 ml-1">
                                        <Ruler className="text-text-muted" size={16} />
                                        <label className="text-sm font-medium">Height (cm)</label>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="input w-full"
                                            placeholder="0"
                                            value={formData.height || ""}
                                            onChange={e => setFormData({ ...formData, height: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Analysis / Estimates */}
                            <div className="bg-secondary/30 p-4 rounded-xl space-y-4 border border-white/5">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-sm">Targets & Composition</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowEstimates(!showEstimates)}
                                        className="text-primary text-xs font-bold flex items-center gap-1 hover:underline"
                                    >
                                        <Calculator size={12} /> {showEstimates ? "Enter Manually" : "Estimate for me"}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 ml-1">
                                            <Target className="text-text-muted" size={14} />
                                            <label className="text-xs font-medium text-text-muted">Goal Weight (kg)</label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="input w-full py-2 text-sm"
                                                placeholder={showEstimates ? "Calculating..." : "0"}
                                                value={formData.goalWeight || ""}
                                                onChange={e => setFormData({ ...formData, goalWeight: Number(e.target.value) })}
                                                disabled={showEstimates}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 ml-1">
                                            <Activity className="text-text-muted" size={14} />
                                            <label className="text-xs font-medium text-text-muted">Body Fat %</label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="input w-full py-2 text-sm"
                                                placeholder={showEstimates ? "Calculating..." : "0"}
                                                value={formData.bodyFat || ""}
                                                onChange={e => setFormData({ ...formData, bodyFat: Number(e.target.value) })}
                                                disabled={showEstimates}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {(formData.goalWeight || 0) > 0 && (formData.weight || 0) > 0 && (
                                    <div className="text-center text-xs font-medium py-1">
                                        To reach your goal, you need to
                                        <span className={weightDifference > 0 ? "text-green-400" : "text-amber-400"}>
                                            {weightDifference > 0 ? " GAIN " : " LOSE "}
                                            {Math.abs(weightDifference).toFixed(1)}kg
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Primary Goal</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["strength", "hypertrophy", "endurance", "weight_loss"] as const).map(goal => (
                                        <button
                                            key={goal}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, goal })}
                                            className={`py-3 rounded-xl border transition-all capitalized text-xs font-medium px-1
                                        ${formData.goal === goal
                                                    ? "bg-primary/20 border-primary text-primary"
                                                    : "bg-secondary border-transparent text-text-muted hover:bg-secondary/80"
                                                }`}
                                        >
                                            {goal.replace('_', ' ').charAt(0).toUpperCase() + goal.replace('_', ' ').slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="button" onClick={nextStep} className="btn w-full mt-2">
                                Next Step <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Activity Level</label>
                                <select
                                    className="input appearance-none w-full"
                                    value={formData.activityLevel}
                                    onChange={e => setFormData({ ...formData, activityLevel: e.target.value as any })}
                                >
                                    <option value="sedentary">Sedentary (Office Job)</option>
                                    <option value="active">Active (1-3 workouts/week)</option>
                                    <option value="athlete">Athlete (4+ workouts/week)</option>
                                </select>
                            </div>

                            <div className="bg-secondary/50 p-4 rounded-xl border border-primary/20">
                                <div className="flex items-start gap-3">
                                    <Activity className="text-primary mt-1" size={24} />
                                    <div>
                                        <h3 className="font-semibold text-primary">Biological Context (Optional)</h3>
                                        <p className="text-xs text-text-muted mt-1">
                                            Our AI adjusts intensity based on your biomarkers.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Testosterone Levels</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['Low', 'Normal', 'High'] as const).map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    bloodwork: { ...formData.bloodwork!, testosterone: level }
                                                })}
                                                className={`py-2 px-1 rounded-xl border transition-all text-xs font-medium
                                            ${formData.bloodwork?.testosterone === level
                                                        ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                                        : "bg-secondary border-transparent text-text-muted"
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Iron / Ferritin</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['Low', 'Normal', 'High'] as const).map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    bloodwork: { ...formData.bloodwork!, iron: level }
                                                })}
                                                className={`py-2 px-1 rounded-xl border transition-all text-xs font-medium
                                            ${formData.bloodwork?.iron === level
                                                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                                                        : "bg-secondary border-transparent text-text-muted"
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={prevStep} className="btn btn-secondary flex-1">
                                    Back
                                </button>
                                <button type="submit" className="btn flex-1">
                                    Complete Setup
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
