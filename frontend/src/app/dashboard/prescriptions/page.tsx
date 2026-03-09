'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Pill, Pulse, Trash, Eye, Sparkle } from '@phosphor-icons/react';
import Link from 'next/link';

export default function PrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getPrescriptions().then(setPrescriptions).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this prescription?')) return;
        try {
            await api.deletePrescription(id);
            setPrescriptions(prev => prev.filter(p => p.id !== id));
        } catch (err: any) { alert(err.message); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-cyan-500 animate-spin" />
                    <Pulse size={24} className="absolute inset-0 m-auto text-cyan-400 animate-pulse" />
                </div>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                        <Pill size={28} weight="duotone" className="text-purple-400" />
                        My Prescriptions
                    </h1>
                    <p className="text-slate-500 mt-1">{prescriptions.length} prescription(s)</p>
                </div>
                <Link href="/dashboard/upload" className="btn-medical">Upload New</Link>
            </div>

            {prescriptions.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-12 text-center">
                    <Sparkle size={48} weight="duotone" className="text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono">No prescriptions found. Upload one to get started!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {prescriptions.map((rx: any) => (
                        <div key={rx.id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 hover:border-slate-500 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-purple-950/50 border border-purple-800/50 flex items-center justify-center">
                                        <Pill size={24} weight="duotone" className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-slate-200 font-bold">Prescription RX-{rx.id}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-slate-500 text-xs font-mono">{rx.doctorName || 'Unknown Doctor'}</span>
                                            <span className="text-slate-700">•</span>
                                            <span className="text-slate-500 text-xs font-mono">{new Date(rx.createdAt).toLocaleDateString()}</span>
                                            <span className="text-slate-700">•</span>
                                            <span className="text-slate-500 text-xs font-mono">{rx.medicines?.length || 0} medicines</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-3 py-1 rounded-full border font-mono uppercase ${rx.status === 'verified' ? 'status-verified' :
                                        rx.status === 'processed' ? 'status-processed' :
                                            rx.status === 'error' ? 'status-failed' : 'status-pending'
                                        }`}>{rx.status}</span>
                                    <Link href={`/dashboard/prescriptions/${rx.id}`}
                                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors">
                                        <Eye size={18} />
                                    </Link>
                                    <button onClick={() => handleDelete(rx.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
