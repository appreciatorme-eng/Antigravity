"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Link2, Check, Copy, Mail, Share2 } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    itineraryId: string;
    tripTitle: string;
    templateId?: string;
}

export default function ShareModal({ isOpen, onClose, itineraryId, tripTitle, templateId = "safari_story" }: ShareModalProps) {
    const supabase = createClient();
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const generateShareLink = async () => {
        setLoading(true);
        setError("");

        try {
            const shareToken = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            // Upsert so the template is always saved/updated even if a link already exists
            const { data: upserted, error: upsertError } = await supabase
                .from("shared_itineraries")
                .upsert(
                    {
                        itinerary_id: itineraryId,
                        share_code: shareToken,
                        expires_at: expiresAt.toISOString(),
                        template_id: templateId,
                    },
                    { onConflict: "itinerary_id", ignoreDuplicates: false }
                )
                .select("share_code")
                .single();

            if (upsertError) throw upsertError;

            const code = upserted?.share_code ?? shareToken;
            setShareUrl(`${window.location.origin}/share/${code}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to generate share link";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate link as soon as the modal opens — no second click needed
    useEffect(() => {
        if (isOpen && !shareUrl && !loading) {
            generateShareLink();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const copyToClipboard = async () => {
        if (!shareUrl) return;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement("textarea");
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareViaEmail = () => {
        if (!shareUrl) return;
        const subject = encodeURIComponent(`Check out my trip to ${tripTitle}`);
        const body = encodeURIComponent(`I planned this trip with GoBuddy Adventures!\n\n${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const shareViaTwitter = () => {
        if (!shareUrl) return;
        const text = encodeURIComponent(`Check out my trip to ${tripTitle}! Planned with @GoBuddyAdventures`);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Share2 className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Share Your Trip</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Share &quot;{tripTitle}&quot; with friends and family
                    </p>
                </div>

                {/* Generate link section */}
                {!shareUrl ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-500">{error ? error : "Generating your magic link..."}</p>
                        {error && (
                            <button
                                onClick={generateShareLink}
                                className="text-sm text-primary underline"
                            >
                                Try again
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Share URL input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
                            />
                            <button
                                onClick={copyToClipboard}
                                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${copied
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Share options */}
                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 mb-3">Or share via:</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={shareViaEmail}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
                                >
                                    <Mail className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Email</span>
                                </button>
                                <button
                                    onClick={shareViaTwitter}
                                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
                                >
                                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">X</span>
                                </button>
                            </div>
                        </div>

                        {/* Expiry note */}
                        <p className="text-xs text-gray-400 text-center">
                            This link will expire in 30 days
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
