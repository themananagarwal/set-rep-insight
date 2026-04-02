import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

interface QRCodeDisplayProps {
    clientId: string;
    clientName: string;
}

interface QRPayload {
    clientId: string;
    timestamp: number;
    nonce: string;
    v: number;
}

const QR_LIFETIME_MS = 120_000; // 2 minutes
const QR_REFRESH_MS  = 45_000;  // 45 seconds auto-refresh

function generateNonce(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function buildPayload(clientId: string): { payload: QRPayload; encoded: string } {
    const payload: QRPayload = {
        clientId,
        timestamp: Date.now(),
        nonce: generateNonce(),
        v: 1,
    };
    return { payload, encoded: JSON.stringify(payload) };
}

export function QRCodeDisplay({ clientId, clientName }: QRCodeDisplayProps) {
    const [state, setState]       = useState(() => buildPayload(clientId));
    const [secondsLeft, setSecondsLeft] = useState(QR_LIFETIME_MS / 1000);

    const refresh = useCallback(() => {
        setState(buildPayload(clientId));
        setSecondsLeft(QR_LIFETIME_MS / 1000);
    }, [clientId]);

    // Auto-refresh every 45 s
    useEffect(() => {
        const t = setInterval(refresh, QR_REFRESH_MS);
        return () => clearInterval(t);
    }, [refresh]);

    // 1-second countdown
    useEffect(() => {
        const t = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) { refresh(); return QR_LIFETIME_MS / 1000; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [refresh]);

    const totalSecs   = QR_LIFETIME_MS / 1000;
    const progressPct = (secondsLeft / totalSecs) * 100;
    const isWarning   = secondsLeft < 20;

    return (
        <div className="flex flex-col items-center gap-5 py-2 w-full max-w-xs mx-auto">

            {/* Header label */}
            <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    Verified Session QR
                </span>
            </div>

            {/* QR Code — clean, no overlapping ring */}
            <div className="bg-white p-5 rounded-3xl shadow-[0_8px_48px_rgba(0,0,0,0.5)]">
                <QRCodeSVG
                    value={state.encoded}
                    size={220}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#09090b"
                />
            </div>

            {/* Timer bar + countdown */}
            <div className="w-full space-y-2">
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                            isWarning ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>

                {/* Timer row */}
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold tabular-nums ${isWarning ? 'text-red-400' : 'text-zinc-400'}`}>
                        {isWarning ? '⚠️ ' : ''}Expires in {secondsLeft}s
                    </span>
                    <button
                        onClick={refresh}
                        className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-full text-xs font-medium transition-colors"
                    >
                        <RefreshCw size={11} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Footer note */}
            <p className="text-xs text-zinc-600 text-center leading-relaxed">
                For: <span className="text-zinc-400 font-medium">{clientName}</span>
                <br />
                QR expires after 2 minutes and cannot be reused.
            </p>
        </div>
    );
}
