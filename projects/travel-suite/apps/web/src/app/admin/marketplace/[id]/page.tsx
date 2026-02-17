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
    RefreshCcw
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { GlassInput } from "@/components/glass/GlassInput";

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

            // Fetch user's own profile to get organization_id for review restriction
            if (session?.user) {
                const { data: userProfile } = await supabase
                    .from("profiles")
                    .select("organization_id")
                    .eq("id", session.user.id)
                    .single();
                setCurrentUserOrgId(userProfile?.organization_id || null);
            }

            // Fetch marketplace profile
            // Note: We need the broad list but filtered to this ID for our flattened fields
            const profRes = await fetch(`/api/marketplace?q=`, { headers });
            if (profRes.ok) {
                const allProfs = await responseToJSON(profRes);
                const found = allProfs.find((p: any) => p.organization_id === targetOrgId);
                setProfile(found || null);
            }

            // Fetch reviews
            const revRes = await fetch(`/api/marketplace/${targetOrgId}/reviews`, { headers });
            if (revRes.ok) {
                setReviews(await responseToJSON(revRes));
            }
        } catch (error) {
            console.error("Error fetching detail:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, targetOrgId]);

    async function responseToJSON(res: Response) {
        return res.json();
    }

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
                body: JSON.stringify({
                    rating: newRating,
                    comment: newComment
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to submit review");
            }

            setNewComment("");
            setNewRating(5);
            void fetchData(); // Refresh data
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
                body: JSON.stringify({
                    message: inquiryMessage
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Failed to send inquiry");
            }

            setInquirySent(true);
            setInquiryMessage("");
            setTimeout(() => {
                setShowInquiryModal(false);
                setInquirySent(false);
            }, 3000);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSubmittingInquiry(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-blue-400">
                    <RefreshCcw size={48} />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen p-10 flex flex-col items-center justify-center space-y-4">
                <Building2 size={64} className="text-slate-700" />
                <h1 className="text-2xl font-bold text-white">Operator not found</h1>
                <Link href="/admin/marketplace">
                    <GlassButton>Back to Marketplace</GlassButton>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto">
            {/* Nav */}
            <Link href="/admin/marketplace" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft size={20} />
                Back to Marketplace
            </Link>

            {/* Profile Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <GlassCard className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-32 h-32 rounded-3xl bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0 relative">
                                {profile.organization_logo ? (
                                    <Image
                                        src={profile.organization_logo}
                                        alt={profile.organization_name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <Building2 size={48} className="text-slate-600" />
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-4xl font-bold text-white tracking-tight">
                                            {profile.organization_name}
                                        </h1>
                                        {profile.is_verified && (
                                            <div className="p-1 px-2.5 bg-green-500/10 text-green-400 rounded-full text-xs font-bold border border-green-500/20 flex items-center gap-1">
                                                <ShieldCheck size={14} />
                                                Verified Partner
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-400">
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <Star size={18} className="fill-yellow-500" />
                                            <span className="font-bold text-slate-200">{profile.average_rating.toFixed(1)}</span>
                                            <span className="text-sm opacity-60">({profile.review_count} reviews)</span>
                                        </div>
                                        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full"></div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={18} />
                                            <span>{profile.service_regions.length} Regions Covered</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
                                    {profile.description || "No description provided."}
                                </p>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {profile.specialties.map(spec => (
                                        <GlassBadge key={spec}>{spec}</GlassBadge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Regions & Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassCard className="p-6 space-y-4">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <MapPin size={20} className="text-blue-400" />
                                Service Regions
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.service_regions.map(region => (
                                    <div key={region} className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-300 text-sm">
                                        {region}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                        <GlassCard className="p-6 space-y-4">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <DollarSign size={20} className="text-green-400" />
                                Partner Margin
                            </h3>
                            <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-center justify-between">
                                <span className="text-slate-400">Standard Margin Rate</span>
                                <span className="text-2xl font-bold text-green-400">
                                    {profile.margin_rate ? `${profile.margin_rate}%` : "Negotiable"}
                                </span>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Reviews Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <MessageSquare size={24} className="text-blue-400" />
                                Peer Reviews
                            </h2>
                            <span className="text-slate-500">{reviews.length} total reviews</span>
                        </div>

                        {/* Submit Review Form (Only show if not reviewing self) */}
                        {currentUserOrgId && currentUserOrgId !== targetOrgId && (
                            <GlassCard className="p-6 bg-blue-500/5 border-blue-500/10">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-white">Rate this partner</h4>
                                    <div className="flex items-center gap-2 text-2xl">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onClick={() => setNewRating(star)}
                                                className={`transition-all hover:scale-110 ${newRating >= star ? "text-yellow-400" : "text-slate-700"}`}
                                            >
                                                <Star size={28} className={newRating >= star ? "fill-yellow-400" : ""} />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            placeholder="Sharing your partnership experience helps the marketplace..."
                                            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500/30 outline-none h-24"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                        <div className="absolute bottom-4 right-4 text-xs text-slate-600">
                                            Only other operators see this
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <GlassButton
                                            onClick={handleSubmitReview}
                                            disabled={submittingReview || !newComment.trim()}
                                            className="flex items-center gap-2"
                                        >
                                            {submittingReview ? <RefreshCcw className="animate-spin" size={16} /> : <Send size={16} />}
                                            Submit Review
                                        </GlassButton>
                                    </div>
                                </div>
                            </GlassCard>
                        )}

                        {/* Review List */}
                        <div className="space-y-4">
                            {reviews.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 italic">
                                    No reviews yet. Be the first partner to rate them!
                                </div>
                            ) : (
                                reviews.map(review => (
                                    <GlassCard key={review.id} className="p-6 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden relative">
                                                    {review.reviewer.logo_url ? (
                                                        <Image src={review.reviewer.logo_url} alt={review.reviewer.name} fill className="object-cover" />
                                                    ) : (
                                                        <Building2 size={16} className="text-slate-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white">{review.reviewer.name}</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <Star key={s} size={12} className={review.rating >= s ? "text-yellow-400 fill-yellow-400" : "text-slate-800"} />
                                                            ))}
                                                        </div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-slate-400 leading-relaxed italic">
                                            "{review.comment}"
                                        </p>
                                    </GlassCard>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <GlassCard className="p-6 sticky top-10 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider text-sm opacity-60">Engagement</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                    <div className="text-2xl font-bold text-white tracking-tight">{profile.review_count}</div>
                                    <div className="text-xs text-slate-500">Connections</div>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                    <div className="text-2xl font-bold text-white tracking-tight">{Math.round(profile.average_rating * 20)}%</div>
                                    <div className="text-xs text-slate-500">Confidence</div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800 space-y-4">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider text-sm opacity-60">Primary Specialties</h3>
                            <div className="space-y-3">
                                {profile.specialties.map(spec => (
                                    <div key={spec} className="flex items-center gap-3 text-slate-300">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        {spec}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800 space-y-4">
                            {showInquiryModal ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <textarea
                                        placeholder="Briefly describe your interest in partnering..."
                                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-blue-500/30 outline-none h-24"
                                        value={inquiryMessage}
                                        onChange={(e) => setInquiryMessage(e.target.value)}
                                        disabled={inquirySent}
                                    />
                                    <div className="flex gap-2">
                                        <GlassButton
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => setShowInquiryModal(false)}
                                            disabled={submittingInquiry}
                                        >
                                            Cancel
                                        </GlassButton>
                                        <GlassButton
                                            className="flex-1 flex items-center justify-center gap-2"
                                            onClick={handleSubmitInquiry}
                                            disabled={submittingInquiry || !inquiryMessage.trim() || inquirySent}
                                        >
                                            {inquirySent ? <CheckCircle2 size={16} /> : submittingInquiry ? <RefreshCcw className="animate-spin" size={16} /> : <Send size={16} />}
                                            {inquirySent ? "Sent!" : "Send"}
                                        </GlassButton>
                                    </div>
                                </div>
                            ) : (
                                <GlassButton
                                    className="w-full group"
                                    onClick={() => setShowInquiryModal(true)}
                                    disabled={currentUserOrgId === targetOrgId}
                                >
                                    <span className="flex-1 text-center">Inquiry Connection</span>
                                    <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </GlassButton>
                            )}
                            <p className="text-xs text-slate-600 text-center">
                                Connecting confirms you agree to our Marketplace Terms of Engagement.
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

import { CheckCircle2 } from "lucide-react";

