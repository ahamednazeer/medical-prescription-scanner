'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DataCard } from '@/components/DataCard';
import {
    Pill, Bell, Pulse, Sparkle, Gauge,
    ArrowRight, UploadSimple, ClipboardText,
    FirstAid, Stethoscope,
} from '@phosphor-icons/react';
import Link from 'next/link';

export default function PatientDashboard() {
    const [user, setUser] = useState<any>(null);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [reminders, setReminders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [userData, rxData, reminderData] = await Promise.all([
                    api.getMe(),
                    api.getPrescriptions().catch(() => []),
                    api.getReminders().catch(() => []),
                ]);
                setUser(userData);
                setPrescriptions(rxData);
                setReminders(reminderData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                    <Pulse size={24} className="absolute inset-0 m-auto text-cyan-400 animate-pulse" />
                </div>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Dashboard...</p>
            </div>
        );
    }

    const totalRx = prescriptions.length;
    const verifiedRx = prescriptions.filter((p: any) => p.status === 'verified').length;
    const activeReminders = reminders.filter((r: any) => r.status === 'active').length;
    const totalMedicines = prescriptions.reduce((sum: number, p: any) => sum + (p.medicines?.length || 0), 0);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                        <FirstAid size={28} weight="duotone" className="text-cyan-400" />
                        Patient Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Welcome back, <span className="text-slate-300 font-medium">{user?.name || 'Patient'}</span>!</p>
                </div>
                <Link href="/dashboard/upload"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-cyan-950/40 to-cyan-900/20 border border-cyan-700/50 rounded-xl hover:border-cyan-500/70 transition-all">
                    <UploadSimple size={20} weight="duotone" className="text-cyan-400" />
                    <span className="text-cyan-400 font-bold text-sm uppercase tracking-wider">Scan Prescription</span>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DataCard title="Total Prescriptions" value={totalRx} icon={ClipboardText} color="cyan" />
                <DataCard title="Verified" value={verifiedRx} icon={Pill} color="green" />
                <DataCard title="Medicines Found" value={totalMedicines} icon={Stethoscope} color="purple" />
                <DataCard title="Active Reminders" value={activeReminders} icon={Bell} color="orange" />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Prescriptions */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
                    <Sparkle size={80} weight="duotone" className="absolute -right-4 -top-4 text-slate-700/20" />
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <ClipboardText size={16} weight="duotone" />
                        Recent Prescriptions
                    </h3>
                    <div className="space-y-3 relative z-10">
                        {prescriptions.length === 0 ? (
                            <p className="text-slate-600 text-sm font-mono">No prescriptions yet. Upload one to get started!</p>
                        ) : (
                            prescriptions.slice(0, 4).map((rx: any) => (
                                <Link key={rx.id} href={`/dashboard/prescriptions/${rx.id}`}
                                    className="flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800/50 transition-colors">
                                    <div>
                                        <span className="text-slate-300 text-sm font-medium">RX-{rx.id}</span>
                                        <span className="text-slate-600 text-xs ml-2">{rx.doctorName || 'Unknown Doctor'}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full border font-mono uppercase ${rx.status === 'verified' ? 'status-verified' :
                                        rx.status === 'processed' ? 'status-processed' :
                                            rx.status === 'error' ? 'status-failed' : 'status-pending'
                                        }`}>{rx.status}</span>
                                </Link>
                            ))
                        )}
                    </div>
                    {prescriptions.length > 0 && (
                        <Link href="/dashboard/prescriptions" className="mt-4 flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                            View All <ArrowRight size={16} />
                        </Link>
                    )}
                </div>

                {/* Active Reminders */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
                    <Sparkle size={80} weight="duotone" className="absolute -right-4 -top-4 text-slate-700/20" />
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <Bell size={16} weight="duotone" />
                        Active Reminders
                    </h3>
                    <div className="space-y-3 relative z-10">
                        {reminders.filter((r: any) => r.status === 'active').length === 0 ? (
                            <p className="text-slate-600 text-sm font-mono">No active reminders.</p>
                        ) : (
                            reminders.filter((r: any) => r.status === 'active').slice(0, 4).map((rem: any) => (
                                <div key={rem.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3">
                                    <div>
                                        <span className="text-slate-300 text-sm font-medium">{rem.medicineName}</span>
                                        <span className="text-orange-400 text-xs ml-2">{rem.dose}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-400 text-xs font-mono">{rem.time}</span>
                                        <span className="text-slate-600 text-xs ml-2">{rem.period}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <Link href="/dashboard/reminders" className="mt-4 flex items-center justify-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                        Manage Reminders <ArrowRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
                <Sparkle size={80} weight="duotone" className="absolute -right-4 -top-4 text-slate-700/20" />
                <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Gauge size={16} weight="duotone" />
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                    <Link href="/dashboard/upload"
                        className="flex items-center justify-between p-4 bg-gradient-to-br from-cyan-950/30 to-cyan-900/10 border border-cyan-700/30 rounded-xl hover:border-cyan-500/50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-cyan-900/40 rounded-xl"><UploadSimple size={24} weight="duotone" className="text-cyan-400" /></div>
                            <div>
                                <span className="text-slate-200 font-bold block">Upload Prescription</span>
                                <span className="text-xs text-slate-500">Scan & extract medicines</span>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                    <Link href="/dashboard/prescriptions"
                        className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-950/30 to-purple-900/10 border border-purple-700/30 rounded-xl hover:border-purple-500/50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-900/40 rounded-xl"><Pill size={24} weight="duotone" className="text-purple-400" /></div>
                            <div>
                                <span className="text-slate-200 font-bold block">My Prescriptions</span>
                                <span className="text-xs text-slate-500">View & manage history</span>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                    <Link href="/dashboard/reminders"
                        className="flex items-center justify-between p-4 bg-gradient-to-br from-orange-950/30 to-orange-900/10 border border-orange-700/30 rounded-xl hover:border-orange-500/50 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-900/40 rounded-xl"><Bell size={24} weight="duotone" className="text-orange-400" /></div>
                            <div>
                                <span className="text-slate-200 font-bold block">Reminders</span>
                                <span className="text-xs text-slate-500">Medicine schedule & SMS</span>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
