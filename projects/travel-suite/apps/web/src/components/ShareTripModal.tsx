"use client";

import { useState, useEffect, useRef } from "react";
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
import { Copy, Check, Share2, Loader2 } from "lucide-react";
import type { ItineraryResult } from "@/types/itinerary";
import { useToast } from "@/components/ui/toast";
import ClientPicker from "@/components/ClientPicker";

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
    const resolvedIdRef = useRef<string | undefined>(itineraryId);
    const supabase = createClient();
    const { toast } = useToast();

    const generateShareLink = async () => {
        setLoading(true);
        setError("");
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;

            // Call the server-side API to create or retrieve a share link.
            // This bypasses RLS (uses adminClient on the server) and handles
            // auto-saving unsaved itineraries + creating trip records.
            const response = await fetch("/api/admin/share/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    "x-requested-with": "XMLHttpRequest",
                },
                body: JSON.stringify({
                    itineraryId: itineraryId ?? undefined,
                    rawItineraryData: !itineraryId && rawItineraryData ? rawItineraryData : undefined,
                    templateId: initialTemplateId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || "Failed to generate share link");
            }

            const payload = await response.json();
            const data = payload.data;

            resolvedIdRef.current = data.itineraryId ?? itineraryId;
            setShareLink(`${window.location.origin}/share/${data.shareCode}`);
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
                title: "Link Copied!",
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
                                {error ? error : "Generating your magic link..."}
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

                            {/* Client picker for assigning + sending */}
                            <ClientPicker
                                shareLink={shareLink}
                                itineraryId={resolvedIdRef.current}
                            />

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
