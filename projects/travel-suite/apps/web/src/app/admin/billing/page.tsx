"use client";

import { FileText, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

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
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
                    <p className="text-sm text-gray-500">Mock billing data and invoice history.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.name} className={`rounded-2xl border ${plan.active ? "border-primary" : "border-gray-200"} bg-white p-6`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
                            {plan.active && <span className="text-xs font-semibold text-primary">Current</span>}
                        </div>
                        <p className="text-2xl font-semibold text-gray-900 mt-2">{plan.price}</p>
                        <ul className="mt-4 space-y-2 text-sm text-gray-500">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button
                            className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-semibold ${
                                plan.active ? "bg-primary text-white" : "border border-gray-200 text-gray-700"
                            }`}
                        >
                            {plan.active ? "Manage Plan" : "Select Plan"}
                        </button>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Invoice History</h2>
                    <button className="flex items-center gap-2 text-sm text-gray-600">
                        <CreditCard className="w-4 h-4" />
                        Update payment method
                    </button>
                </div>
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{invoice.id}</p>
                                <p className="text-xs text-gray-500">{invoice.date}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-900">{invoice.amount}</span>
                                {invoice.status === "paid" ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Paid
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                                        <AlertCircle className="w-3 h-3" />
                                        Overdue
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
