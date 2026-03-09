'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DataCard } from '@/components/DataCard';
import { Users, Pulse, Sparkle, Gauge, ClipboardText, Pill, CheckCircle, ArrowSquareOut } from '@phosphor-icons/react';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAdminStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-purple-500 animate-spin" />
                    <Pulse size={24} className="absolute inset-0 m-auto text-purple-400 animate-pulse" />
                </div>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Admin Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                    <Gauge size={28} weight="duotone" className="text-purple-400" />
                    Administration
                </h1>
                <p className="text-slate-500 mt-1">System overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DataCard title="Total Users" value={stats?.users?.total || 0} icon={Users} color="purple" />
                <DataCard title="Total Prescriptions" value={stats?.prescriptions?.total || 0} icon={ClipboardText} color="cyan" />
                <DataCard title="Processed" value={stats?.prescriptions?.processed || 0} icon={Pill} color="blue" />
                <DataCard title="Verified" value={stats?.prescriptions?.verified || 0} icon={CheckCircle} color="green" />
            </div>

            {/* Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
                    <Sparkle size={80} weight="duotone" className="absolute -right-4 -top-4 text-slate-700/20" />
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <Users size={16} weight="duotone" /> Users by Role
                    </h3>
                    <div className="space-y-3 relative z-10">
                        {stats?.users?.byRole && Object.entries(stats.users.byRole).map(([role, count]) => (
                            <div key={role} className="flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800/50 transition-colors">
                                <span className="text-slate-400 text-sm font-mono uppercase tracking-wider">{role}</span>
                                <span className="text-slate-100 font-bold font-mono text-lg">{count as number}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
                    <Sparkle size={80} weight="duotone" className="absolute -right-4 -top-4 text-slate-700/20" />
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <ArrowSquareOut size={16} weight="duotone" /> Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        <button onClick={() => window.location.href = '/admin/users'}
                            className="bg-gradient-to-br from-purple-900/40 to-purple-950/60 border border-purple-700/30 hover:border-purple-600/50 rounded-xl px-4 py-3 text-purple-300 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02]">
                            Manage Users
                        </button>
                        <button onClick={() => window.location.href = '/admin/prescriptions'}
                            className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/60 border border-cyan-700/30 hover:border-cyan-600/50 rounded-xl px-4 py-3 text-cyan-300 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02]">
                            All Prescriptions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
