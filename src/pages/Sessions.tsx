import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMockBackendStore } from '../lib/mockBackend';
import { QRScanner } from '../components/QRScanner';
import { Camera, Clock, CheckCircle, AlertTriangle, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function Sessions() {
    const { user } = useAuth();
    const [showScanner, setShowScanner] = useState(false);

    const getSessionPackage = useMockBackendStore(s => s.getSessionPackage);
    const getSessionLogs = useMockBackendStore(s => s.getSessionLogs);

    if (!user) return null;

    const pkg = getSessionPackage(user.id);
    const logs = getSessionLogs(user.id);

    const isLow = pkg && pkg.sessionsRemaining > 0 && pkg.sessionsRemaining <= 3;
    const isExpired = pkg?.expiryDate && Date.now() > pkg.expiryDate;
    const noSessions = pkg && pkg.sessionsRemaining === 0;

    return (
        <div className="space-y-6 pt-6 pb-32 px-4">
            <div>
                <h2 className="text-xs font-medium text-text-muted tracking-wide uppercase mb-1">My Sessions</h2>
                <h1 className="text-3xl font-semibold tracking-tight text-white">Personal Training</h1>
            </div>

            {/* Package Card */}
            {pkg ? (
                <div className={`rounded-2xl border p-6 space-y-4 ${isExpired || noSessions ? 'bg-red-950/20 border-red-500/30' : isLow ? 'bg-amber-950/20 border-amber-500/30' : 'bg-zinc-900 border-white/10'}`}>
                    {(isLow || noSessions || isExpired) && (
                        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${noSessions || isExpired ? 'text-red-400' : 'text-amber-400'}`}>
                            <AlertTriangle size={14} />
                            {isExpired ? 'Package Expired' : noSessions ? 'No Sessions Left' : `Only ${pkg.sessionsRemaining} sessions remaining`}
                        </div>
                    )}

                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Sessions Remaining</p>
                            <p className={`text-6xl font-black tabular-nums ${noSessions || isExpired ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'}`}>
                                {isExpired ? '—' : pkg.sessionsRemaining}
                            </p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-xs text-zinc-500">Used</p>
                            <p className="text-2xl font-bold text-zinc-400">{pkg.sessionsUsed}</p>
                            <p className="text-xs text-zinc-500">of {pkg.totalSessions}</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${noSessions || isExpired ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(pkg.sessionsUsed / pkg.totalSessions) * 100}%` }}
                        />
                    </div>

                    {pkg.expiryDate && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Calendar size={12} />
                            <span>Expires: {format(new Date(pkg.expiryDate), 'dd MMM yyyy')}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                            <Shield size={20} className="text-zinc-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-white text-sm">No Package Assigned</p>
                            <p className="text-zinc-500 text-xs">Ask your trainer to add a session package to your account.</p>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-600 border-t border-white/5 pt-3">You can still scan a trainer's code, but no sessions can be deducted.</p>
                </div>
            )}

            {/* Show Scanner Button — always visible */}
            <button
                onClick={() => setShowScanner(true)}
                className={`w-full flex items-center justify-center gap-3 py-5 font-bold text-lg rounded-2xl transition-all active:scale-[0.98] ${
                    !pkg || isExpired || noSessions
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_30px_rgba(220,38,38,0.3)]'
                }`}
            >
                <Camera size={24} />
                {!pkg ? 'Scan Trainer Code' : isExpired ? 'Package Expired — Scan Anyway' : noSessions ? 'No Sessions Left — Scan Anyway' : 'Scan Trainer QR'}
            </button>

            {/* Session History */}
            {logs.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Session History</h2>
                    {logs.map(log => (
                        <div key={log.id} className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle size={18} className="text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-white">Session Completed</p>
                                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                    <Clock size={10} />
                                    {format(new Date(log.timestamp), 'dd MMM yyyy, h:mm a')}
                                </p>
                            </div>
                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                {log.verificationMethod === 'qr_scan' ? 'QR' : 'Manual'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScanner 
                    clientId={user.id} 
                    onClose={() => setShowScanner(false)} 
                    onSuccess={() => {
                        // Let the state automatically update sessions and history
                    }}
                />
            )}
        </div>
    );
}
