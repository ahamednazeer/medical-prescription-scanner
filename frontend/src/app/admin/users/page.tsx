'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Pulse } from '@phosphor-icons/react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAdminUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-purple-500 animate-spin" />
                    <Pulse size={24} className="absolute inset-0 m-auto text-purple-400 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
                    <Users size={28} weight="duotone" className="text-purple-400" />
                    User Management
                </h1>
                <p className="text-slate-500 mt-1">{users.length} total users</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Email</th>
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Phone</th>
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="text-left px-6 py-3 text-xs font-mono text-slate-500 uppercase tracking-wider">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user: any) => (
                            <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 text-slate-200 font-medium">{user.name}</td>
                                <td className="px-6 py-4 text-slate-400 font-mono text-sm">{user.email}</td>
                                <td className="px-6 py-4 text-slate-400 font-mono text-sm">{user.phone || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs px-2 py-1 rounded-full border font-mono uppercase ${user.role === 'admin' ? 'text-purple-400 bg-purple-950/50 border-purple-800' :
                                        user.role === 'doctor' ? 'text-green-400 bg-green-950/50 border-green-800' :
                                            'text-blue-400 bg-blue-950/50 border-blue-800'
                                        }`}>{user.role}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
