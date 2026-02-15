"use client";

import { Inbox, MessageCircle, UserCircle2 } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";

const tickets = [
    {
        id: "SUP-1042",
        requester: "Liam Walker",
        subject: "Luggage allowance for day 3 flight",
        status: "open" as const,
        updated: "2 hours ago",
    },
    {
        id: "SUP-1037",
        requester: "Ava Chen",
        subject: "Can we add a tea ceremony?",
        status: "pending" as const,
        updated: "Yesterday",
    },
    {
        id: "SUP-1029",
        requester: "Sofia Ramirez",
        subject: "Invoice correction requested",
        status: "resolved" as const,
        updated: "3 days ago",
    },
];

const statusVariants: Record<string, "warning" | "info" | "success"> = {
    open: "warning",
    pending: "info",
    resolved: "success",
};

export default function SupportPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Support</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">Support Inbox</h1>
                    <p className="text-text-secondary mt-1">Mock client requests and internal notes.</p>
                </div>
            </div>

            {/* Support Tickets */}
            <GlassCard padding="none" rounded="2xl">
                <div className="grid grid-cols-12 border-b border-white/10 px-6 py-3 text-xs font-semibold text-secondary dark:text-white uppercase">
                    <div className="col-span-3">Requester</div>
                    <div className="col-span-6">Subject</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-right">Updated</div>
                </div>
                <div className="divide-y divide-white/10">
                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                            <div className="col-span-3 flex items-center gap-3">
                                <UserCircle2 className="w-8 h-8 text-text-secondary" />
                                <div>
                                    <p className="text-sm font-medium text-secondary dark:text-white">{ticket.requester}</p>
                                    <p className="text-xs text-text-secondary">{ticket.id}</p>
                                </div>
                            </div>
                            <div className="col-span-6 text-sm text-text-secondary flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-text-secondary" />
                                {ticket.subject}
                            </div>
                            <div className="col-span-2">
                                <GlassBadge variant={statusVariants[ticket.status]} size="sm">
                                    {ticket.status}
                                </GlassBadge>
                            </div>
                            <div className="col-span-1 text-right text-xs text-text-secondary">{ticket.updated}</div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
