import React from 'react';

interface DataCardProps {
    title: string;
    value: string | number;
    icon?: React.ElementType;
    className?: string;
    color?: string;
}

export function DataCard({
    title,
    value,
    icon: Icon,
    className = '',
    color = 'blue',
}: DataCardProps) {
    const colorMap: Record<string, string> = {
        blue: 'text-blue-400',
        cyan: 'text-cyan-400',
        green: 'text-green-400',
        purple: 'text-purple-400',
        orange: 'text-orange-400',
        red: 'text-red-400',
    };

    return (
        <div className={`bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 transition-all duration-200 hover:border-slate-500 ${className}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-mono mb-2">{title}</p>
                    <p className="text-3xl font-bold font-mono text-slate-100">{value}</p>
                </div>
                {Icon && (
                    <div className={colorMap[color] || 'text-blue-400'}>
                        <Icon size={28} weight="duotone" />
                    </div>
                )}
            </div>
        </div>
    );
}
