import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMockBackendStore } from '../lib/mockBackend';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader, CheckCircle2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const resetClientPassword = useMockBackendStore(state => state.resetClientPassword);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (isResetting) {
            // Handle Password Reset
            const success = resetClientPassword(email, password);
            if (success) {
                setMessage({ type: 'success', text: 'Password successfully updated! You can now log in.' });
                setIsResetting(false);
                setPassword('');
            } else {
                setMessage({ type: 'error', text: 'No account found with that email address.' });
            }
            setLoading(false);
            return;
        }

        try {
            const { error } = await login(email, password);
            if (error) throw new Error(error);
            // AuthContext will handle redirect based on profile status
            navigate('/');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to sign in' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Portal Login</h1>
                    <p className="text-zinc-400">Enter your credentials to access the system</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        <motion.div 
                            key={isResetting ? 'reset' : 'login'}
                            initial={{ opacity: 0, x: isResetting ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isResetting ? -20 : 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="password"
                                    placeholder={isResetting ? "Enter New Password" : "Password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                                />
                            </div>

                            {!isResetting && (
                                <div className="flex justify-end">
                                    <button 
                                        type="button" 
                                        onClick={() => { setIsResetting(true); setMessage(null); setPassword(''); }}
                                        className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl mt-4 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={20} /> : (
                                    <>
                                        <span>{isResetting ? 'Update Password' : 'Sign In'}</span>
                                        {isResetting ? <CheckCircle2 size={20} /> : <ArrowRight size={20} />}
                                    </>
                                )}
                            </button>
                            
                            {isResetting && (
                                <button 
                                    type="button" 
                                    onClick={() => { setIsResetting(false); setMessage(null); setPassword(''); }}
                                    className="w-full py-4 bg-transparent text-zinc-400 font-medium rounded-xl hover:text-white transition-colors flex items-center justify-center gap-2 border border-white/5"
                                >
                                    Back to Login
                                </button>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </form>

                <div className="mt-8 text-center pt-8 border-t border-white/5">
                    <p className="text-xs text-zinc-500">
                        Don't have an account? Please contact your trainer to get set up.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
