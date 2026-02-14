

interface TimeInputProps {
    value: number; // in seconds
    onChange: (seconds: number) => void;
    className?: string;
    label?: string;
}

export function TimeInput({ value, onChange, className, label }: TimeInputProps) {
    // Local state for the input fields to allow typing comfortably
    // We strictly sync with 'value' prop only when it changes externally or on blur/enter?
    // Actually, distinct minute/second inputs is easier for UX than parsing a string.

    const mins = Math.floor(value / 60);
    const secs = value % 60;

    const handleMinsChange = (newMins: number) => {
        onChange((newMins * 60) + secs);
    };

    const handleSecsChange = (newSecs: number) => {
        // If seconds go above 59, we arguably could just keep them or roll over. 
        // Standard behavior: 0-59.
        if (newSecs < 0) newSecs = 0;
        // Allow > 59? No, typically better to cap or rollover. Let's cap at 59 for simplicity input.
        // Actually, if user types 90, maybe they mean 1m 30s. But simpler to just cap 59 per field.
        // Or just let it calculate:
        onChange((mins * 60) + newSecs);
    };

    return (
        <div className={className}>
            {label && <label className="text-[10px] text-text-muted block mb-1">{label} (MM:SS)</label>}
            <div className="flex items-center gap-1">
                <input
                    type="number"
                    min="0"
                    value={mins}
                    onChange={(e) => handleMinsChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-secondary rounded-lg p-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="00"
                />
                <span className="font-bold text-text-muted">:</span>
                <input
                    type="number"
                    min="0"
                    max="59"
                    value={secs}
                    onChange={(e) => handleSecsChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-secondary rounded-lg p-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="00"
                />
            </div>
        </div>
    );
}
