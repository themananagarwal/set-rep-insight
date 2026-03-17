import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Phone, MapPin, Loader, ArrowRight } from 'lucide-react';

const ADMIN_EMAIL = 'manan.agarwal1901@gmail.com';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [searchParams] = useSearchParams();
    const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signUp, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create Auth User
            const { data, error: authError } = await signUp(email, password);
            if (authError) throw authError;

            if (data.user) {
                // 2. Determine Status
                const isAutoApproved = referralCode.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                const status = isAutoApproved ? 'approved' : 'pending';

                // 3. Create Profile
                const { error: profileError } = await supabase.from('profiles').insert({
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    phone: phone,
                    location: location,
                    referred_by: referralCode || null,
                    status: status,
                    role: 'user'
                });

                if (profileError) throw profileError;

                // 4. Verification / Redirect
                // Retry fetching the profile until it exists (fixes race condition)
                let attempts = 0;
                let profileExists = false;

                while (attempts < 5 && !profileExists) {
                    await refreshProfile(data.user.id);

                    // Direct check to confirm it's readable
                    const { data: profileCheck } = await supabase
                        .from('profiles')
                        .select('status')
                        .eq('id', data.user.id)
                        .maybeSingle();

                    if (profileCheck) {
                        profileExists = true;
                        // Force a small delay to allow Context to propagate if needed
                        await new Promise(r => setTimeout(r, 100));

                        // Check status from the DB directly to be safe
                        if (profileCheck.status === 'approved') {
                            navigate('/setup');
                        } else {
                            navigate('/');
                        }
                        return; // Exit function
                    }

                    attempts++;
                    await new Promise(r => setTimeout(r, 500)); // Wait 500ms between attempts
                }

                // If loop finishes without success (fallback)
                if (!profileExists) {
                    // One last try
                    await refreshProfile(data.user.id);
                    navigate('/');
                }
            }
        } catch (err: any) {
            console.error(err);
            if (err.message?.includes('already registered')) {
                setError('This email is already registered. Please sign in.');
            } else {
                setError(err.message || "Failed to sign up");
            }
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

            <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl z-10">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
                    <p className="text-zinc-400">Join the exclusive training program</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-4">
                    {/* Full Name */}
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                        />
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                        />
                    </div>

                    {/* Phone */}
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                        />
                    </div>

                    {/* Location */}
                    <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="City, Country"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                        />
                    </div>

                    {/* Referral Code */}
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Referral Email (Optional)"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                        />
                    </div>


                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl mt-4 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : (
                            <>
                                <span>Complete Registration</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-zinc-500 text-sm">
                        Already have an account?{' '}
                        <button onClick={() => navigate('/login')} className="text-white hover:underline font-medium">
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
