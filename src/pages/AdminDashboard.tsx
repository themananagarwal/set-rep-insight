import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Search, Shield, Clock, UserCheck, UserX, Loader } from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    location: string;
    referred_by: string;
    status: 'pending' | 'approved' | 'rejected';
    role: 'user' | 'admin';
    created_at: string;
}

export default function AdminDashboard() {
    const { profile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setUsers(data as UserProfile[] || []);
        }
        setLoading(false);
    }

    async function updateUserStatus(userId: string, newStatus: 'approved' | 'rejected') {
        setActionLoading(userId);
        const { error } = await supabase
            .from('profiles')
            .update({ status: newStatus })
            .eq('id', userId);

        if (error) {
            console.error(`Error updating status to ${newStatus}:`, error);
        } else {
            // Optimistic update
            setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        }
        setActionLoading(null);
    }

    const filteredUsers = users.filter(u => {
        const matchesFilter = filter === 'all' || u.status === filter;
        const matchesSearch =
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.location?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: users.length,
        pending: users.filter(u => u.status === 'pending').length,
        approved: users.filter(u => u.status === 'approved').length,
        rejected: users.filter(u => u.status === 'rejected').length,
    };

    if (!profile || profile.role !== 'admin') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Admin Access Required</h1>
                    <p className="text-zinc-400 mt-2">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Shield className="text-red-500" />
                            Admin Dashboard
                        </h1>
                        <p className="text-zinc-400 mt-1">Manage user access and approvals.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-zinc-900 rounded-xl border border-white/10 flex flex-col items-center min-w-[100px]">
                            <span className="text-xs text-zinc-500 uppercase font-bold">Pending</span>
                            <span className="text-xl font-bold text-yellow-500">{stats.pending}</span>
                        </div>
                        <div className="px-4 py-2 bg-zinc-900 rounded-xl border border-white/10 flex flex-col items-center min-w-[100px]">
                            <span className="text-xs text-zinc-500 uppercase font-bold">Users</span>
                            <span className="text-xl font-bold text-white">{stats.total}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50"
                        />
                    </div>
                    <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10">
                        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${filter === f
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users Table / List */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden min-h-[500px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/5 text-zinc-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-6 font-medium">User Details</th>
                                        <th className="p-6 font-medium">Location</th>
                                        <th className="p-6 font-medium">Status</th>
                                        <th className="p-6 font-medium">Joined</th>
                                        <th className="p-6 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-6">
                                                <div className="font-bold text-white">{u.full_name || 'No Name'}</div>
                                                <div className="text-sm text-zinc-500">{u.email}</div>
                                                <div className="text-xs text-zinc-600 mt-1">{u.phone || 'No Phone'}</div>
                                            </td>
                                            <td className="p-6 text-zinc-400">
                                                {u.location || '-'}
                                                {u.referred_by && (
                                                    <div className="text-xs text-zinc-600 mt-1">Ref: {u.referred_by}</div>
                                                )}
                                            </td>
                                            <td className="p-6">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${u.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    u.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    }`}>
                                                    {u.status === 'approved' && <UserCheck size={12} />}
                                                    {u.status === 'rejected' && <UserX size={12} />}
                                                    {u.status === 'pending' && <Clock size={12} />}
                                                    {u.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-6 text-zinc-500 text-sm">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {u.status !== 'approved' && (
                                                        <button
                                                            onClick={() => updateUserStatus(u.id, 'approved')}
                                                            disabled={!!actionLoading}
                                                            className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"
                                                            title="Approve"
                                                        >
                                                            {actionLoading === u.id ? <Loader size={18} className="animate-spin" /> : <Check size={18} />}
                                                        </button>
                                                    )}
                                                    {u.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => updateUserStatus(u.id, 'rejected')}
                                                            disabled={!!actionLoading}
                                                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                                                            title="Reject"
                                                        >
                                                            {actionLoading === u.id ? <Loader size={18} className="animate-spin" /> : <X size={18} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-zinc-500">
                                                No users found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
