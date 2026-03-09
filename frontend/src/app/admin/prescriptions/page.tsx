'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ClipboardText, Pulse, Pill } from '@phosphor-icons/react';

export default function AdminPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAdminPrescriptions().then(setPrescriptions).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                    <Pulse size={24} className="absolute inset-0 m-auto text-cyan-400 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                    <ClipboardText size={28} weight="duotone" className="text-cyan-400" />
                    All Prescriptions
                </h1>
                <p className="text-slate-500 mt-1">{prescriptions.length} total prescriptions</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">ID</th>
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Patient</th>
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Doctor</th>
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Medicines</th>
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prescriptions.map((rx: any) => (
                            <tr key={rx.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-slate-200 font-mono">RX-{rx.id}</td>
                                <td className="px-6 py-4 text-slate-300">{rx.user?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 text-slate-400 text-sm">{rx.doctorName || '-'}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {rx.medicines?.slice(0, 3).map((m: any, i: number) => (
                                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-purple-950/50 border border-purple-800/50 text-purple-400 font-mono">{m.name}</span>
                                        ))}
                                        {rx.medicines?.length > 3 && <span className="text-xs text-slate-600">+{rx.medicines.length - 3}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs px-2 py-1 rounded-full border font-mono uppercase ${rx.status === 'verified' ? 'status-verified' :
                                        rx.status === 'processed' ? 'status-processed' :
                                            rx.status === 'error' ? 'status-failed' : 'status-pending'
                                        }`}>{rx.status}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-sm">{new Date(rx.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
