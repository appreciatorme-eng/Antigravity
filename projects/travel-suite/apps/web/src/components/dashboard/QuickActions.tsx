"use client";

import Link from "next/link";
import { Zap, CreditCard, Car, ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { cn } from "@/lib/utils";

export function QuickActions() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Tactical Actions</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <QuickActionLink
                    href="/trips"
                    icon={Zap}
                    label="Launch New Protocol"
                    description="AI-powered itinerary generation"
                    accent="bg-primary/10 text-primary"
                />
                <QuickActionLink
                    href="/admin/billing"
                    icon={CreditCard}
                    label="Financial Ledger"
                    description="Invoices and subscription status"
                    accent="bg-blue-500/10 text-blue-500"
                />
                <QuickActionLink
                    href="/admin/drivers"
                    icon={Car}
                    label="Fleet Status"
                    description="Real-time asset positioning"
                    accent="bg-amber-500/10 text-amber-500"
                />
            </div>
        </div>
    );
}

function QuickActionLink({ href, icon: Icon, label, description, accent }: any) {
    return (
        <Link href={href}>
            <GlassCard padding="md" className="group hover:border-primary/50 transition-all border-transparent bg-white dark:bg-slate-800/30">
                <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110", accent)}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{label}</h4>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{description}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
            </GlassCard>
        </Link>
    );
}
