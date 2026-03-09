'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { UserCircle, Pulse, FloppyDisk, Phone, EnvelopeSimple, MapPin, FirstAid } from '@phosphor-icons/react';

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', age: '', address: '', emergencyContact: '', emergencyPhone: '' });

    useEffect(() => {
        api.getProfile().then((data) => {
            setProfile(data);
            setForm({
                name: data.name || '',
                phone: data.phone || '',
                age: data.age?.toString() || '',
                address: data.address || '',
                emergencyContact: data.emergencyContact || '',
                emergencyPhone: data.emergencyPhone || '',
            });
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await api.updateProfile({ ...form, age: form.age ? parseInt(form.age) : null });
            setProfile(updated);
            alert('Profile updated successfully!');
        } catch (err: any) { alert(err.message); }
        finally { setSaving(false); }
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

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                    <UserCircle size={28} weight="duotone" className="text-cyan-400" />
                    My Profile
                </h1>
                <p className="text-slate-500 mt-1">Manage your personal information</p>
            </div>

            {/* Profile Card */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <p className="text-slate-200 font-bold text-lg">{profile?.name}</p>
                        <p className="text-slate-500 text-sm font-mono">{profile?.email}</p>
                        <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/50 text-cyan-400 font-mono uppercase mt-1 inline-block">{profile?.role}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-slate-500 text-xs font-mono block mb-1">FULL NAME</label>
                        <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="input-modern" />
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs font-mono block mb-1 flex items-center gap-1"><Phone size={12} /> PHONE</label>
                        <input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="input-modern" placeholder="+91 98765 43210" />
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs font-mono block mb-1">AGE</label>
                        <input type="number" value={form.age} onChange={(e) => setForm(p => ({ ...p, age: e.target.value }))} className="input-modern" />
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs font-mono block mb-1 flex items-center gap-1"><MapPin size={12} /> ADDRESS</label>
                        <input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="input-modern" />
                    </div>
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6">
                <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FirstAid size={16} weight="duotone" /> Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-slate-500 text-xs font-mono block mb-1">CONTACT NAME</label>
                        <input value={form.emergencyContact} onChange={(e) => setForm(p => ({ ...p, emergencyContact: e.target.value }))} className="input-modern" />
                    </div>
                    <div>
                        <label className="text-slate-500 text-xs font-mono block mb-1">CONTACT PHONE</label>
                        <input value={form.emergencyPhone} onChange={(e) => setForm(p => ({ ...p, emergencyPhone: e.target.value }))} className="input-modern" />
                    </div>
                </div>
            </div>

            <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium tracking-wide uppercase text-sm px-4 py-3 shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50">
                <FloppyDisk size={16} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
        </div>
    );
}
