import { useTrainerStore } from "../lib/store";
import { useAuth } from "../contexts/AuthContext";
import { analyzeWeaknesses, generateRoutine } from "../lib/generator";
import { Activity, Trophy, Zap, Map, LogOut } from "lucide-react";

export default function Profile() {
    const { user: authUser, logout } = useAuth();
    const { user, history, exercises } = useTrainerStore();
    

    if (!user || !authUser) return <div className="p-6">Loading profile...</div>;

    const weaknesses = analyzeWeaknesses(history, exercises);
    const routine = generateRoutine(user, weaknesses);

    

    

    return (
        <div className="pt-6 pb-24 space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="text-text-muted capitalize">{user.goal} • {user.weight}kg</p>
                </div>
            </div>

                        {/* Account Actions */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-2">Account Actions</h2>
                <button
                    onClick={logout}
                    className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>


            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface border border-secondary p-4 rounded-xl flex flex-col gap-2">
                    <Trophy className="text-amber-500" size={24} />
                    <div>
                        <span className="text-sm font-semibold">Goal</span>
                        <p className="text-xs text-text-muted capitalize">{user.goal}</p>
                    </div>
                </div>
                <div className="bg-surface border border-secondary p-4 rounded-xl flex flex-col gap-2">
                    <Activity className="text-green-500" size={24} />
                    <div>
                        <span className="text-sm font-semibold">Activity</span>
                        <p className="text-xs text-text-muted capitalize">{user.activityLevel}</p>
                    </div>
                </div>
            </div>

            {/* AI Analysis Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Zap className="text-primary" size={20} />
                    <h2 className="text-lg font-bold">AI Body Analysis</h2>
                </div>

                {weaknesses.length > 0 ? (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                        <h3 className="font-semibold text-red-400 text-sm mb-1">Lagging Muscle Groups Detected</h3>
                        <div className="flex flex-wrap gap-2">
                            {weaknesses.map(w => (
                                <span key={w} className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-md font-medium">
                                    {w}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                        <h3 className="font-semibold text-green-400 text-sm">Balanced Phsyique</h3>
                        <p className="text-xs text-green-300/80 mt-1">No significant volume imbalances detected yet.</p>
                    </div>
                )}
            </div>

            {/* Recommended Routine */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Map className="text-blue-500" size={20} />
                    <h2 className="text-lg font-bold">Smart Routine</h2>
                </div>

                <div className="bg-gradient-to-br from-surface to-secondary rounded-2xl p-5 border border-secondary shadow-lg">
                    <div className="mb-4 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-bold text-primary">{routine.name}</h3>
                        <p className="text-sm text-text-muted italic mt-1">{routine.days.length}-Day Split</p>
                    </div>

                    <div className="space-y-3 mb-4">
                        {routine.days.map((day, i) => (
                            <div key={day.id} className="flex items-center gap-3">
                                <span className="bg-secondary w-6 h-6 rounded flex items-center justify-center text-[10px] text-text-muted font-mono">{i + 1}</span>
                                <div className="flex-1">
                                    <span className="text-sm font-medium block">{day.name}</span>
                                    <span className="text-[10px] text-text-muted">{day.exercises.length} Exercises</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl text-xs text-text-muted leading-relaxed">
                        <span className="font-bold text-text-muted">Coach's Note:</span> {routine.rationale}
                    </div>
                </div>

                <button
                    onClick={() => {
                        useTrainerStore.getState().setRoutine(routine); // Use direct store access or destructure if available
                        alert("Plan Activated! Check Dashboard.");
                    }}
                    className="btn w-full py-4 font-bold text-white shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform"
                >
                    <Trophy className="inline mr-2" size={18} /> Activate This Plan
                </button>
            </div>

            <button
                onClick={() => {
                    if (confirm("Reset all data?")) {
                        localStorage.clear();
                        window.location.reload();
                    }
                }}
                className="w-full py-4 text-red-400 text-sm font-medium hover:bg-red-500/10 rounded-xl transition-colors"
            >
                Reset App Data
            </button>
        </div>
    );
}
