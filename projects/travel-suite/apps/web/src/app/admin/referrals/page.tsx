"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReferralData, useApplyReferralCode } from "@/lib/queries/referrals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Users, HeartHandshake, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ReferralsPage() {
    const { data, isLoading, error, refetch } = useReferralData();
    const { mutate: applyCode, isPending } = useApplyReferralCode();
    const [inviteCode, setInviteCode] = useState("");

    const handleCopy = () => {
        if (!data?.referralCode) return;
        const link = `${window.location.origin}/auth?ref=${data.referralCode}`;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied to clipboard!");
    };

    const handleApplyCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;
        applyCode({ referralCode: inviteCode.trim() });
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error loading referral data</h2>
                <p className="text-slate-500 mb-6">{error.message}</p>
                <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
            </div>
        );
    }

    const { referralCode, stats, referrals } = data || {};

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold Tracking-tight text-slate-900 dark:text-white">Refer & Earn</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Invite other tour operators and earn 1 free month of Premium for every 3 subscribing referrals.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Your Link Card */}
                <Card className="md:col-span-2 shadow-sm border-primary/20 bg-gradient-to-br from-white to-primary/5">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <HeartHandshake className="w-5 h-5 text-primary" />
                            Your Invite Link
                        </CardTitle>
                        <CardDescription>Share this unique link anywhere to earn rewards.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                        ) : (
                            <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg shadow-inner">
                                <div className="flex-1 px-3 py-1 font-mono text-sm text-slate-700 overflow-x-auto whitespace-nowrap scrollbar-hide">
                                    {window.location.origin}/auth?ref={referralCode}
                                </div>
                                <Button onClick={handleCopy} size="sm" className="shrink-0 gap-2 font-medium">
                                    <Copy className="w-4 h-4" />
                                    Copy Link
                                </Button>
                            </div>
                        )}

                        <div className="mt-8">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                Have a code from someone else?
                            </h3>
                            <form onSubmit={handleApplyCode} className="flex items-center gap-3">
                                <Input
                                    placeholder="Enter their invite code"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="max-w-xs bg-white"
                                />
                                <Button type="submit" variant="secondary" disabled={isPending || !inviteCode.trim()}>
                                    Apply Code
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>

                {/* Rewards Progress */}
                <Card className="shadow-sm border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-8 -mt-8" />
                    <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Gift className="w-5 h-5 text-amber-500" />
                            Rewards Progress
                        </CardTitle>
                        <CardDescription>Unlock a free Premium month</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isLoading ? (
                            <div className="space-y-4">
                                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                                <div className="h-4 bg-slate-100 rounded-full animate-pulse" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6 mt-2">
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-slate-900 leading-none">
                                        {stats?.converted || 0}
                                    </span>
                                    <span className="text-slate-500 mb-1 font-medium">/ {stats?.target || 3} Paid Referrals</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                                        <span>Progress</span>
                                        <span>{Math.round(stats?.progress || 0)}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats?.progress || 0}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className="h-full bg-gradient-to-r from-emerald-400 to-primary rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4">
                        <Button
                            className="w-full"
                            variant={stats?.canClaimReward ? "default" : "outline"}
                            disabled={!stats?.canClaimReward}
                        >
                            {stats?.canClaimReward ? "Claim Free Month" : "More Referrals Needed"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Referrals Detailed List */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg">Your Invites</CardTitle>
                    <CardDescription>Track the status of operators you've referred.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse border border-slate-100" />)}
                        </div>
                    ) : referrals?.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-slate-800">No referrals yet</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                                Share your link above to start earning free premium time.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-sm">
                            {referrals?.map((ref) => (
                                <div key={ref.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <div className="font-medium text-slate-900">
                                            {ref.referred_org?.name || "Pending Organization Setup"}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Joined {format(new Date(ref.created_at), "MMM d, yyyy")}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {ref.status === "converted" ? (
                                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                                                Pending Subscription
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
