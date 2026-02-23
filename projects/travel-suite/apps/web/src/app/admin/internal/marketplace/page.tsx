"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    ShieldAlert,
    Check,
    X,
    Building2,
    ExternalLink,
    RefreshCcw
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import Link from "next/link";

interface PendingVerificationRequest {
    id: string;
    organization_id: string;
    updated_at: string;
    organization?: {
        name?: string | null;
        logo_url?: string | null;
    } | null;
}

export default function InternalMarketplaceAdmin() {
    const [pending, setPending] = useState<PendingVerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/marketplace/verify");
            const data = await res.json();
            if (Array.isArray(data)) setPending(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchPending();
    }, []);

    const handleVerify = async (orgId: string, status: 'verified' | 'rejected') => {
        try {
            await fetch("/api/admin/marketplace/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orgId, status })
            });
            void fetchPending();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen p-10 space-y-8 max-w-5xl mx-auto">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ShieldAlert className="text-blue-400" />
                    Marketplace Verifications
                </h1>
                <p className="text-slate-400 text-sm">Review and approve partner verification requests.</p>
            </div>

            {loading ? (
                <RefreshCcw className="animate-spin text-blue-500 mx-auto" />
            ) : pending.length === 0 ? (
                <div className="p-20 text-center bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                    <Check className="mx-auto text-slate-700 mb-4" size={48} />
                    <p className="text-slate-500">No pending verification requests.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pending.map((req) => (
                        <GlassCard key={req.id} className="p-6 flex items-center justify-between gap-6 border border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 relative">
                                    {req.organization?.logo_url ? (
                                        <Image
                                            src={req.organization.logo_url}
                                            alt={`${req.organization?.name || "Organization"} logo`}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <Building2 className="m-3 text-slate-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">{req.organization?.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span>Requested {new Date(req.updated_at).toLocaleDateString()}</span>
                                        <Link href={`/admin/marketplace/${req.organization_id}`} className="text-blue-400 hover:underline flex items-center gap-1">
                                            View Profile <ExternalLink size={10} />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <GlassButton
                                    variant="secondary"
                                    className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 px-3"
                                    onClick={() => handleVerify(req.organization_id, 'rejected')}
                                    aria-label={`Reject verification request for ${req.organization?.name || "organization"}`}
                                >
                                    <X size={18} />
                                </GlassButton>
                                <GlassButton
                                    className="bg-green-600 text-white hover:bg-green-500 px-3"
                                    onClick={() => handleVerify(req.organization_id, 'verified')}
                                >
                                    <Check size={18} />
                                    Approve
                                </GlassButton>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
