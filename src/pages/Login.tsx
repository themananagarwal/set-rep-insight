import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { useMockBackendStore } from '../lib/mockBackend';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader, CheckCircle2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [message, setMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // "forgot" mode: 'idle' | 'email' | 'reset' (mock only) | 'sent'
    const [forgotMode, setForgotMode] = useState<'idle' | 'email' | 'sent' | 'reset'>('idle');
    const [forgotEmail, setForgotEmail] = useState('');

    const { login, forgotPassword } = useAuth();
    const navigate = useNavigate();
    const resetClientPassword = useMockBackendStore(s => s.resetClientPassword);

    // ── Login submit ───────────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const { error } = await login(email, password);
            if (error) throw new Error(error);
            navigate('/');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to sign in' });
        } finally {
            setLoading(false);
        }
    };

    // ── Forgot password submit ─────────────────────────────────────────────
    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!isSupabaseConfigured) {
            // Mock mode: go to local reset step
            const exists = useMockBackendStore.getState().users.find(
                u => u.email.toLowerCase() === forgotEmail.toLowerCase()
            );
            setLoading(false);
            if (!exists) {
                setMessage({ type: 'error', text: 'No account found with that email address.' });
                return;
            }
            setForgotMode('reset');
            return;
        }

        // Supabase mode: send real reset email
        const { error } = await forgotPassword(forgotEmail);
        setLoading(false);
        if (error) {
            setMessage({ type: 'error', text: error });
            return;
        }
        setForgotMode('sent');
    };

    // ── Mock local reset ───────────────────────────────────────────────────
    const handleMockReset = (e: React.FormEvent) => {
        e.preventDefault();
        const success = resetClientPassword(forgotEmail, password);
        if (success) {
            setMessage({ type: 'success', text: 'Password updated! You can now sign in.' });
            setForgotMode('idle');
            setEmail(forgotEmail);
            setPassword('');
        } else {
            setMessage({ type: 'error', text: 'Could not update password. Try again.' });
        }
    };

    const isForgot = forgotMode !== 'idle';

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
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        {isForgot ? 'Reset Password' : 'Portal Login'}
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {forgotMode === 'sent'
                            ? 'Check your inbox for a reset link.'
                            : forgotMode === 'email'
                            ? 'Enter your email to receive a reset link.'
                            : forgotMode === 'reset'
                            ? 'Enter your new password.'
                            : 'Enter your credentials to access the system.'}
                    </p>
                </div>

                {/* Toast */}
                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
                        message.type === 'success'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                        {message.text}
                    </div>
                )}

                <AnimatePresence mode="popLayout">

                    {/* ── Email sent confirmation ───────────────────────── */}
                    {forgotMode === 'sent' && (
                        <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                            </div>
                            <p className="text-zinc-400 text-sm">
                                A reset link has been sent to <span className="text-white font-medium">{forgotEmail}</span>.
                                Click the link in the email to set a new password.
                            </p>
                            <button
                                onClick={() => { setForgotMode('idle'); setMessage(null); setForgotEmail(''); }}
                                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Back to Login
                            </button>
                        </motion.div>
                    )}

                    {/* ── Forgot: enter email ───────────────────────────── */}
                    {forgotMode === 'email' && (
                        <motion.form key="forgot-email" onSubmit={handleForgotSubmit} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="email" required autoFocus
                                    placeholder="Your account email"
                                    value={forgotEmail}
                                    onChange={e => setForgotEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                                {loading ? <Loader className="animate-spin" size={20} /> : <><span>Send Reset {isSupabaseConfigured ? 'Email' : 'Link'}</span><ArrowRight size={20} /></>}
                            </button>
                            <button type="button" onClick={() => { setForgotMode('idle'); setMessage(null); }} className="w-full py-3 text-zinc-500 hover:text-white text-sm transition-colors">
                                Back to Login
                            </button>
                        </motion.form>
                    )}

                    {/* ── Mock: enter new password ──────────────────────── */}
                    {forgotMode === 'reset' && (
                        <motion.form key="mock-reset" onSubmit={handleMockReset} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="password" required autoFocus minLength={6}
                                    placeholder="New password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                                <CheckCircle2 size={20} /><span>Update Password</span>
                            </button>
                            <button type="button" onClick={() => { setForgotMode('idle'); setMessage(null); setPassword(''); }} className="w-full py-3 text-zinc-500 hover:text-white text-sm transition-colors">
                                Back to Login
                            </button>
                        </motion.form>
                    )}

                    {/* ── Normal login ──────────────────────────────────── */}
                    {forgotMode === 'idle' && (
                        <motion.form key="login" onSubmit={handleLogin} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="email" required autoFocus
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="password" required
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => { setForgotMode('email'); setForgotEmail(email); setMessage(null); }}
                                    className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-bold rounded-xl mt-2 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
                                {loading ? <Loader className="animate-spin" size={20} /> : <><span>Sign In</span><ArrowRight size={20} /></>}
                            </button>
                        </motion.form>
                    )}

                </AnimatePresence>

                <div className="mt-8 text-center pt-6 border-t border-white/5">
                    <p className="text-xs text-zinc-500">
                        Don't have an account? Contact your trainer to get set up.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
