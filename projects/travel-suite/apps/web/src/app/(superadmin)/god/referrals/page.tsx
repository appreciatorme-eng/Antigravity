// Referral Tracking — B2B and client flywheel referral overview.

"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import DrillDownTable from "@/components/god-mode/DrillDownTable";
import StatCard from "@/components/god-mode/StatCard";
import type { TableColumn } from "@/components/god-mode/DrillDownTable";

interface B2bReferrer {
    org_id: string;
    name: string;
    total: number;
    converted: number;
    [key: string]: unknown;
}

interface ClientEvent {
    id: string;
    status: string;
    created_at: string | null;
    referred_email: string | null;
    [key: string]: unknown;
}

interface ReferralData {
    b2b: {
        total: number;
        converted: number;
        conversion_pct: number;
        top_referrers: B2bReferrer[];
    };
    client_flywheel: {
        total_events: number;
        converted_events: number;
        conversion_pct: number;
        total_incentives_issued: number;
        total_rewards_inr: number;
        tds_obligation_inr: number;
        recent_events: ClientEvent[];
    };
}

const B2B_COLS: TableColumn<B2bReferrer>[] = [
    { key: "name", label: "Org", render: (v) => <span className="font-medium text-white">{v as string}</span> },
    { key: "total", label: "Referrals", sortable: true, render: (v) => <span className="text-gray-300">{v as number}</span> },
    { key: "converted", label: "Converted", sortable: true, render: (v) => <span className="text-emerald-400 font-semibold">{v as number}</span> },
    {
        key: "converted", label: "Conv. %",
        render: (_, row) => {
            const pct = row.total > 0 ? ((row.converted / row.total) * 100).toFixed(0) : 0;
            return <span className="text-amber-400">{pct}%</span>;
        },
    },
];

const CLIENT_COLS: TableColumn<ClientEvent>[] = [
    {
        key: "status", label: "Status",
        render: (v) => (
            <span className={`text-xs font-semibold uppercase ${v === "converted" ? "text-emerald-400" : "text-gray-400"}`}>
                {v as string}
            </span>
        ),
    },
    { key: "referred_email", label: "Referred Email", render: (v) => <span className="text-gray-300 text-sm">{v as string ?? "—"}</span> },
    {
        key: "created_at", label: "Date",
        render: (v) => <span className="text-gray-400 text-sm">{v ? new Date(v as string).toLocaleDateString() : "—"}</span>,
    },
];

type Tab = "b2b" | "client";

export default function ReferralsPage() {
    const [tab, setTab] = useState<Tab>("b2b");
    const [data, setData] = useState<ReferralData | null>(null);
    const [loading, setLoading] = useState(true);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch("/api/superadmin/referrals/overview");
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchData(); }, []);

    const b2b = data?.b2b;
    const client = data?.client_flywheel;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Referral Tracking</h1>
                    <p className="text-sm text-gray-400 mt-0.5">B2B and client flywheel overview</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400
                               hover:text-white transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-lg w-fit">
                {(["b2b", "client"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                            tab === t
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "text-gray-400 hover:text-gray-300"
                        }`}
                    >
                        {t === "b2b" ? "B2B Referrals" : "Client Flywheel"}
                    </button>
                ))}
            </div>

            {/* B2B tab */}
            {tab === "b2b" && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard label="Total Referrals" value={loading ? "…" : (b2b?.total ?? 0)} accent="blue" />
                        <StatCard label="Converted" value={loading ? "…" : (b2b?.converted ?? 0)} accent="emerald" />
                        <StatCard label="Conversion %" value={loading ? "…" : `${b2b?.conversion_pct ?? 0}%`} accent="amber" />
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                            Top Referrers
                        </h2>
                        <DrillDownTable<B2bReferrer>
                            columns={B2B_COLS}
                            data={b2b?.top_referrers ?? []}
                            emptyMessage="No B2B referrals yet"
                        />
                    </div>
                </>
            )}

            {/* Client flywheel tab */}
            {tab === "client" && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard label="Total Events" value={loading ? "…" : (client?.total_events ?? 0)} accent="blue" />
                        <StatCard label="Converted" value={loading ? "…" : (client?.converted_events ?? 0)} accent="emerald" />
                        <StatCard label="Conversion %" value={loading ? "…" : `${client?.conversion_pct ?? 0}%`} accent="amber" />
                        <StatCard label="Rewards Issued" value={loading ? "…" : `₹${(client?.total_rewards_inr ?? 0).toLocaleString()}`} accent="purple" />
                        <StatCard label="TDS Obligation" value={loading ? "…" : `₹${(client?.tds_obligation_inr ?? 0).toLocaleString()}`} accent="red" />
                        <StatCard label="Incentives" value={loading ? "…" : (client?.total_incentives_issued ?? 0)} accent="blue" />
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                            Recent Events
                        </h2>
                        <DrillDownTable<ClientEvent>
                            columns={CLIENT_COLS}
                            data={client?.recent_events ?? []}
                            emptyMessage="No client referral events yet"
                        />
                    </div>
                </>
            )}
        </div>
    );
}
