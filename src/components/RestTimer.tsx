import { useState, useEffect } from "react";
import { X, Play } from "lucide-react";

type RestTimerProps = {
    initialSeconds: number;
    label?: string;
    onComplete: () => void;
    onClose: () => void;
};

export function RestTimer({ initialSeconds, label = "Resting...", onComplete, onClose }: RestTimerProps) {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        if (timeLeft <= 0) {
            onComplete();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((t) => t - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, isPaused, onComplete]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const progress = (timeLeft / initialSeconds) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-surface border border-secondary w-full max-w-sm rounded-3xl p-8 flex flex-col items-center relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-muted hover:text-text"
                >
                    <X size={24} />
                </button>

                <h3 className="text-xl font-semibold mb-8">{label}</h3>

                {/* Circular Progress (CSS approximate) */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="12"
                            className="text-secondary"
                        />
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="12"
                            className="text-primary transition-all duration-1000 ease-linear"
                            strokeDasharray={2 * Math.PI * 88}
                            strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute text-5xl font-bold font-mono">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex gap-4 w-full">
                    <button
                        onClick={() => setTimeLeft(t => t + 30)}
                        className="btn btn-secondary flex-1 py-3 text-sm"
                    >
                        +30s
                    </button>
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="btn flex-1 py-3"
                    >
                        {isPaused ? <Play size={20} fill="currentColor" /> : "Pause"}
                    </button>
                    <button
                        onClick={onComplete}
                        className="btn btn-secondary flex-1 py-3 text-sm text-red-400 hover:text-red-500"
                    >
                        Skip
                    </button>
                </div>
            </div>
        </div>
    );
}
