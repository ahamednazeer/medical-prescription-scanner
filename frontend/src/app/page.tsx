'use client';

import React, { useState, useEffect } from 'react';
import { FirstAid, Lock, EnvelopeSimple } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const token = api.getToken();
        if (!token) { setCheckingAuth(false); return; }
        const userData = await api.getMe();
        const route = userData.role === 'admin' ? '/admin' : '/dashboard';
        router.replace(route);
      } catch {
        api.clearToken();
        setCheckingAuth(false);
      }
    }
    checkExistingAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
        <div className="relative z-10 text-center space-y-4">
          <FirstAid size={48} className="text-cyan-500 animate-pulse mx-auto" />
          <div className="text-slate-500 font-mono text-sm animate-pulse">VERIFYING SESSION...</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.login(email, password);
      const route = response.user.role === 'admin' ? '/admin' : '/dashboard';
      router.push(route);
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
            <h1 className="text-3xl font-chivo font-bold uppercase tracking-wider text-center">
              MedScan
            </h1>
            <p className="text-slate-400 text-sm mt-2">AI-Powered Prescription Scanner</p>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-sm p-3 mb-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-sm placeholder:text-slate-600 font-mono text-sm pl-10 pr-3 py-2.5 border outline-none"
                  placeholder="••••••••" disabled={loading} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-sm font-medium tracking-wide uppercase text-sm px-4 py-3 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Authenticating...' : 'Access System'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{' '}
              <button onClick={() => router.push('/register')} className="text-cyan-400 hover:text-cyan-300 font-medium">
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
