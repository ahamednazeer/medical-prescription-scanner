'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
    Pill, Pulse, CheckCircle, PencilSimple,
    Bell, Sparkle, ArrowLeft, FloppyDisk,
} from '@phosphor-icons/react';

export default function PrescriptionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const [prescription, setPrescription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editMedicines, setEditMedicines] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [showReminder, setShowReminder] = useState(false);
    const [phone, setPhone] = useState('');
    const [creatingReminders, setCreatingReminders] = useState(false);

    useEffect(() => {
        api.getPrescription(id)
            .then((rx) => {
                setPrescription(rx);
                let medicines = rx.medicines || [];
                if (typeof window !== 'undefined') {
                    const draftKey = `pending-medicines-${id}`;
                    const draft = sessionStorage.getItem(draftKey);
                    if (draft) {
                        try {
                            const parsed = JSON.parse(draft);
                            if (Array.isArray(parsed)) medicines = parsed;
                        } catch {
                            // Ignore malformed draft and use server data.
                        }
                        sessionStorage.removeItem(draftKey);
                    }
                }
                setEditMedicines(medicines);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleVerify = async () => {
        setSaving(true);
        try {
            const updated = await api.verifyPrescription(id, { medicines: editMedicines });
            setPrescription(updated);
            setEditing(false);
        } catch (err: any) { alert(err.message); }
        finally { setSaving(false); }
    };

    const handleCreateReminders = async () => {
        if (!phone) { alert('Please enter a phone number'); return; }
        setCreatingReminders(true);
        try {
            await api.createRemindersFromPrescription({
                prescriptionId: id,
                phone,
                medicines: editMedicines.map(m => ({
                    name: m.name, dose: m.dose, frequency: m.frequency, duration: m.duration,
                })),
            });
            alert('Reminders created! SMS will be sent at scheduled times.');
            setShowReminder(false);
        } catch (err: any) { alert(err.message); }
        finally { setCreatingReminders(false); }
    };

    const updateMedicine = (index: number, field: string, value: string) => {
        setEditMedicines(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    };

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

    if (!prescription) {
        return <div className="text-center text-red-400 py-16">Prescription not found</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
                <ArrowLeft size={16} /> Back
            </button>

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider">Prescription RX-{prescription.id}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-slate-500 text-xs font-mono">{prescription.doctorName || 'Doctor not specified'}</span>
                        <span className={`text-xs px-3 py-1 rounded-full border font-mono uppercase ${prescription.status === 'verified' ? 'status-verified' :
                            prescription.status === 'processed' ? 'status-processed' : 'status-pending'
                            }`}>{prescription.status}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    {prescription.status !== 'verified' && (
                        <button onClick={() => setEditing(!editing)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-all">
                            <PencilSimple size={16} /> {editing ? 'Cancel' : 'Edit & Verify'}
                        </button>
                    )}
                    <button onClick={() => setShowReminder(!showReminder)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                        <Bell size={16} weight="duotone" /> Set Reminders
                    </button>
                </div>
            </div>

            {/* Prescription Image */}
            {prescription.imageUrl && (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                    <img src={api.getImageUrl(prescription.imageUrl)} alt="Prescription"
                        className="max-h-80 mx-auto rounded-lg" />
                </div>
            )}

            {/* Reminder Setup */}
            {showReminder && (
                <div className="bg-orange-950/20 border border-orange-700/50 rounded-xl p-6 animate-scale-in">
                    <h3 className="text-sm font-mono text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Bell size={16} weight="duotone" /> Create Medicine Reminders
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">SMS reminders will be sent to your phone at scheduled times based on the medicine frequency.</p>
                    <div className="flex gap-3">
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="flex-1 input-modern" />
                        <button onClick={handleCreateReminders} disabled={creatingReminders}
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-sm font-medium text-sm uppercase tracking-wide disabled:opacity-50 transition-all">
                            {creatingReminders ? 'Creating...' : 'Create Reminders'}
                        </button>
                    </div>
                </div>
            )}

            {/* Medicines */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Pill size={16} weight="duotone" />
                        Medicines ({editMedicines.length})
                    </h3>
                    {editing && (
                        <button onClick={handleVerify} disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_10px_rgba(34,197,94,0.4)] disabled:opacity-50">
                            <FloppyDisk size={16} /> {saving ? 'Saving...' : 'Save & Verify'}
                        </button>
                    )}
                </div>
                <div className="space-y-4">
                    {editMedicines.map((med: any, i: number) => (
                        <div key={i} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
                            {editing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-slate-500 text-xs font-mono block mb-1">MEDICINE NAME</label>
                                        <input value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} className="input-modern" />
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs font-mono block mb-1">DOSE</label>
                                        <input value={med.dose} onChange={(e) => updateMedicine(i, 'dose', e.target.value)} className="input-modern" />
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs font-mono block mb-1">FREQUENCY</label>
                                        <input value={med.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} className="input-modern" />
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs font-mono block mb-1">DURATION</label>
                                        <input value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} className="input-modern" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-slate-500 text-xs font-mono block mb-1">INSTRUCTIONS</label>
                                        <input value={med.instructions || ''} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)} className="input-modern" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-slate-200 font-bold text-lg flex items-center gap-2">
                                                {med.name}
                                                {med.validated && <CheckCircle size={16} className="text-green-400" />}
                                            </p>
                                            <div className="flex flex-wrap gap-3 mt-2">
                                                <span className="text-cyan-400 text-xs font-mono bg-cyan-950/50 border border-cyan-800/50 px-2 py-1 rounded">{med.dose}</span>
                                                <span className="text-purple-400 text-xs font-mono bg-purple-950/50 border border-purple-800/50 px-2 py-1 rounded">{med.frequency}</span>
                                                <span className="text-orange-400 text-xs font-mono bg-orange-950/50 border border-orange-800/50 px-2 py-1 rounded">{med.duration}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {med.instructions && med.instructions !== 'Not specified' && (
                                        <p className="text-slate-500 text-xs mt-2 font-mono">💡 {med.instructions}</p>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Raw Text */}
            {prescription.rawText && (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6">
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sparkle size={16} weight="duotone" /> OCR Raw Text
                    </h3>
                    <pre className="text-slate-400 text-sm font-mono whitespace-pre-wrap bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                        {prescription.rawText}
                    </pre>
                </div>
            )}
        </div>
    );
}
