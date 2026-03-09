'use client';

import React, { useState } from 'react';
import { FirstAid, Lock, EnvelopeSimple, User, Phone } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await api.register({ name, email, password, phone });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
            style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <div className="scanlines" />

            <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
                <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-8 backdrop-blur-md">
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                            <FirstAid size={56} weight="duotone" className="text-cyan-400 relative" />
                        </div>
                        <h1 className="text-3xl font-chivo font-bold uppercase tracking-wider text-center">Create Account</h1>
                        <p className="text-slate-400 text-sm mt-2">Join the Medical Scanner Platform</p>
                    </div>

                    {error && (
                        <div className="bg-red-950/50 border border-red-800 rounded-sm p-3 mb-4 text-sm text-red-400">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                                    className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-sm placeholder:text-slate-600 font-mono text-sm pl-10 pr-3 py-2.5 border outline-none"
                                    placeholder="John Doe" disabled={loading} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Email</label>
                            <div className="relative">
                                <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                    className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-sm placeholder:text-slate-600 font-mono text-sm pl-10 pr-3 py-2.5 border outline-none"
                                    placeholder="you@example.com" disabled={loading} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-sm placeholder:text-slate-600 font-mono text-sm pl-10 pr-3 py-2.5 border outline-none"
                                    placeholder="+91 98765 43210" disabled={loading} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-sm placeholder:text-slate-600 font-mono text-sm pl-10 pr-3 py-2.5 border outline-none"
                                    placeholder="••••••••" disabled={loading} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                    className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-sm placeholder:text-slate-600 font-mono text-sm pl-10 pr-3 py-2.5 border outline-none"
                                    placeholder="••••••••" disabled={loading} />
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-sm font-medium tracking-wide uppercase text-sm px-4 py-3 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            Already have an account?{' '}
                            <button onClick={() => router.push('/')} className="text-cyan-400 hover:text-cyan-300 font-medium">
                                Login
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
