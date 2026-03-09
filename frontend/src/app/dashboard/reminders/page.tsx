'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import {
    Bell,
    Clock,
    Funnel,
    PaperPlaneRight,
    Plus,
    Pulse,
    ShieldCheck,
    Sparkle,
    Trash,
    WarningCircle,
} from '@phosphor-icons/react';
import Tooltip from '@/components/Tooltip';

type ReminderStatus = 'active' | 'paused' | 'completed' | 'cancelled';
type Bucket = 'Morning' | 'Afternoon' | 'Night' | 'Other';
type Severity = 'high' | 'medium' | 'low';

interface Reminder {
    id: number;
    medicineName: string;
    dose?: string;
    time: string;
    period?: string;
    phone: string;
    status: ReminderStatus | string;
    frequency?: string;
    duration?: string;
    sentCount: number;
    lastSentAt?: string;
}

interface ReminderDraft {
    medicineName: string;
    dose: string;
    time: string;
    phone: string;
    frequency: string;
    duration: string;
}

interface InteractionWarning {
    severity: Severity;
    message: string;
    pair: [string, string];
    source: 'openfda' | 'heuristic';
}

interface MeterResult {
    score: number;
    level: 'Good' | 'Caution' | 'High Risk';
    warnings: InteractionWarning[];
    source: 'openfda' | 'heuristic';
    disclaimer: string;
    unmatched?: string[];
}

interface ApiDrugMeterResult {
    score: number;
    level: 'Good' | 'Caution' | 'High Risk';
    warnings: InteractionWarning[];
    checked: string[];
    unmatched: string[];
    source: 'openfda';
    disclaimer: string;
}

const NEW_REMINDER_DEFAULT: ReminderDraft = {
    medicineName: '',
    dose: '',
    time: '08:00',
    phone: '',
    frequency: 'Once daily',
    duration: '7 days',
};

const BUCKET_ORDER: Bucket[] = ['Morning', 'Afternoon', 'Night', 'Other'];

const BUCKET_META: Record<Bucket, { range: string; accent: string }> = {
    Morning: { range: '05:00 - 11:59', accent: 'text-cyan-300' },
    Afternoon: { range: '12:00 - 16:59', accent: 'text-orange-300' },
    Night: { range: '17:00 - 23:59', accent: 'text-purple-300' },
    Other: { range: '00:00 - 04:59', accent: 'text-slate-300' },
};

const getTimeMinutes = (value: string): number => {
    const [h, m] = value.split(':').map((v) => Number(v) || 0);
    return h * 60 + m;
};

const inferBucket = (rem: Reminder): Bucket => {
    if (rem.period) {
        const p = rem.period.toLowerCase();
        if (p.includes('morning')) return 'Morning';
        if (p.includes('afternoon') || p.includes('noon')) return 'Afternoon';
        if (p.includes('night') || p.includes('evening')) return 'Night';
    }
    const mins = getTimeMinutes(rem.time);
    if (mins >= 300 && mins < 720) return 'Morning';
    if (mins >= 720 && mins < 1020) return 'Afternoon';
    if (mins >= 1020) return 'Night';
    return 'Other';
};

const normalizeMedicineName = (value: string): string =>
    value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const hasAny = (value: string, keywords: string[]) => keywords.some((k) => value.includes(k));

const isNsaid = (value: string) =>
    hasAny(value, ['ibuprofen', 'diclofenac', 'naproxen', 'ketorolac', 'aceclofenac', 'etoricoxib', 'aspirin']);

const isAntiplatelet = (value: string) =>
    hasAny(value, ['aspirin', 'clopidogrel', 'prasugrel', 'ticagrelor']);

const isAnticoagulant = (value: string) =>
    hasAny(value, ['warfarin', 'apixaban', 'rivaroxaban', 'dabigatran', 'heparin', 'enoxaparin']);

const isParacetamol = (value: string) =>
    hasAny(value, ['paracetamol', 'acetaminophen']);

