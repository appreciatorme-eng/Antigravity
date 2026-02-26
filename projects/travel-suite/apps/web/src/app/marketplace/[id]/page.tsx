"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Star,
    MapPin,
    Building2,
    ShieldCheck,
    MessageSquare,
    ChevronLeft,
    ExternalLink,
    RefreshCcw,
    Image as ImageIcon,
    List,
    Lock,
    FileText,
    ShieldAlert,
    Clock,
    Globe,
    Phone,
    Mail
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";

interface RateCardItem {
    id: string;
    service: string;
    margin: number;
}

interface ComplianceDocument {
    id: string;
    name: string;
    url: string;
    type: string;
    expiry_date?: string;
}

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
    gallery_urls: string[];
    rate_card: RateCardItem[];
    compliance_documents: ComplianceDocument[];
}

interface Review {
    id: string;
    reviewer_org_id: string;
    rating: number;
    comment: string;
    created_at: string;
    reviewer: {
        name: string;
        logo_url: string | null;
    };
}

interface MarketplaceListItem extends MarketplaceProfile {
    organization_id: string;
}

type MarketplaceProfileLookupClient = {
    from: (table: string) => {
        select: (columns: string) => {
            eq: (column: string, value: string) => {
                single: () => Promise<{ data: { is_verified?: boolean | null } | null }>;
            };
        };
    };
};

