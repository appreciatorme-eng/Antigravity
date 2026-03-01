"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Search,
    Filter,
    Star,
    MapPin,
    RefreshCcw,
    Building2,
    ShieldCheck,
    ArrowRight,
    Sparkles,
    Store
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
    fetchMarketplaceOptionCatalog,
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
    discovery_score?: number;
}

export default function MarketplacePage() {
    const supabase = createClient();
    const [profiles, setProfiles] = useState<MarketplaceProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [regionFilter, setRegionFilter] = useState("");
    const [specialtyFilter, setSpecialtyFilter] = useState("");
    const [sortOption, setSortOption] = useState("verified_first");
    const [minRating, setMinRating] = useState("0");
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [marketplaceRegionCatalog, setMarketplaceRegionCatalog] = useState<string[]>(
        SERVICE_REGION_OPTIONS
    );
    const [marketplaceSpecialtyCatalog, setMarketplaceSpecialtyCatalog] = useState<string[]>(
        SPECIALTY_OPTIONS
    );

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const url = new URL("/api/marketplace", window.location.origin);
            if (searchTerm) url.searchParams.set("q", searchTerm);
            if (regionFilter) url.searchParams.set("region", regionFilter);
            if (specialtyFilter) url.searchParams.set("specialty", specialtyFilter);
            if (sortOption) url.searchParams.set("sort", sortOption);
            if (minRating && minRating !== "0") url.searchParams.set("min_rating", minRating);
            if (verifiedOnly) url.searchParams.set("verified_only", "true");

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
    }, [supabase, searchTerm, regionFilter, specialtyFilter, sortOption, minRating, verifiedOnly]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchProfiles();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchProfiles]);

    useEffect(() => {
        const loadMarketplaceOptions = async () => {
            const payload = await fetchMarketplaceOptionCatalog();
            if (!payload) return;
            if (payload.service_regions.length > 0) {
                setMarketplaceRegionCatalog(payload.service_regions);
            }
            if (payload.specialties.length > 0) {
                setMarketplaceSpecialtyCatalog(payload.specialties);
            }
        };

        void loadMarketplaceOptions();
    }, []);

    const allRegions = useMemo(
        () =>
            mergeMarketplaceOptions(
                marketplaceRegionCatalog,
                profiles.flatMap((profile) => profile.service_regions || [])
            ),
        [marketplaceRegionCatalog, profiles]
    );
    const allSpecialties = useMemo(
        () =>
            mergeMarketplaceOptions(
                marketplaceSpecialtyCatalog,
                profiles.flatMap((profile) => profile.specialties || [])
            ),
        [marketplaceSpecialtyCatalog, profiles]
    );

    return (
        <div className="min-h-screen pb-24 lg:pb-12">
            {/* 1. HERO SECTION (Immersive & Premium) */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 px-6 py-16 lg:px-12 lg:py-24 mx-4 mt-4 lg:mx-8 mb-8 shadow-2xl isolate">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 pointer-events-none" />
                
                {/* Abstract Glowing Orbs */}
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
                <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

                <div className="relative z-10 w-full flex flex-col lg:flex-row gap-12 items-center justify-between">
                    <div className="max-w-3xl space-y-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">B2B Network</span>
                        </motion.div>
                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-sm leading-tight">
                            The Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Marketplace</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg lg:text-xl text-slate-400 max-w-2xl leading-relaxed">
                            Discover, vet, and connect with elite ground handlers and local operators worldwide. Scale your operations with absolute confidence.
                        </motion.p>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-4 flex flex-wrap gap-4">
                            <Link href="/settings/marketplace">
                                <button className="px-6 py-3 rounded-full bg-white text-slate-950 font-bold shadow-[0_0_30px_-5px_theme(colors.white)] hover:shadow-[0_0_40px_-5px_theme(colors.white)] active:scale-95 transition-all duration-300 flex items-center gap-2">
                                    <Store className="w-5 h-5" />
                                    Manage Your Listing
                                </button>
                            </Link>
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="hidden lg:grid grid-cols-2 gap-4 w-full max-w-sm">
                        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center">
                            <div className="text-4xl font-black text-white">{profiles.length}</div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">Active Partners</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center">
                            <div className="text-4xl font-black text-white">4.8</div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2">Avg Rating</div>
                        </div>
                        <div className="col-span-2 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-xl border border-blue-500/20 shadow-2xl flex items-center justify-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-blue-400" />
                            <span className="text-sm font-semibold text-blue-100">100% Verified Professionals</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA (Premium Filters & List) */}
            <div className="px-4 lg:px-8 max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-8">
                
                {/* 2a. Sidebar Filters */}
                <div className="w-full xl:w-72 flex-shrink-0">
                    <div className="sticky top-24 p-6 rounded-3xl bg-white dark:bg-slate-900/50 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200 dark:border-slate-800 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Filter size={18} className="text-blue-500 dark:text-blue-400" />
                            <h3 className="font-bold text-slate-900 dark:text-white">Refine Search</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Operator name..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Region</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none shadow-sm cursor-pointer"
                                        value={regionFilter}
                                        onChange={(e) => setRegionFilter(e.target.value)}
                                    >
                                        <option value="">All Regions</option>
                                        {allRegions.map((r: string) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ArrowRight size={14} className="rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Specialty</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none shadow-sm cursor-pointer"
                                        value={specialtyFilter}
                                        onChange={(e) => setSpecialtyFilter(e.target.value)}
                                    >
                                        <option value="">All Specialties</option>
                                        {allSpecialties.map((s: string) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ArrowRight size={14} className="rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sort By</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none shadow-sm cursor-pointer"
                                        value={sortOption}
                                        onChange={(e) => setSortOption(e.target.value)}
                                    >
                                        <option value="verified_first">Verified First</option>
                                        <option value="discovery">Best Discovery Score</option>
                                        <option value="top_rated">Top Rated</option>
                                        <option value="most_reviewed">Most Reviewed</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ArrowRight size={14} className="rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:border-blue-500/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={verifiedOnly}
                                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer text-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Verified strictly</span>
                                </label>
                            </div>

                            <button
                                onClick={() => { setSearchTerm(""); setRegionFilter(""); setSpecialtyFilter(""); setSortOption("verified_first"); setMinRating("0"); setVerifiedOnly(false); }}
                                className="w-full py-2.5 px-4 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mt-2"
                            >
                                Clear all filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2b. Partner Grid */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-6">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                                <RefreshCcw className="w-6 h-6 text-blue-500 absolute" />
                            </div>
                            <p className="text-slate-500 font-medium animate-pulse">Scanning global network...</p>
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden h-full">
                            <div className="w-20 h-20 mb-6 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                <Search className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 relative z-10">No partners found.</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm relative z-10">
                                Try expanding your search criteria or invite a trusted ground handler directly to the network.
                            </p>
                            <button onClick={() => { setSearchTerm(""); setRegionFilter(""); setSpecialtyFilter(""); setVerifiedOnly(false); }} className="px-6 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                            {profiles.map((profile: MarketplaceProfile, index: number) => (
                                <Link key={profile.id} href={`/marketplace/${profile.organization_id}`}>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative p-1 rounded-[28px] bg-slate-200 dark:bg-slate-800 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1"
                                    >
                                        <div className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                        <div className="relative h-full rounded-[24px] bg-white dark:bg-[#0f172a] p-6 lg:p-8 flex flex-col justify-between overflow-hidden">
                                            {/* Top Section */}
                                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/50 pb-6 mb-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-sm group-hover:scale-105 transition-transform duration-300 shrink-0">
                                                        {profile.organization_logo ? (
                                                            <Image src={profile.organization_logo} alt={profile.organization_name} fill className="object-cover" />
                                                        ) : (
                                                            <Building2 size={24} className="text-slate-400 dark:text-slate-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2 line-clamp-1">
                                                            {profile.organization_name}
                                                            {profile.is_verified && <ShieldCheck size={16} className="text-blue-500" fill="currentColor" />}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                            <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                                {profile.average_rating.toFixed(1)}
                                                            </span>
                                                            <span className="text-xs font-medium text-slate-500">
                                                                ({profile.review_count} reviews)
                                                            </span>
                                                        </div>
                                                        <div className="mt-2">
                                                            {profile.verification_status === "verified" ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                                    Verified
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description snippet */}
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed h-10 mb-6">
                                                {profile.description || "Premium ground handler specializing in bespoke experiential travel."}
                                            </p>

                                            {/* Tags container */}
                                            <div className="space-y-4 flex-1">
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.service_regions.slice(0, 3).map((region: string) => (
                                                        <span key={region} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                                                            <MapPin size={10} className="text-slate-400" />
                                                            {region}
                                                        </span>
                                                    ))}
                                                    {profile.service_regions.length > 3 && (
                                                        <span className="text-[10px] text-slate-400 self-center font-bold px-1">
                                                            +{profile.service_regions.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.specialties.slice(0, 3).map((spec: string) => (
                                                        <span key={spec} className="inline-flex items-center px-2.5 py-1 bg-blue-50/50 dark:bg-blue-500/5 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10">
                                                            {spec}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Action bar */}
                                            <div className="mt-8 pt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50">
                                                <div className="flex gap-4">
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Discovery</div>
                                                        <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                                                            {Math.max(0, Math.min(100, Math.round(Number(profile.discovery_score || 0))))}/100
                                                        </div>
                                                    </div>
                                                    <div className="w-px bg-slate-100 dark:bg-slate-800" />
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Margin</div>
                                                        <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                                                            {profile.margin_rate ? `${profile.margin_rate}%` : "15-20%"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                                                    <ArrowRight size={14} className="text-slate-400 group-hover:text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
