"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2, Loader2, Link2 } from "lucide-react";
import type { ItineraryResult } from "@/types/itinerary";
import { useToast } from "@/components/ui/toast";

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    itineraryId?: string;
    tripTitle: string;
    isPro?: boolean;
    initialTemplateId?: string;       // The template currently active in the planner
    rawItineraryData?: ItineraryResult; // For unsaved planner trips: auto-save before sharing
}

export default function ShareTripModal({
    isOpen,
    onClose,
    itineraryId,
    tripTitle,
    initialTemplateId = "safari_story",
    rawItineraryData,
}: ShareTripModalProps) {
    const [loading, setLoading] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();
    const { toast } = useToast();

    const generateShareLink = async () => {
        setLoading(true);
        setError("");
        try {
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            let resolvedItineraryId = itineraryId;

            // Auto-save the raw itinerary if it hasn't been saved yet (planner flow)
            if (!resolvedItineraryId && rawItineraryData) {
                const { data: sessionData } = await supabase.auth.getUser();
                const userId = sessionData?.user?.id ?? null;

                const { data: saved, error: saveErr } = await supabase
                    .from("itineraries")
                    .insert({
                        user_id: userId,
                        trip_title: rawItineraryData.trip_title,
                        destination: rawItineraryData.destination,
                        summary: rawItineraryData.summary,
                        duration_days: rawItineraryData.duration_days,
                        raw_data: rawItineraryData as any,
                    })
                    .select("id")
                    .single();

                if (saveErr) throw saveErr;
                resolvedItineraryId = saved.id as string;

                // Also create a trip record so shared itineraries appear on Trips page
                if (userId) {
                    try {
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("organization_id")
                            .eq("id", userId)
                            .single();

                        await supabase
                            .from("trips")
                            .insert({
                                itinerary_id: resolvedItineraryId,
                                client_id: userId,
                                organization_id: profile?.organization_id ?? null,
                                status: "pending",
                                destination: rawItineraryData.destination,
                            });
                    } catch {
                        // Non-critical: trip creation can fail gracefully
                        console.warn("Trip record creation failed during share");
                    }
                }
            }

            // Check if a share link already exists for this itinerary
            if (resolvedItineraryId) {
                const { data: existing } = await supabase
                    .from("shared_itineraries")
                    .select("id, share_code")
                    .eq("itinerary_id", resolvedItineraryId)
                    .maybeSingle();

                if (existing) {
                    // Update template and reuse existing share code
                    const { error: updateErr } = await supabase
                        .from("shared_itineraries")
                        .update({ template_id: initialTemplateId })
                        .eq("id", existing.id);

                    if (updateErr) throw updateErr;

                    setShareLink(`${window.location.origin}/share/${existing.share_code}`);
                    return;
                }
            }

            // Insert fresh share link with the correct template
            const { error: insertErr } = await supabase
                .from("shared_itineraries")
                .insert({
                    itinerary_id: resolvedItineraryId ?? null,
                    share_code: token,
                    expires_at: expiresAt.toISOString(),
                    template_id: initialTemplateId,
                });

            if (insertErr) throw insertErr;

            setShareLink(`${window.location.origin}/share/${token}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to generate share link";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate as soon as modal opens — no second click needed
    useEffect(() => {
        if (isOpen && !shareLink && !loading) {
            generateShareLink();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const copyToClipboard = () => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            toast({
                title: "Link Copied! 🔗",
                description: "Share this quote with your client to close the deal.",
                durationMs: 4000,
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" />
                        Share &quot;{tripTitle}&quot;
                    </DialogTitle>
                    <DialogDescription>
                        Generating a magic link with the <strong>{initialTemplateId.replace(/_/g, " ")}</strong> template.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {!shareLink ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            {loading && (
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            )}
                            <p className="text-sm text-gray-500">
                                {error ? error : "Generating your magic link…"}
                            </p>
                            {error && (
                                <Button size="sm" variant="outline" onClick={generateShareLink}>
                                    Try again
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                <Check className="w-4 h-4 shrink-0" />
                                <span>
                                    Magic link ready — using <strong>{initialTemplateId.replace(/_/g, " ")}</strong> template.
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={shareLink}
                                    readOnly
                                    className="font-mono text-sm bg-gray-50"
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={copyToClipboard}
                                    className={copied ? "text-green-600 border-green-600 bg-green-50" : ""}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>

                            <p className="text-xs text-gray-400 text-center">
                                This link expires in 30 days. Anyone with the link can view the itinerary.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
