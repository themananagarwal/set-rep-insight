import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: any) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(_error: any) {
            console.log('SW registration error', _error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5 fade-in">
            <div className="bg-surface border border-primary/50 shadow-2xl shadow-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                    <h3 className="font-bold text-sm text-primary mb-1">
                        {offlineReady ? 'App ready to work offline' : 'New Update Available!'}
                    </h3>
                    <p className="text-xs text-text-muted">
                        {offlineReady
                            ? 'You can use this app without internet now.'
                            : 'Click reload to get the latest features.'}
                    </p>
                </div>

                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCw size={14} /> Reload
                    </button>
                )}

                <button
                    onClick={close}
                    className="p-2 text-text-muted hover:text-text bg-secondary rounded-lg"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