export default function OperatorDetailPage() {
    const params = useParams();
    const targetOrgId = params.id as string;
    const supabase = createClient();
    const { toast } = useToast();

    const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [currentUserOrgId, setCurrentUserOrgId] = useState<string | null>(null);
    const [currentUserIsVerified, setCurrentUserIsVerified] = useState(false);
    const [inquiryMessage, setInquiryMessage] = useState("");
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const [inquirySent, setInquirySent] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers.Authorization = `Bearer ${session.access_token}`;
            }

            if (session?.user) {
                const { data: userProfile } = await supabase
                    .from("profiles")
                    .select("organization_id")
                    .eq("id", session.user.id)
                    .single();
                setCurrentUserOrgId(userProfile?.organization_id || null);

                if (userProfile?.organization_id) {
                    const dynamicClient = supabase as unknown as MarketplaceProfileLookupClient;
                    const { data: marketProfile } = await dynamicClient
                        .from("marketplace_profiles")
                        .select("is_verified")
                        .eq("organization_id", userProfile.organization_id)
                        .single();
                    setCurrentUserIsVerified(marketProfile?.is_verified || false);
                }
            }

            const profRes = await fetch(`/api/marketplace?q=`, { headers });
            if (profRes.ok) {
                const allProfs = (await profRes.json()) as MarketplaceListItem[];
                const found = allProfs.find((p) => p.organization_id === targetOrgId);
                setProfile(found || null);
            }

            const revRes = await fetch(`/api/marketplace/${targetOrgId}/reviews`, { headers });
            if (revRes.ok) {
                setReviews(await revRes.json());
            }
        } catch (error) {
            console.error("Error fetching detail:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, targetOrgId]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    useEffect(() => {
        const recordView = async () => {
            try {
                await fetch(`/api/marketplace/${targetOrgId}/view`, {
                    method: "POST"
                });
            } catch (err) {
                console.error("Failed to record view", err);
            }
        };

        if (targetOrgId) {
            // distinctive duplicate call prevention could work here, but simpler to just adjust db or limit.
            // For now, we just call it on mount.
            void recordView();
        }
    }, [targetOrgId]);

    const handleSubmitReview = async () => {
        if (!newComment.trim()) return;
        setSubmittingReview(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/marketplace/${targetOrgId}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ rating: newRating, comment: newComment })
            });

            if (!response.ok) throw new Error("Failed to submit review");
            setNewComment("");
            setNewRating(5);
            void fetchData();
        } catch (error) {
            toast({
                title: "Failed to submit review",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "error",
            });
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleSubmitInquiry = async () => {
        if (!inquiryMessage.trim()) return;
        setSubmittingInquiry(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`/api/marketplace/${targetOrgId}/inquiry`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ message: inquiryMessage })
            });

            if (!response.ok) throw new Error("Failed to send inquiry");
            setInquirySent(true);
            setInquiryMessage("");
            setTimeout(() => { setShowInquiryModal(false); setInquirySent(false); }, 3000);
        } catch (error) {
            toast({
                title: "Failed to send inquiry",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "error",
            });
        } finally {
            setSubmittingInquiry(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <RefreshCcw className="animate-spin text-blue-500 dark:text-blue-400" size={48} />
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen p-10 flex flex-col items-center justify-center space-y-6 text-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay pointer-events-none" />
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center max-w-md"
            >
                <div className="w-24 h-24 rounded-full bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                    <Building2 size={48} className="text-slate-400 dark:text-slate-500" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Operator not found</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">The partner you are looking for might have been removed or is temporarily unavailable.</p>
                <Link href="/marketplace">
                    <GlassButton className="px-8 flex items-center gap-2">
                        <ChevronLeft size={16} /> Back to Directory
                    </GlassButton>
                </Link>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative font-sans selection:bg-blue-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 dark:bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto pt-8">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium group">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-blue-500/50 group-hover:scale-105 transition-all">
                            <ChevronLeft size={16} />
                        </div>
                        Back to Marketplace
                    </Link>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                    <div className="xl:col-span-2 space-y-8">
                        {/* Hero Profile Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <GlassCard className="p-8 md:p-10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl border-white/40 dark:border-slate-800/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="group relative w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 shadow-lg">
                                        {profile.organization_logo ? (
                                            <Image 
                                                src={profile.organization_logo} 
                                                alt={profile.organization_name} 
                                                fill 
                                                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                                            />
                                        ) : (
                                            <Building2 size={48} className="text-slate-400 dark:text-slate-600" />
                                        )}
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/10 rounded-3xl mix-blend-overlay"></div>
                                    </div>
                                    <div className="flex-1 space-y-5">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                                    {profile.organization_name}
                                                </h1>
                                                {profile.is_verified && (
                                                    <div className="px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 text-green-700 dark:text-green-300 rounded-full text-xs font-bold border border-green-200 dark:border-green-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                                                        <ShieldCheck size={14} className="text-green-600 dark:text-green-400" /> Verified Partner
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-slate-600 dark:text-slate-300 text-sm font-medium">
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/30">
                                                    <Star size={16} className="text-amber-500 fill-amber-500" />
                                                    <span className="font-bold text-amber-700 dark:text-amber-300">{profile.average_rating.toFixed(1)}</span>
                                                    <span className="opacity-70">({profile.review_count} reviews)</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700/30">
                                                    <Globe size={16} className="text-blue-500 dark:text-blue-400" /> 
                                                    <span className="text-blue-700 dark:text-blue-300">{profile.service_regions.length} Regions</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                                                    <Clock size={16} className="text-slate-500 dark:text-slate-400" /> 
                                                    <span>Typically replies in 2h</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                                            {profile.description || "Leading tour operator providing high-quality travel experiences with a focus on comprehensive service and partner satisfaction."}
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {profile.specialties.map((spec, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.2 + (i * 0.05) }}
                                                    key={spec}
                                                >
                                                    <GlassBadge className="bg-slate-100/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 text-xs font-semibold">
                                                        {spec}
                                                    </GlassBadge>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>

                        {/* Media Gallery */}
                        {profile.gallery_urls?.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="space-y-5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20 flex items-center justify-center">
                                        <ImageIcon className="text-pink-600 dark:text-pink-400" size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        Media Showcase
                                    </h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {profile.gallery_urls.map((url, idx) => (
                                        <motion.div 
                                            whileHover={{ y: -5, scale: 1.02 }}
                                            key={idx} 
                                            className="aspect-video rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-900 shadow-md group relative cursor-pointer"
                                        >
                                            <Image
                                                src={url}
                                                alt={`${profile.organization_name} gallery image ${idx + 1}`}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Reviews Section */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
                                    <MessageSquare className="text-blue-600 dark:text-blue-400" size={20} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    Partner Reviews <span className="text-slate-400 font-medium text-lg ml-2">({reviews.length})</span>
                                </h2>
                            </div>

                            {currentUserOrgId && currentUserOrgId !== targetOrgId && (
                                <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-100/50 dark:border-blue-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 w-64 h-64 bg-blue-400/10 blur-[60px] rounded-full pointer-events-none -mr-32 -mt-32" />
                                    <div className="relative z-10 space-y-5">
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">Rate your experience</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Your feedback helps the marketplace maintain quality standards.</p>
                                        </div>
                                        <div className="flex gap-2 bg-white/50 dark:bg-slate-900/50 p-3 rounded-2xl w-max border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setNewRating(s)}
                                                    className={`transition-all hover:scale-110 ${newRating >= s ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "text-slate-300 dark:text-slate-700"}`}
                                                    aria-label={`Rate ${s} out of 5`}
                                                >
                                                    <Star size={28} className={newRating >= s ? "fill-amber-400" : ""} />
                                                </button>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                placeholder="Detail your partnership experience... (What went well? Areas for improvement?)"
                                                className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none backdrop-blur-sm shadow-sm transition-all resize-y"
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <GlassButton 
                                                onClick={handleSubmitReview} 
                                                disabled={submittingReview || !newComment.trim()}
                                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                                            >
                                                {submittingReview ? (
                                                    <RefreshCcw className="animate-spin mx-auto" size={18} />
                                                ) : "Post Review"}
                                            </GlassButton>
                                        </div>
                                    </div>
                                </GlassCard>
                            )}

                            <div className="grid gap-4 md:grid-cols-2">
                                {reviews.length > 0 ? reviews.map((rev, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        key={rev.id}
                                    >
                                        <GlassCard className="p-6 h-full flex flex-col justify-between space-y-4 hover:shadow-lg transition-shadow bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 group">
                                            <div className="space-y-3 relative z-10">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star 
                                                            key={s} 
                                                            size={14} 
                                                            className={rev.rating >= s ? "text-amber-500 fill-amber-500 drop-shadow-sm" : "text-slate-200 dark:text-slate-800"} 
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-300 text-[15px] italic leading-relaxed font-medium">
                                                    &ldquo;{rev.comment}&rdquo;
                                                </p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative border border-slate-200 dark:border-slate-700 shadow-sm">
                                                    {rev.reviewer.logo_url ? (
                                                        <Image
                                                            src={rev.reviewer.logo_url}
                                                            alt={`${rev.reviewer.name || "Reviewer"} logo`}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm">
                                                            {rev.reviewer.name?.charAt(0) || "U"}
                                                        </div>}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">{rev.reviewer.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified Partner</div>
                                                </div>
                                            </div>
                                            <div className="absolute top-4 right-4 text-8xl text-slate-100 dark:text-slate-800/30 font-serif leading-none italic pointer-events-none -mt-4 group-hover:dark:text-slate-800/50 transition-colors">"</div>
                                        </GlassCard>
                                    </motion.div>
                                )) : (
                                    <div className="col-span-full py-12 text-center bg-slate-100/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <MessageSquare size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No reviews yet</h3>
                                        <p className="text-slate-500">Be the first to share your experience with {profile.organization_name}.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Sticky Sidebar */}
                    <div className="xl:col-span-1">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="sticky top-24 space-y-6"
                        >
                            <GlassCard className="p-1 overflow-hidden bg-white/30 dark:bg-slate-900/30 border-white/40 dark:border-slate-800/60 backdrop-blur-2xl shadow-xl">
                                <div className="bg-white/80 dark:bg-slate-900/80 rounded-[20px] p-6 space-y-8">
                                    
                                    {/* Quick Actions Header */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-2 h-8 rounded-full bg-blue-500 shrink-0"></div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Partnership Options</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <GlassButton variant="secondary" className="flex flex-col gap-1 items-center justify-center p-3 h-auto text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Phone size={18} />
                                                <span className="text-[10px] font-bold uppercase tracking-wide">Call Direct</span>
                                            </GlassButton>
                                            <GlassButton variant="secondary" className="flex flex-col gap-1 items-center justify-center p-3 h-auto text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                <Mail size={18} />
                                                <span className="text-[10px] font-bold uppercase tracking-wide">Email</span>
                                            </GlassButton>
                                        </div>

                                        {showInquiryModal ? (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="space-y-3 pt-2"
                                            >
                                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block uppercase tracking-wide">Quick Message</label>
                                                    <textarea
                                                        placeholder="Hello, we are interested in your services in..."
                                                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                                                        value={inquiryMessage}
                                                        onChange={(e) => setInquiryMessage(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <GlassButton variant="secondary" className="flex-1 text-sm bg-white dark:bg-slate-800" onClick={() => setShowInquiryModal(false)}>Cancel</GlassButton>
                                                        <GlassButton className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)]" onClick={handleSubmitInquiry} disabled={submittingInquiry || inquirySent}>
                                                            {inquirySent ? "Sent!" : submittingInquiry ? <RefreshCcw size={16} className="animate-spin mx-auto" /> : "Send Request"}
                                                        </GlassButton>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <GlassButton className="w-full py-4 text-base font-bold bg-slate-900 border-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 hover:scale-[1.02] shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-2" onClick={() => setShowInquiryModal(true)} disabled={currentUserOrgId === targetOrgId}>
                                                <MessageSquare size={18} /> Send Partnership Inquiry
                                            </GlassButton>
                                        )}
                                    </div>

                                    <hr className="border-slate-200 dark:border-slate-800" />

                                    {/* Rate Card */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <List size={14} className="text-emerald-500" /> Authorized Rates
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 shadow-[inset_0_1px_0_white] dark:shadow-none">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Standard B2B Margin</span>
                                                <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-black tracking-tight border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                                                    {profile.margin_rate ? `${profile.margin_rate}%` : "Negotiable"}
                                                </div>
                                            </div>
                                            {profile.rate_card?.map(item => (
                                                <div key={item.id} className="flex justify-between items-center px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{item.service}</span>
                                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.margin}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Compliance Box */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldAlert size={14} className="text-indigo-500" /> Compliance Vault
                                        </h3>

                                        {!currentUserIsVerified ? (
                                            <div className="p-5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center shadow-inner">
                                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-500 dark:text-indigo-400">
                                                    <Lock size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest mb-1.5">Verified Access Only</p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-500 leading-relaxed font-medium">To view sensitive legal & safety documents, you must complete your agency verification.</p>
                                                </div>
                                                <Link href="/settings/marketplace" className="block pt-1">
                                                    <GlassButton variant="secondary" className="w-full text-xs font-bold py-2 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md">Get Verified Now</GlassButton>
                                                </Link>
                                            </div>
                                        ) : profile.compliance_documents?.length > 0 ? (
                                            <div className="space-y-2.5">
                                                {profile.compliance_documents.map(doc => (
                                                    <a
                                                        key={doc.id}
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:shadow-sm transition-all group"
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                                                                <FileText size={16} />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.name}</div>
                                                                <div className="text-[9px] text-slate-500 uppercase font-black tracking-wider mt-1">{doc.type}</div>
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 shrink-0 transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                    <FileText size={14} className="text-slate-400 dark:text-slate-500" />
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">No official documents listed yet.</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
