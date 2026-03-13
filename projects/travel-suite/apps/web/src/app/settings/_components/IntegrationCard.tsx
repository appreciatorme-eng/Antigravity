'use client';

import { type ReactNode } from 'react';
import { GlassButton } from '@/components/glass/GlassButton';
import { cn } from '@/lib/utils';

export interface IntegrationCardProps {
    readonly icon: ReactNode;
    readonly iconBg: string;
    readonly title: string;
    readonly description: string;
    readonly isConnected: boolean;
    readonly connectedLabel?: string;
    readonly buttonLabel: string;
    readonly onConnect: () => void;
    /** Use the larger card layout (11x11 icon, p-5 padding) */
    readonly large?: boolean;
}

export function IntegrationCard({
    icon,
    iconBg,
    title,
    description,
    isConnected,
    connectedLabel,
    buttonLabel,
    onConnect,
    large = false,
}: IntegrationCardProps) {
    if (large) {
        return (
            <div className="p-5 border border-gray-100 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-gray-50/50">
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-secondary">{title}</h4>
                        {isConnected && connectedLabel && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">&#x25CF; {connectedLabel}</span>
                        )}
                    </div>
                    <p className="text-xs text-text-muted">{description}</p>
                </div>
                <GlassButton
                    variant={isConnected ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={onConnect}
                    className={cn('text-xs shrink-0', isConnected ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : '')}
                >
                    {isConnected ? `${buttonLabel} \u2713` : buttonLabel}
                </GlassButton>
            </div>
        );
    }

    return (
        <div className="p-4 border border-gray-100 rounded-2xl hover:border-primary/30 transition-colors bg-gray-50/50 flex flex-col gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-secondary text-sm">
                    {title}
                    {isConnected && connectedLabel && (
                        <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">&#x25CF; {connectedLabel}</span>
                    )}
                </h4>
                <p className="text-xs text-text-muted mt-1">{description}</p>
            </div>
            <GlassButton
                variant="outline"
                size="sm"
                onClick={onConnect}
                className={cn('text-xs w-full mt-auto', isConnected ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : '')}
            >
                {isConnected ? `${buttonLabel} \u2713` : buttonLabel}
            </GlassButton>
        </div>
    );
}
