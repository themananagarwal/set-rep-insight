import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Loader, CheckCircle2, AlertCircle } from 'lucide-react';

type PageState = 'loading' | 'form' | 'success' | 'error';

export default function ResetPassword() {
    const [pageState, setPageState] = useState<PageState>('loading');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase puts the recovery tokens in the URL hash when the user
        // clicks the reset link. The client SDK picks them up automatically
        // via onAuthStateChange with event = 'PASSWORD_RECOVERY'.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setPageState('form');
            } else if (event === 'SIGNED_IN') {
                // triggered after a successful password update — redirect home
                // (handled in handleSubmit instead)
            }
        });

        // Also check if there's already a session from the hash tokens
        // (some clients resolve it synchronously before the listener fires)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setPageState('form');
        });

        // Fallback: if nothing resolved after 4s, show error
        const timeout = setTimeout(() => {
            setPageState(prev => prev === 'loading' ? 'error' : prev);
        }, 4000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setErrorMsg('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setErrorMsg('Password must be at least 8 characters.');
            return;
        }
        setSubmitting(true);
        setErrorMsg('');

        const { error } = await supabase.auth.updateUser({ password });
        setSubmitting(false);

        if (error) {
            setErrorMsg(error.message);
            return;
        }
        setPageState('success');
        setTimeout(() => navigate('/login'), 2500);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl z-10"
            >
                {/* Loading */}
                {pageState === 'loading' && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader className="animate-spin text-red-500" size={32} />
                        <p className="text-zinc-400 text-sm">Verifying reset link…</p>
                    </div>
                )}

                {/* Error — invalid / expired link */}
                {pageState === 'error' && (
                    <div className="flex flex-col items-center gap-4 text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <AlertCircle size={32} className="text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2">Link Expired or Invalid</h2>
                            <p className="text-zinc-400 text-sm">This reset link has expired or already been used. Please request a new one.</p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                )}

                {/* Success */}
                {pageState === 'success' && (
                    <div className="flex flex-col items-center gap-4 text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2">Password Updated!</h2>
                            <p className="text-zinc-400 text-sm">Redirecting you to login…</p>
                        </div>
                    </div>
                )}

                {/* Set new password form */}
                {pageState === 'form' && (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold tracking-tight mb-2">Set New Password</h1>
                            <p className="text-zinc-400 text-sm">Choose a strong password for your account.</p>
                        </div>

                        {errorMsg && (
                            <div className="mb-5 p-4 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="password"
                                    placeholder="New password (min 8 chars)"
                                    required
                                    minLength={8}
                                    autoFocus
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    required
                                    minLength={8}
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl mt-2 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                            >
                                {submitting
                                    ? <Loader className="animate-spin" size={20} />
                                    : <><CheckCircle2 size={20} /><span>Update Password</span></>
                                }
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
}
