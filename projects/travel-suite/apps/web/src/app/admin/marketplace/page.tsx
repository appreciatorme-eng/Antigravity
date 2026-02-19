"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Search,
    Filter,
    Star,
    MapPin,
    Trophy,
    RefreshCcw,
    Building2,
    ShieldCheck,
    Tag,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import {
    mergeMarketplaceOptions,
    SERVICE_REGION_OPTIONS,
    SPECIALTY_OPTIONS,
} from "@/lib/marketplace-options";

interface MarketplaceProfile {
    id: string;
    organization_id: string;
    organization_name: string;
    organization_logo: string | null;
    description: string | null;
    service_regions: string[];
    specialties: string[];
    margin_rate: number | null;
    average_rating: number;
    review_count: number;
    is_verified: boolean;
    verification_status?: string;
}

export default function MarketplacePage() {
    const supabase = createClient();
    const [profiles, setProfiles] = useState<MarketplaceProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [regionFilter, setRegionFilter] = useState("");
    const [specialtyFilter, setSpecialtyFilter] = useState("");

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const url = new URL("/api/marketplace", window.location.origin);
            if (searchTerm) url.searchParams.set("q", searchTerm);
            if (regionFilter) url.searchParams.set("region", regionFilter);
            if (specialtyFilter) url.searchParams.set("specialty", specialtyFilter);

            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`;
            }

            const response = await fetch(url.toString(), { headers });
            if (!response.ok) throw new Error("Failed to fetch marketplace profiles");

            const data = await response.json();
            setProfiles(data);
        } catch (error) {
            console.error("Error fetching marketplace:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, searchTerm, regionFilter, specialtyFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchProfiles();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchProfiles]);

    const allRegions = useMemo(
        () => mergeMarketplaceOptions(SERVICE_REGION_OPTIONS, profiles.flatMap((profile) => profile.service_regions || [])),
        [profiles]
    );
    const allSpecialties = useMemo(
        () => mergeMarketplaceOptions(SPECIALTY_OPTIONS, profiles.flatMap((profile) => profile.specialties || [])),
        [profiles]
    );

    return (
        <div className="min-h-screen p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Trophy size={24} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Partner Marketplace</h1>
                    </div>
                    <p className="text-slate-400 text-lg">
                        Discover and connect with trusted tour operators and local partners.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/settings/marketplace">
                        <GlassButton variant="secondary" className="flex items-center gap-2">
                            Manage Your Listing
                        </GlassButton>
                    </Link>
                </div>
            </div>

            {/* Sub-header Banner */}
            <GlassCard className="p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium border border-green-500/20">
                            <ShieldCheck size={14} />
                            Verified Trusted Partners
                        </div>
                        <h2 className="text-2xl font-semibold text-white">Scale your business with the right partners</h2>
                        <p className="text-slate-400 max-w-2xl">
                            Our marketplace only hosts registered tour operators. Read peer reviews, compare margins,
                            and find partners that align with your service standards.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3">
                            <div className="text-2xl font-bold text-white">{profiles.length}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Active Partners</div>
                        </div>
                        <div className="p-3 border-x border-slate-800">
                            <div className="text-2xl font-bold text-white">4.8</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Avg. Rating</div>
                        </div>
                        <div className="p-3">
                            <div className="text-2xl font-bold text-white">12+</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Regions</div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Filters and List */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <div className="w-full lg:w-72 flex-shrink-0 space-y-6">
                    <GlassCard className="p-6 sticky top-24">
                        <div className="flex items-center gap-2 mb-6">
                            <Filter size={18} className="text-blue-400" />
                            <h3 className="font-semibold text-white">Filter Results</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-400">Search</label>
                                <GlassInput
                                    placeholder="Operator name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    icon={Search}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-400">Region</label>
                                <select
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                    value={regionFilter}
                                    onChange={(e) => setRegionFilter(e.target.value)}
                                >
                                    <option value="">All Regions</option>
                                    {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-400">Specialty</label>
                                <select
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                    value={specialtyFilter}
                                    onChange={(e) => setSpecialtyFilter(e.target.value)}
                                >
                                    <option value="">All Specialties</option>
                                    {allSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <GlassButton
                                variant="outline"
                                className="w-full text-slate-400 hover:text-white"
                                onClick={() => {
                                    setSearchTerm("");
                                    setRegionFilter("");
                                    setSpecialtyFilter("");
                                }}
                            >
                                Clear All
                            </GlassButton>
                        </div>
                    </GlassCard>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <RefreshCcw className="animate-spin text-blue-400" size={32} />
                            <p className="text-slate-500 font-medium">Scanning the marketplace...</p>
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                            <Building2 className="mx-auto text-slate-600 mb-4" size={48} />
                            <h3 className="text-xl font-medium text-slate-300">No operators found</h3>
                            <p className="text-slate-500 mt-2">Try adjusting your filters or search term.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                            {profiles.map((profile) => (
                                <Link key={profile.id} href={`/admin/marketplace/${profile.organization_id}`}>
                                    <GlassCard className="group p-0 overflow-hidden hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="p-6 space-y-6">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700 overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
                                                        {profile.organization_logo ? (
                                                            <Image
                                                                src={profile.organization_logo}
                                                                alt={profile.organization_name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <Building2 size={24} className="text-slate-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                                            {profile.organization_name}
                                                            {profile.is_verified && (
                                                                <ShieldCheck size={16} className="text-green-400" />
                                                            )}
                                                        </h3>
                                                        {profile.verification_status === "pending" ? (
                                                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-orange-500/15 text-orange-300 border border-orange-500/30">
                                                                Pending verification
                                                            </div>
                                                        ) : profile.verification_status === "verified" ? (
                                                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                                                Verified
                                                            </div>
                                                        ) : (
                                                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-slate-500/15 text-slate-300 border border-slate-500/30">
                                                                Draft profile
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                            <span className="text-sm font-semibold text-slate-200">
                                                                {profile.average_rating.toFixed(1)}
                                                            </span>
                                                            <span className="text-sm text-slate-500">
                                                                ({profile.review_count} reviews)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Margin</div>
                                                    <div className="text-lg font-bold text-blue-400">
                                                        {profile.margin_rate ? `${profile.margin_rate}%` : "Negotiable"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description snippet */}
                                            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed h-10">
                                                {profile.description || "No description provided."}
                                            </p>

                                            {/* Tags */}
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.service_regions.slice(0, 3).map(region => (
                                                        <span key={region} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 rounded-full text-xs font-medium text-slate-300 border border-slate-700/50">
                                                            <MapPin size={10} className="text-blue-400" />
                                                            {region}
                                                        </span>
                                                    ))}
                                                    {profile.service_regions.length > 3 && (
                                                        <span className="text-xs text-slate-500 self-center">
                                                            +{profile.service_regions.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.specialties.slice(0, 3).map(spec => (
                                                        <span key={spec} className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/5 rounded-full text-xs font-medium text-purple-300 border border-purple-500/10">
                                                            <Tag size={10} className="text-purple-400" />
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Action */}
                                        <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-800/50 group-hover:bg-blue-500/5 transition-colors flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-500 group-hover:text-blue-400 transition-colors">
                                                View partnership details
                                            </span>
                                            <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </GlassCard>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
