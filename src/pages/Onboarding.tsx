import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { User, MapPin, Phone, Mail, ArrowRight, Loader } from 'lucide-react';

const ADMIN_EMAIL = 'manan.agarwal1901@gmail.com';

export default function Onboarding() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        location: '',
        referred_by: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Auto-fill referral from URL
        const ref = searchParams.get('ref');
        if (ref) {
            setFormData(prev => ({ ...prev, referred_by: ref }));
        }

        // Redirect to login if not authenticated
        // Wait for auth loading to finish
        if (!loading && !user) {
            const loginUrl = ref ? `/login?ref=${ref}` : '/login';
            navigate(loginUrl);
        }
    }, [searchParams, user, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return; // Should be handled by useEffect redirect, but safe guard

        setSubmitting(true);
        setError(null);

        try {
            // Determine initial status
            // If referred by the Admin, auto-approve!
            const initialStatus = formData.referred_by?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()
                ? 'approved'
                : 'pending';

            const role = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email!,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    location: formData.location,
                    referred_by: formData.referred_by,
                    status: role === 'admin' ? 'approved' : initialStatus, // Admins auto-approve themselves too
                    role: role
                });

            if (insertError) throw insertError;

            // Force reload or re-fetch profile to update context
            window.location.href = '/';

        } catch (err: any) {
            console.error('Onboarding error:', err);
            setError(err.message || 'Failed to create profile');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-red-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Complete Profile</h1>
                    <p className="text-zinc-400">Tell us a bit about yourself to get started.</p>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email (Read Only) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-zinc-400 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="John Doe"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="text"
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="New York, NY"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Referred By */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Referred By (Optional)</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="email"
                                value={formData.referred_by}
                                onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
                                placeholder="friend@example.com"
                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                    >
                        {submitting ? (
                            <Loader className="animate-spin" size={20} />
                        ) : (
                            <>
                                <span>Create Profile</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
