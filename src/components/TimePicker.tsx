import { useState, useRef, useEffect, useCallback } from "react";
import { X, Check } from "lucide-react";
import clsx from "clsx";
import { createPortal } from "react-dom";

interface TimePickerProps {
    value: number; // in seconds
    onChange: (seconds: number) => void;
    label: string;
    type?: "work" | "rest";
}

export function TimePicker({ value, onChange, label, type = "work" }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Derived state for display
    const mins = Math.floor(value / 60);
    const secs = value % 60;

    const isWork = type === "work";
    const activeColor = isWork ? "text-primary" : "text-orange-500";
    const bgColor = isWork ? "bg-primary/10" : "bg-orange-500/10";
    const borderColor = isWork ? "border-primary/20" : "border-orange-500/20";

    return (
        <>
            {/* Trigger Button */}
            <div className="flex flex-col gap-1.5">
                <label className={clsx("text-[10px] font-bold uppercase tracking-wider pl-1", isWork ? "text-primary" : "text-orange-500")}>
                    {label}
                </label>
                <button
                    onClick={() => setIsOpen(true)}
                    className={clsx(
                        "w-full py-3 px-4 rounded-xl border flex items-center justify-center gap-1 transition-all",
                        bgColor,
                        borderColor,
                        "hover:bg-opacity-20 active:scale-95"
                    )}
                >
                    <span className={clsx("text-xl font-mono font-bold", activeColor)}>
                        {mins}:{secs.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-text-muted font-medium ml-1">
                        {mins > 0 ? "min" : "sec"}
                    </span>
                </button>
            </div>

            {/* Picker Drawer */}
            {isOpen && <PickerDrawer
                initialValue={value}
                onSave={(val) => { onChange(val); setIsOpen(false); }}
                onClose={() => setIsOpen(false)}
                title={label}
                isWork={isWork}
            />}
        </>
    );
}

function PickerDrawer({ initialValue, onSave, onClose, title, isWork }: {
    initialValue: number,
    onSave: (val: number) => void,
    onClose: () => void,
    title: string,
    isWork: boolean
}) {
    const [mins, setMins] = useState(Math.floor(initialValue / 60));
    const [secs, setSecs] = useState(initialValue % 60);

    const ITEM_HEIGHT = 40;

    // Scroll Wheel Component
    const Wheel = ({ range, value, onChange }: { range: number[], value: number, onChange: (v: number) => void }) => {
        const scrollerRef = useRef<HTMLDivElement>(null);
        const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        // Scroll to initial position on mount
        useEffect(() => {
            if (scrollerRef.current) {
                scrollerRef.current.scrollTop = value * ITEM_HEIGHT;
            }
        }, []);

        const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
            const target = e.target as HTMLDivElement;

            // Clear any pending debounce
            if (debounceRef.current) clearTimeout(debounceRef.current);

            // Debounce: wait for scroll to settle (150ms), then snap & select
            debounceRef.current = setTimeout(() => {
                const rawIndex = target.scrollTop / ITEM_HEIGHT;
                const index = Math.round(rawIndex);
                const clampedIndex = Math.max(0, Math.min(index, range.length - 1));

                // Snap scroll to exact position
                target.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: 'smooth' });

                // Auto-select the centered value
                if (range[clampedIndex] !== undefined) {
                    onChange(range[clampedIndex]);
                }
            }, 150);
        }, [range, onChange]);

        // Cleanup on unmount
        useEffect(() => {
            return () => {
                if (debounceRef.current) clearTimeout(debounceRef.current);
            };
        }, []);

        return (
            <div
                className="h-[200px] overflow-y-auto snap-y snap-mandatory scrollbar-hide relative py-[80px]"
                ref={scrollerRef}
                onScroll={handleScroll}
            >
                {range.map(num => (
                    <div
                        key={num}
                        className={clsx(
                            "h-[40px] flex items-center justify-center snap-center transition-all cursor-pointer select-none",
                            value === num ? (isWork ? "text-primary font-bold text-2xl" : "text-orange-500 font-bold text-2xl") : "text-text-muted/50 text-lg"
                        )}
                        onClick={() => {
                            onChange(num);
                            if (scrollerRef.current) {
                                scrollerRef.current.scrollTo({ top: num * ITEM_HEIGHT, behavior: 'smooth' });
                            }
                        }}
                    >
                        {num.toString().padStart(2, '0')}
                    </div>
                ))}
            </div>
        );
    };

    return createPortal(

        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

            {/* Drawer */}
            <div className="bg-surface border border-white/10 w-full max-w-[320px] rounded-3xl p-6 pointer-events-auto animate-in zoom-in-95 duration-200 shadow-2xl shadow-black/50 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onClose} className="p-2 bg-secondary rounded-full text-text-muted hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                    <h3 className="font-bold text-lg">{title}</h3>
                    <div className="w-9" /> {/* Spacer to balance title */}
                </div>

                <div className="flex justify-center gap-8 relative mb-8">
                    {/* Selection Indicator */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-[40px] bg-white/5 rounded-lg pointer-events-none" />

                    {/* Minute Wheel */}
                    <div className="flex-1 text-center">
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-2 font-bold">Minutes</div>
                        <Wheel
                            range={Array.from({ length: 60 }, (_, i) => i)}
                            value={mins}
                            onChange={setMins}
                        />
                    </div>

                    {/* COLON */}
                    <div className="flex items-center justify-center pt-8 text-2xl font-bold text-text-muted">:</div>

                    {/* Second Wheel */}
                    <div className="flex-1 text-center">
                        <div className="text-xs text-text-muted uppercase tracking-wider mb-2 font-bold">Seconds</div>
                        <Wheel
                            range={Array.from({ length: 60 }, (_, i) => i)}
                            value={secs}
                            onChange={setSecs}
                        />
                    </div>
                </div>

                {/* Confirm Button */}
                <button
                    onClick={() => onSave((mins * 60) + secs)}
                    className={clsx(
                        "w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2",
                        isWork ? "bg-primary shadow-primary/20" : "bg-orange-500 shadow-orange-500/20"
                    )}
                >
                    <Check size={24} /> Done
                </button>
            </div>
        </div>,
        document.body
    );
}