const isDuplicateDrug = (a: string, b: string) => {
    const tokensA = new Set(a.split(' '));
    const tokensB = b.split(' ');
    let overlaps = 0;
    tokensB.forEach((t) => {
        if (t.length > 3 && tokensA.has(t)) overlaps += 1;
    });
    return overlaps > 0;
};

const evaluatePair = (a: string, b: string): InteractionWarning[] => {
    const warnings: InteractionWarning[] = [];

    if (isDuplicateDrug(a, b)) {
        warnings.push({
            severity: 'high',
            message: 'Possible duplicate medicine names. Confirm both are required.',
            pair: [a, b],
            source: 'heuristic',
        });
    }

    if (isNsaid(a) && isNsaid(b) && a !== b) {
        warnings.push({
            severity: 'high',
            message: 'Two NSAIDs together can increase bleeding, stomach, and kidney risk.',
            pair: [a, b],
            source: 'heuristic',
        });
    }

    if (
        (isAnticoagulant(a) && (isNsaid(b) || isAntiplatelet(b))) ||
        (isAnticoagulant(b) && (isNsaid(a) || isAntiplatelet(a)))
    ) {
        warnings.push({
            severity: 'high',
            message: 'Blood thinner + NSAID/antiplatelet can significantly raise bleeding risk.',
            pair: [a, b],
            source: 'heuristic',
        });
    }

    if (isAntiplatelet(a) && isAntiplatelet(b) && a !== b) {
        warnings.push({
            severity: 'medium',
            message: 'Multiple antiplatelets may require close doctor supervision.',
            pair: [a, b],
            source: 'heuristic',
        });
    }

    if (isParacetamol(a) && isParacetamol(b) && a !== b) {
        warnings.push({
            severity: 'medium',
            message: 'Paracetamol appears in multiple medicines. Watch total daily dose.',
            pair: [a, b],
            source: 'heuristic',
        });
    }

    return warnings;
};

const analyzeDrugMeter = (reminders: Reminder[]): MeterResult => {
    const uniqueNames = Array.from(
        new Set(
            reminders
                .map((r) => normalizeMedicineName(r.medicineName))
                .filter((name) => name.length > 0),
        ),
    );

    const warnings: InteractionWarning[] = [];
    for (let i = 0; i < uniqueNames.length; i += 1) {
        for (let j = i + 1; j < uniqueNames.length; j += 1) {
            warnings.push(...evaluatePair(uniqueNames[i], uniqueNames[j]));
        }
    }

    const high = warnings.filter((w) => w.severity === 'high').length;
    const medium = warnings.filter((w) => w.severity === 'medium').length;
    const low = warnings.filter((w) => w.severity === 'low').length;
    const score = Math.max(0, 100 - high * 30 - medium * 15 - low * 8);
    const level = score >= 80 ? 'Good' : score >= 55 ? 'Caution' : 'High Risk';

    return {
        score,
        level,
        warnings,
        source: 'heuristic',
        disclaimer:
            'Heuristic fallback is active. Connect internet/API for FDA label-based interaction checks.',
    };
};

const getErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
};

