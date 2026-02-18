"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Star,
    MapPin,
    Trophy,
    Building2,
    ShieldCheck,
    Tag,
    MessageSquare,
    ChevronLeft,
    Clock,
    DollarSign,
    Send,
    ExternalLink,
    RefreshCcw,
    Image as ImageIcon,
    List,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";

interface RateCardItem {
    id: string;
    service: string;
    margin: number;
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

export default function OperatorDetailPage() {
    const params = useParams();
    const targetOrgId = params.id as string;
    const supabase = createClient();

    const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [currentUserOrgId, setCurrentUserOrgId] = useState<string | null>(null);
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
            }

            const profRes = await fetch(`/api/marketplace?q=`, { headers });
            if (profRes.ok) {
                const allProfs = await profRes.json();
                const found = allProfs.find((p: any) => p.organization_id === targetOrgId);
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
        } catch (error: any) {
            alert(error.message);
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
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSubmittingInquiry(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <RefreshCcw className="animate-spin text-blue-400" size={48} />
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen p-10 flex flex-col items-center justify-center space-y-4 text-center">
            <Building2 size={64} className="text-slate-700" />
            <h1 className="text-2xl font-bold text-white">Operator not found</h1>
            <Link href="/admin/marketplace"><GlassButton>Back to Marketplace</GlassButton></Link>
        </div>
    );

    return (
        <div className="min-h-screen p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto">
            <Link href="/admin/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft size={20} /> Back to Marketplace
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Hero Profile */}
                    <GlassCard className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-32 h-32 rounded-3xl bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0 relative">
                                {profile.organization_logo ? (
                                    <Image src={profile.organization_logo} alt={profile.organization_name} fill className="object-cover" />
                                ) : (
                                    <Building2 size={48} className="text-slate-600" />
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-4xl font-bold text-white tracking-tight">{profile.organization_name}</h1>
                                        {profile.is_verified && (
                                            <div className="px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1">
                                                <ShieldCheck size={14} /> Verified
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Star size={16} className="fill-yellow-500" />
                                            <span className="font-bold text-slate-200">{profile.average_rating.toFixed(1)}</span>
                                            <span className="opacity-60">({profile.review_count} reviews)</span>
                                        </div>
                                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                        <div className="flex items-center gap-1.5"><MapPin size={16} /> {profile.service_regions.length} Regions</div>
                                    </div>
                                </div>
                                <p className="text-lg text-slate-300 leading-relaxed">{profile.description || "Leading tour operator providing high-quality travel experiences."}</p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {profile.specialties.map(spec => <GlassBadge key={spec}>{spec}</GlassBadge>)}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Media Gallery */}
                    {profile.gallery_urls?.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ImageIcon className="text-pink-400" size={20} /> Media Showcase
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {profile.gallery_urls.map((url, idx) => (
                                    <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl group">
                                        <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <MessageSquare className="text-blue-400" /> Partner Reviews
                        </h2>
                        {currentUserOrgId && currentUserOrgId !== targetOrgId && (
                            <GlassCard className="p-6 bg-blue-500/5">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-white">Rate this partner</h4>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button key={s} onClick={() => setNewRating(s)} className={`transition-all ${newRating >= s ? "text-yellow-400" : "text-slate-800"}`}>
                                                <Star size={24} className={newRating >= s ? "fill-yellow-400" : ""} />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        placeholder="Share your partnership experience..."
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-white text-sm h-24"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <GlassButton onClick={handleSubmitReview} disabled={submittingReview || !newComment.trim()}>Submit Review</GlassButton>
                                    </div>
                                </div>
                            </GlassCard>
                        )}
                        <div className="space-y-4">
                            {reviews.map(rev => (
                                <GlassCard key={rev.id} className="p-6 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                                            {rev.reviewer.logo_url ? <img src={rev.reviewer.logo_url} className="w-full h-full object-cover" /> : <Building2 size={16} className="m-2 text-slate-600" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{rev.reviewer.name}</div>
                                            <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className={rev.rating >= s ? "text-yellow-500 fill-yellow-500" : "text-slate-800"} />)}</div>
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-sm italic">"{rev.comment}"</p>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <GlassCard className="p-6 sticky top-10 space-y-6">
                        {/* Rate Card */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <List size={14} className="text-green-400" /> Partner Rates
                            </h3>
                            <div className="space-y-2">
                                {profile.rate_card?.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <span className="text-sm text-slate-300">{item.service}</span>
                                        <span className="text-sm font-bold text-green-400">{item.margin}%</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                                    <span className="text-sm font-medium text-slate-200 text-xs">Standard Margin</span>
                                    <span className="text-lg font-bold text-green-400">{profile.margin_rate ? `${profile.margin_rate}%` : "Negotiable"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Connection CTA */}
                        <div className="pt-6 border-t border-slate-800 space-y-4">
                            {showInquiryModal ? (
                                <div className="space-y-3">
                                    <textarea
                                        placeholder="Briefly describe your interest in partnering..."
                                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-white h-24"
                                        value={inquiryMessage}
                                        onChange={(e) => setInquiryMessage(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <GlassButton variant="secondary" className="flex-1 text-xs" onClick={() => setShowInquiryModal(false)}>Cancel</GlassButton>
                                        <GlassButton className="flex-1 text-xs" onClick={handleSubmitInquiry} disabled={submittingInquiry || inquirySent}>
                                            {inquirySent ? "Sent!" : submittingInquiry ? "..." : "Send Request"}
                                        </GlassButton>
                                    </div>
                                </div>
                            ) : (
                                <GlassButton className="w-full" onClick={() => setShowInquiryModal(true)} disabled={currentUserOrgId === targetOrgId}>
                                    Partner Inquiry
                                </GlassButton>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
