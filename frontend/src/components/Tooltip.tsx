'use client';

import { ReactNode } from 'react';

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
    content: string;
    children: ReactNode;
    side?: TooltipSide;
    disabled?: boolean;
    className?: string;
}

const sideClasses: Record<TooltipSide, string> = {
    top: 'left-1/2 -translate-x-1/2 bottom-full mb-2',
    right: 'left-full ml-3 top-1/2 -translate-y-1/2',
    bottom: 'left-1/2 -translate-x-1/2 top-full mt-2',
    left: 'right-full mr-3 top-1/2 -translate-y-1/2',
};

export default function Tooltip({
    content,
    children,
    side = 'top',
    disabled = false,
    className = '',
}: TooltipProps) {
    if (disabled) {
        return <>{children}</>;
    }

    return (
        <span className={`relative inline-flex group/tooltip ${className}`}>
            {children}
            <span
                role="tooltip"
                className={`pointer-events-none absolute z-[120] whitespace-nowrap rounded-md border border-cyan-500/40 bg-slate-900/95 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-cyan-100 opacity-0 shadow-[0_6px_20px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${sideClasses[side]}`}
            >
                {content}
            </span>
        </span>
    );
}