export default function RemindersPage() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | ReminderStatus>('all');
    const [search, setSearch] = useState('');
    const [newReminder, setNewReminder] = useState<ReminderDraft>(NEW_REMINDER_DEFAULT);
    const [apiDrugMeter, setApiDrugMeter] = useState<ApiDrugMeterResult | null>(null);

    useEffect(() => {
        api.getReminders()
            .then((items) => setReminders(items as Reminder[]))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return reminders.filter((rem) => {
            const statusMatch = statusFilter === 'all' || rem.status === statusFilter;
            const text = `${rem.medicineName} ${rem.dose || ''} ${rem.time} ${rem.frequency || ''}`.toLowerCase();
            const queryMatch = !q || text.includes(q);
            return statusMatch && queryMatch;
        });
    }, [reminders, search, statusFilter]);

    const activeReminders = useMemo(
        () => filtered.filter((r) => r.status === 'active').sort((a, b) => getTimeMinutes(a.time) - getTimeMinutes(b.time)),
        [filtered],
    );

    const nonActiveReminders = useMemo(
        () => filtered.filter((r) => r.status !== 'active').sort((a, b) => getTimeMinutes(a.time) - getTimeMinutes(b.time)),
        [filtered],
    );

    const groupedActive = useMemo(() => {
        const groups: Record<Bucket, Reminder[]> = {
            Morning: [],
            Afternoon: [],
            Night: [],
            Other: [],
        };
        activeReminders.forEach((rem) => groups[inferBucket(rem)].push(rem));
        return groups;
    }, [activeReminders]);

    const todayIso = new Date().toISOString().split('T')[0];
    const sentToday = reminders.filter((r) => r.lastSentAt?.startsWith(todayIso)).length;
    const uniqueTimes = new Set(activeReminders.map((r) => r.time)).size;
    const activeMedicineNames = useMemo(
        () =>
            Array.from(
                new Set(
                    activeReminders
                        .map((r) => r.medicineName?.trim())
                        .filter((name): name is string => Boolean(name)),
                ),
            ),
        [activeReminders],
    );
    const heuristicMeter = useMemo(() => analyzeDrugMeter(activeReminders), [activeReminders]);
    const drugMeter: MeterResult = activeMedicineNames.length >= 2 && apiDrugMeter
        ? apiDrugMeter
        : heuristicMeter;

    useEffect(() => {
        if (activeMedicineNames.length < 2) return;

        let cancelled = false;

        api.checkDrugInteractions(activeMedicineNames)
            .then((result) => {
                if (!cancelled) {
                    setApiDrugMeter(result as ApiDrugMeterResult);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setApiDrugMeter(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [activeMedicineNames]);

    const handleAdd = async () => {
        if (!newReminder.medicineName.trim() || !newReminder.phone.trim()) {
            alert('Medicine name and phone are required.');
            return;
        }
        try {
            const created = await api.createReminder(newReminder);
            setReminders((prev) => [...prev, created as Reminder]);
            setShowAdd(false);
            setNewReminder(NEW_REMINDER_DEFAULT);
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Failed to create reminder'));
        }
    };

    const handleTrigger = async (id: number) => {
        try {
            const result = await api.triggerReminder(id);
            if (result?.sent) {
                setReminders((prev) =>
                    prev.map((r) =>
                        r.id === id
                            ? { ...r, sentCount: (r.sentCount || 0) + 1, lastSentAt: new Date().toISOString() }
                            : r,
                    ),
                );
                alert('SMS sent successfully.');
            } else {
                alert('Reminder not sent.');
            }
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Failed to send reminder'));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this reminder?')) return;
        try {
            await api.deleteReminder(id);
            setReminders((prev) => prev.filter((r) => r.id !== id));
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Failed to delete reminder'));
        }
    };

    const handleToggle = async (id: number, currentStatus: string) => {
        const newStatus: ReminderStatus = currentStatus === 'active' ? 'paused' : 'active';
        try {
            const updated = await api.updateReminder(id, { status: newStatus });
            setReminders((prev) => prev.map((r) => (r.id === id ? (updated as Reminder) : r)));
        } catch (err: unknown) {
            alert(getErrorMessage(err, 'Failed to update reminder'));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-orange-500 animate-spin" />
                    <Pulse size={24} className="absolute inset-0 m-auto text-orange-400 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                        <Bell size={28} weight="duotone" className="text-orange-400" />
                        Medicine Reminders
                    </h1>
                    <p className="text-slate-500 mt-1">Organized reminders with safety meter</p>
                </div>
                <button
                    onClick={() => setShowAdd((prev) => !prev)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                >
                    <Plus size={16} /> Add Reminder
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                    <p className="text-slate-500 text-xs font-mono uppercase">Active</p>
                    <p className="text-2xl font-chivo mt-1">{activeReminders.length}</p>
                </div>
                <div className="card">
                    <p className="text-slate-500 text-xs font-mono uppercase">Today Sent</p>
                    <p className="text-2xl font-chivo mt-1">{sentToday}</p>
                </div>
                <div className="card">
                    <p className="text-slate-500 text-xs font-mono uppercase">Daily Time Slots</p>
                    <p className="text-2xl font-chivo mt-1">{uniqueTimes}</p>
                </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h3 className="text-sm font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={16} weight="duotone" className="text-cyan-300" />
                            Drug Meter
                        </h3>
                        <p className="text-slate-500 text-xs mt-2">
                            {drugMeter.disclaimer}
                        </p>
                        <p className="text-slate-600 text-[11px] font-mono mt-2 uppercase">
                            Source: {drugMeter.source === 'openfda' ? 'FDA Labeling API' : 'Heuristic Fallback'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-mono text-slate-500 uppercase">Score</p>
                        <p className={`text-2xl font-chivo ${drugMeter.score >= 80 ? 'text-green-400' : drugMeter.score >= 55 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {drugMeter.score}
                        </p>
                        <p className="text-xs font-mono text-slate-400 uppercase">{drugMeter.level}</p>
                    </div>
                </div>
                <div className="mt-3 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div
                        className={`h-full ${drugMeter.score >= 80 ? 'bg-green-500' : drugMeter.score >= 55 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${drugMeter.score}%` }}
                    />
                </div>
                {drugMeter.warnings.length > 0 ? (
                    <div className="mt-4 space-y-2">
                        {drugMeter.warnings.slice(0, 5).map((warning, idx) => (
                            <div key={`${warning.message}-${idx}`} className="text-xs font-mono bg-slate-900/60 border border-slate-700 rounded-md px-3 py-2 flex items-start gap-2">
                                <WarningCircle size={14} className={warning.severity === 'high' ? 'text-red-400 mt-0.5' : 'text-yellow-400 mt-0.5'} />
                                <span className="text-slate-300">
                                    {warning.message}{' '}
                                    <span className="text-slate-500">
                                        ({warning.pair[0]} + {warning.pair[1]})
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-green-400 text-xs font-mono mt-4">No obvious interaction pattern detected in active reminders.</p>
                )}
                {apiDrugMeter?.unmatched?.length ? (
                    <p className="text-yellow-400 text-[11px] font-mono mt-3">
                        Not matched in FDA labels: {apiDrugMeter.unmatched.join(', ')}
                    </p>
                ) : null}
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search medicine / dose / time"
                        className="input-modern pr-10"
                    />
                    <Funnel size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | ReminderStatus)}
                    className="input-modern max-w-[220px]"
                >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {showAdd && (
                <div className="bg-orange-950/20 border border-orange-700/50 rounded-xl p-6 animate-scale-in">
                    <h3 className="text-sm font-mono text-orange-400 uppercase tracking-widest mb-4">New Reminder</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-slate-500 text-xs font-mono block mb-1">Medicine Name</label>
                            <input
                                value={newReminder.medicineName}
                                onChange={(e) => setNewReminder((p) => ({ ...p, medicineName: e.target.value }))}
                                className="input-modern"
                                placeholder="Paracetamol"
                            />
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs font-mono block mb-1">Dose</label>
                            <input
                                value={newReminder.dose}
                                onChange={(e) => setNewReminder((p) => ({ ...p, dose: e.target.value }))}
                                className="input-modern"
                                placeholder="500mg"
                            />
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs font-mono block mb-1">Phone Number</label>
                            <input
                                value={newReminder.phone}
                                onChange={(e) => setNewReminder((p) => ({ ...p, phone: e.target.value }))}
                                className="input-modern"
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs font-mono block mb-1">Time</label>
                            <input
                                type="time"
                                value={newReminder.time}
                                onChange={(e) => setNewReminder((p) => ({ ...p, time: e.target.value }))}
                                className="input-modern"
                            />
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs font-mono block mb-1">Frequency</label>
                            <select
                                value={newReminder.frequency}
                                onChange={(e) => setNewReminder((p) => ({ ...p, frequency: e.target.value }))}
                                className="input-modern"
                            >
                                <option>Once daily</option>
                                <option>Twice daily</option>
                                <option>Three times a day</option>
                                <option>Four times a day</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs font-mono block mb-1">Duration</label>
                            <input
                                value={newReminder.duration}
                                onChange={(e) => setNewReminder((p) => ({ ...p, duration: e.target.value }))}
                                className="input-modern"
                                placeholder="7 days"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleAdd} className="btn-success">Create Reminder</button>
                        <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                    </div>
                </div>
            )}

            {activeReminders.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Sparkle size={16} weight="duotone" />
                        Active Schedule
                    </h3>
                    {BUCKET_ORDER.map((bucket) => {
                        const items = groupedActive[bucket];
                        if (!items.length) return null;
                        return (
                            <div key={bucket} className="bg-slate-800/35 border border-slate-700/60 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className={`text-sm font-mono uppercase tracking-wider ${BUCKET_META[bucket].accent}`}>{bucket}</p>
                                    <p className="text-xs font-mono text-slate-500">{BUCKET_META[bucket].range}</p>
                                </div>
                                <div className="grid gap-3">
                                    {items.map((rem) => (
                                        <div key={rem.id} className="bg-slate-900/55 border border-slate-800 rounded-xl p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-slate-200 font-bold">
                                                        {rem.medicineName}{' '}
                                                        <span className="text-cyan-400 text-sm font-normal">{rem.dose || ''}</span>
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono">
                                                        <span className="text-slate-400 flex items-center gap-1">
                                                            <Clock size={12} /> {rem.time}
                                                        </span>
                                                        <span className="text-slate-600">•</span>
                                                        <span className="text-slate-500">{rem.frequency || 'daily'}</span>
                                                        <span className="text-slate-600">•</span>
                                                        <span className="text-slate-500">{rem.duration || 'Not specified'}</span>
                                                        <span className="text-slate-600">•</span>
                                                        <span className="text-slate-500">{rem.sentCount || 0} SMS sent</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Tooltip content="Send SMS now">
                                                        <button
                                                            onClick={() => handleTrigger(rem.id)}
                                                            className="p-2 text-orange-400 hover:bg-orange-950/50 rounded-lg transition-colors"
                                                            title="Send SMS now"
                                                        >
                                                            <PaperPlaneRight size={18} />
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip content={rem.status === 'active' ? 'Pause reminder' : 'Resume reminder'}>
                                                        <button
                                                            onClick={() => handleToggle(rem.id, rem.status)}
                                                            className="p-2 text-yellow-400 hover:bg-yellow-950/50 rounded-lg transition-colors text-xs font-mono"
                                                            title={rem.status === 'active' ? 'Pause reminder' : 'Resume reminder'}
                                                        >
                                                            {rem.status === 'active' ? 'PAUSE' : 'RESUME'}
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip content="Delete reminder">
                                                        <button
                                                            onClick={() => handleDelete(rem.id)}
                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                            title="Delete reminder"
                                                        >
                                                            <Trash size={18} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {nonActiveReminders.length > 0 && (
                <div>
                    <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-4">Paused / Completed / Cancelled</h3>
                    <div className="grid gap-3 opacity-70">
                        {nonActiveReminders.map((rem) => (
                            <div key={rem.id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-300">
                                            {rem.medicineName} <span className="text-cyan-400">{rem.dose || ''}</span>
                                        </p>
                                        <p className="text-xs font-mono text-slate-500 mt-1">
                                            {rem.time} • {rem.status}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {rem.status === 'paused' && (
                                            <button
                                                onClick={() => handleToggle(rem.id, rem.status)}
                                                className="text-xs text-green-400 font-mono px-2 py-1 rounded border border-green-700/50 hover:bg-green-950/40"
                                            >
                                                RESUME
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(rem.id)}
                                            className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-12 text-center">
                    <Bell size={48} weight="duotone" className="text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono">No reminders found for current filters.</p>
                </div>
            )}
        </div>
    );
}
