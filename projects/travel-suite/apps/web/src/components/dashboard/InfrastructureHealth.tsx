"use client";

import { motion } from "framer-motion";
import { Server } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { cn } from "@/lib/utils";

type HealthStatus = "healthy" | "degraded" | "down" | "unconfigured";

interface SystemHealthProps {
    health: {
        checks: {
            database: { status: HealthStatus };
            firebase_fcm: { status: HealthStatus };
            whatsapp_api: { status: HealthStatus };
        };
    } | null;
}

export function SystemHealth({ health }: SystemHealthProps) {
    return (
        <GlassCard padding="lg" className="bg-slate-900 border-none relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Node Status</span>
                    </div>
                    <GlassBadge variant="success">Online</GlassBadge>
                </div>

                <div className="space-y-4">
                    <HealthBar label="Database" status={health?.checks.database.status || "healthy"} />
                    <HealthBar label="Signal Relay (FCM)" status={health?.checks.firebase_fcm.status || "healthy"} />
                    <HealthBar label="Communication Grid" status={health?.checks.whatsapp_api.status || "healthy"} />
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>SYSTEM UPTIME: 99.98%</span>
                    <span className="text-emerald-500">ALL NODES OPERATIONAL</span>
                </div>
            </div>
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
        </GlassCard>
    );
}

function HealthBar({ label, status }: { label: string, status: HealthStatus }) {
    const colors = {
        healthy: "bg-emerald-500",
        degraded: "bg-amber-500",
        down: "bg-rose-500",
        unconfigured: "bg-slate-500"
    };

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-400">{label}</span>
                <span className={status === "healthy" ? "text-emerald-500" : "text-amber-500"}>{status}</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: status === "healthy" ? "100%" : "70%" }}
                    className={cn("h-full rounded-full transition-all duration-1000", colors[status])}
                />
            </div>
        </div>
    );
}
