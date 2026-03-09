'use client';

import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Tooltip from '@/components/Tooltip';
import {
    UploadSimple, Image, Pulse, CheckCircle, XCircle,
    Sparkle, Pill, FirstAid, ArrowRight, Trash,
} from '@phosphor-icons/react';

export default function UploadPrescriptionPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const handleFile = (f: File) => {
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setError('');
        setResult(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const handleUploadAndProcess = async () => {
        if (!file) return;
        setError('');

        try {
            // Step 1: Upload
            setUploading(true);
            const prescription = await api.uploadPrescription(file);
            setUploading(false);

            // Step 2: Process with AI
            setProcessing(true);
            const processed = await api.processPrescription(prescription.id);
            setResult(processed);
            setProcessing(false);
        } catch (err: any) {
            setError(err.message || 'Failed to process prescription');
            setUploading(false);
            setProcessing(false);
        }
    };

    const handleRemoveMedicine = (index: number) => {
        setResult((prev: any) => {
            if (!prev?.medicines) return prev;
            return {
                ...prev,
                medicines: prev.medicines.filter((_: any, i: number) => i !== index),
            };
        });
    };

    const handleViewAndVerify = () => {
        if (typeof window !== 'undefined' && result?.prescription?.id) {
            sessionStorage.setItem(
                `pending-medicines-${result.prescription.id}`,
                JSON.stringify(result.medicines || []),
            );
        }
        router.push(`/dashboard/prescriptions/${result.prescription.id}`);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                    <UploadSimple size={28} weight="duotone" className="text-cyan-400" />
                    Upload Prescription
                </h1>
                <p className="text-slate-500 mt-1">Upload a prescription image to extract medicine details using AI</p>
            </div>

            {!result ? (
                <>
                    {/* Upload Zone */}
                    <div
                        className={`drop-zone cursor-pointer ${dragActive ? 'active' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                    >
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

                        {preview ? (
                            <div className="space-y-4">
                                <img src={preview} alt="Prescription preview" className="max-h-64 mx-auto rounded-lg border border-slate-700" />
                                <p className="text-slate-400 text-sm font-mono">{file?.name}</p>
                            </div>
                        ) : (
                            <div className="space-y-4 py-8">
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl animate-pulse" />
                                    <Image size={64} weight="duotone" className="text-cyan-400 relative mx-auto" />
                                </div>
                                <div>
                                    <p className="text-slate-300 font-medium text-lg">Drop prescription image here</p>
                                    <p className="text-slate-600 text-sm mt-1">or click to browse • JPG, PNG, WebP supported</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 flex items-center gap-3">
                            <XCircle size={20} className="text-red-400" />
                            <span className="text-red-400 text-sm">{error}</span>
                        </div>
                    )}

                    {file && (
                        <button onClick={handleUploadAndProcess}
                            disabled={uploading || processing}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium tracking-wide uppercase text-sm px-4 py-4 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                            {uploading ? (
                                <><Pulse size={20} className="animate-pulse" /> Uploading...</>
                            ) : processing ? (
                                <><Sparkle size={20} className="animate-pulse" /> AI Processing... Extracting Medicines</>
                            ) : (
                                <><FirstAid size={20} weight="duotone" /> Scan & Extract Medicines</>
                            )}
                        </button>
                    )}
                </>
            ) : (
                /* Results */
                <div className="space-y-6 animate-slide-up">
                    <div className="bg-green-950/30 border border-green-700/50 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle size={24} weight="duotone" className="text-green-400" />
                        <span className="text-green-400 font-medium">Prescription scanned successfully!</span>
                    </div>

                    {/* Prescription Info */}
                    {(result.prescription?.doctorName || result.prescription?.hospitalName) && (
                        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6">
                            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-3">Prescription Info</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {result.prescription?.doctorName && (
                                    <div>
                                        <p className="text-slate-600 text-xs font-mono">DOCTOR</p>
                                        <p className="text-slate-200">{result.prescription.doctorName}</p>
                                    </div>
                                )}
                                {result.prescription?.hospitalName && (
                                    <div>
                                        <p className="text-slate-600 text-xs font-mono">HOSPITAL</p>
                                        <p className="text-slate-200">{result.prescription.hospitalName}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Extracted Medicines */}
                    <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6">
                        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Pill size={16} weight="duotone" />
                            Extracted Medicines ({result.medicines?.length || 0})
                        </h3>
                        <div className="space-y-3">
                            {result.medicines?.length ? (
                                result.medicines.map((med: any, i: number) => (
                                    <div key={i} className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-slate-200 font-bold text-lg">{med.name}</p>
                                                <div className="flex flex-wrap gap-3 mt-2">
                                                    <Tooltip content={`Dose: ${med.dose}`}>
                                                        <span className="text-cyan-400 text-xs font-mono bg-cyan-950/50 border border-cyan-800/50 px-2 py-1 rounded">{med.dose}</span>
                                                    </Tooltip>
                                                    <Tooltip content={`Frequency: ${med.frequency}`}>
                                                        <span className="text-purple-400 text-xs font-mono bg-purple-950/50 border border-purple-800/50 px-2 py-1 rounded">{med.frequency}</span>
                                                    </Tooltip>
                                                    <Tooltip content={`Duration: ${med.duration}`}>
                                                        <span className="text-orange-400 text-xs font-mono bg-orange-950/50 border border-orange-800/50 px-2 py-1 rounded">{med.duration}</span>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <Tooltip content="Remove this medicine from extracted list" side="left">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMedicine(i)}
                                                    className="px-3 py-1.5 bg-red-950/40 border border-red-800/60 hover:bg-red-900/50 text-red-300 rounded-lg text-xs font-mono uppercase tracking-wide transition-colors flex items-center gap-1.5"
                                                    title="Remove this medicine from extracted list"
                                                    aria-label={`Remove ${med.name} from extracted medicines`}
                                                >
                                                    <Trash size={14} />
                                                    Remove
                                                </button>
                                            </Tooltip>
                                        </div>
                                        {med.instructions && med.instructions !== 'Not specified' && (
                                            <p className="text-slate-500 text-xs mt-2 font-mono">💡 {med.instructions}</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm border border-slate-800/50 rounded-xl p-4 bg-slate-900/30">
                                    No medicines selected. You can still continue and review this prescription.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button onClick={handleViewAndVerify}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium tracking-wide uppercase text-sm px-4 py-3 shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2">
                            View & Verify <ArrowRight size={16} />
                        </button>
                        <button onClick={() => { setFile(null); setPreview(''); setResult(null); }}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium tracking-wide uppercase text-sm transition-all">
                            Scan Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
