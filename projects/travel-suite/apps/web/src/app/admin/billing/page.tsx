"use client";

import { FileText, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";

const invoices = [
    { id: "INV-2026-021", date: "2026-02-05", amount: "$2,400", status: "paid" },
    { id: "INV-2026-020", date: "2026-01-05", amount: "$2,400", status: "paid" },
    { id: "INV-2025-012", date: "2025-12-05", amount: "$1,800", status: "overdue" },
];

const plans = [
    {
        name: "Starter",
        price: "$99 / mo",
        features: ["Up to 15 clients", "Basic notifications", "Email support"],
        active: false,
    },
    {
        name: "Pro",
        price: "$249 / mo",
        features: ["Unlimited clients", "Advanced notifications", "Priority support"],
        active: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        features: ["Dedicated success team", "White-label branding", "Custom SLAs"],
        active: false,
    },
];

export default function BillingPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Billing</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">Billing</h1>
                    <p className="text-text-secondary mt-1">Mock billing data and invoice history.</p>
                </div>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <GlassCard
                        key={plan.name}
                        padding="lg"
                        rounded="2xl"
                        className={plan.active ? "border-primary/50" : ""}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-serif text-secondary dark:text-white">{plan.name}</h2>
                            {plan.active && <GlassBadge variant="primary" size="sm">Current</GlassBadge>}
                        </div>
                        <p className="text-2xl font-semibold text-secondary dark:text-white mt-2">{plan.price}</p>
                        <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <GlassButton
                            variant={plan.active ? "primary" : "ghost"}
                            fullWidth
                            className="mt-6"
                        >
                            {plan.active ? "Manage Plan" : "Select Plan"}
                        </GlassButton>
                    </GlassCard>
                ))}
            </div>

            {/* Invoice History */}
            <GlassCard padding="lg" rounded="2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-serif text-secondary dark:text-white">Invoice History</h2>
                    <GlassButton variant="ghost" size="sm">
                        <CreditCard className="w-4 h-4" />
                        Update payment method
                    </GlassButton>
                </div>
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 dark:bg-white/5 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-secondary dark:text-white">{invoice.id}</p>
                                <p className="text-xs text-text-secondary">{invoice.date}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-secondary dark:text-white">{invoice.amount}</span>
                                {invoice.status === "paid" ? (
                                    <GlassBadge variant="success" size="sm" icon={CheckCircle2}>
                                        Paid
                                    </GlassBadge>
                                ) : (
                                    <GlassBadge variant="danger" size="sm" icon={AlertCircle}>
                                        Overdue
                                    </GlassBadge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
