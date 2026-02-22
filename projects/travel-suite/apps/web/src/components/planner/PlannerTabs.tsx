"use client";

import React from 'react';
import { Layout, Plane, IndianRupee, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlannerTab = 'itinerary' | 'logistics' | 'pricing';

interface PlannerTabsProps {
    activeTab: PlannerTab;
    onTabChange: (tab: PlannerTab) => void;
}

export function PlannerTabs({ activeTab, onTabChange }: PlannerTabsProps) {
    const tabs = [
        { id: 'itinerary', label: 'Itinerary View', icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'logistics', label: 'Logistics & Search', icon: Plane, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'pricing', label: 'Pricing & Investment', icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="flex justify-center mb-8 sticky top-24 z-30 px-4 print:hidden">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 flex gap-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id as PlannerTab)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                                isActive
                                    ? cn("shadow-sm", tab.bg, tab.color, "dark:bg-white/10")
                                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? tab.color : "text-gray-400")} />
                            {tab.label}
                            {isActive && (
                                <span className={cn("w-1.5 h-1.5 rounded-full ml-1 animate-pulse", tab.color.replace('text', 'bg'))} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
