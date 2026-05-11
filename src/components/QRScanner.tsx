import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { useMockBackendStore } from '../lib/mockBackend';
import { isSupabaseConfigured } from '../lib/supabase';
import * as db from '../lib/db';

const QR_MAX_AGE_MS = 120_000; // 2 minutes

interface QRScannerProps {
    clientId: string;
    onClose: () => void;
    onSuccess?: (trainerId: string) => void;
}

interface ScanResult {
    type: 'success' | 'error';
    message: string;
    clientName?: string;
}

export function QRScanner({ clientId, onClose, onSuccess }: QRScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = 'qr-scanner-region';
    const [result, setResult] = useState<ScanResult | null>(null);
    const [isStarted, setIsStarted] = useState(false);

    // Mock backend (used in non-Supabase mode)
    const mockUsers = useMockBackendStore(s => s.users);
    const mockLogSession = useMockBackendStore(s => s.logSession);

    const stopScanner = async () => {
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop().catch(() => {});
        }
    };

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    const handleScanSuccess = async (decodedText: string) => {
        if (result) return;
        await stopScanner();

        try {
            const payload = JSON.parse(decodedText);
            const { trainerId, timestamp, nonce } = payload;

            // Validate age
            const age = Date.now() - timestamp;
            if (age > QR_MAX_AGE_MS) {
                setResult({ type: 'error', message: `QR code expired (${Math.round(age / 1000)}s old). Ask client to refresh.` });
                return;
            }

            if (isSupabaseConfigured) {
                // ── Supabase path ──────────────────────────────────
                const trainerProfile = await db.getProfile(trainerId);
                if (!trainerProfile) {
                    setResult({ type: 'error', message: 'Trainer not found in system.' });
                    return;
                }
                const logResult = await db.logSession(clientId, trainerId, nonce, 'qr_scan');
                if (!logResult.success) {
                    setResult({ type: 'error', message: logResult.error || 'Could not log session.' });
                    return;
                }
                setResult({ type: 'success', message: 'Session logged successfully!', clientName: trainerProfile.name });
                onSuccess?.(trainerId);
            } else {
                // ── Mock path ──────────────────────────────────────
                const trainer = mockUsers.find(u => u.id === trainerId);
                if (!trainer) {
                    setResult({ type: 'error', message: 'Trainer not found in system.' });
                    return;
                }
                const logResult = mockLogSession(clientId, trainerId, nonce, 'qr_scan');
                if (!logResult.success) {
                    setResult({ type: 'error', message: logResult.error || 'Could not log session.' });
                    return;
                }
                setResult({ type: 'success', message: 'Session logged successfully!', clientName: trainer.name });
                onSuccess?.(trainerId);
            }
        } catch {
            setResult({ type: 'error', message: 'Invalid QR code. Not a valid session QR.' });
        }
    };

    useEffect(() => {
        const scanner = new Html5Qrcode(scannerContainerId);
        scannerRef.current = scanner;

        scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            handleScanSuccess,
            () => {}
        ).then(() => setIsStarted(true)).catch(() => {
            setResult({ type: 'error', message: 'Camera access denied. Please allow camera permissions.' });
        });

        return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6">
            <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Camera size={20} className="text-red-500" />
                        <span className="font-bold text-white">Scan Trainer QR</span>
                    </div>
                    <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {!result ? (
                    <div className="relative">
                        <div id={scannerContainerId} className="w-full" />
                        {!isStarted && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                <p className="text-zinc-400 text-sm">Starting camera...</p>
                            </div>
                        )}
                        {isStarted && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-56 h-56 relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500 rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500 rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500 rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500 rounded-br-lg" />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 flex flex-col items-center text-center gap-4">
                        {result.type === 'success' ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                                    <CheckCircle size={40} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{result.message}</h3>
                                    {result.clientName && <p className="text-zinc-400 text-sm">Trainer: <span className="font-semibold text-white">{result.clientName}</span></p>}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                                    <AlertCircle size={40} className="text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">Scan Failed</h3>
                                    <p className="text-zinc-400 text-sm">{result.message}</p>
                                </div>
                            </>
                        )}
                        <button
                            onClick={() => { setResult(null); setIsStarted(false); }}
                            className="mt-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                        >
                            Scan Another
                        </button>
                    </div>
                )}

                <div className="px-6 py-3 bg-zinc-900/50 border-t border-white/5">
                    <p className="text-xs text-zinc-500 text-center">QR codes expire after 2 minutes</p>
                </div>
            </div>
        </div>
    );
}
