"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Link2, Check, Copy, Mail, Share2, MessageCircle, Send } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    itineraryId: string;
    tripTitle: string;
    templateId?: string;   // The template saved with this itinerary
    client?: {
        name: string;
        email?: string;
        phone?: string;
    } | null;
}

export default function ShareModal({ isOpen, onClose, itineraryId, tripTitle, templateId = "safari_story", client }: ShareModalProps) {
    const supabase = createClient();
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const generateShareLink = async () => {
        setLoading(true);
        setError("");

        try {
            // Check if a share already exists for this itinerary
            const { data: existing } = await supabase
                .from("shared_itineraries")
                .select("id, share_code")
                .eq("itinerary_id", itineraryId)
                .maybeSingle();

            if (existing) {
                // Always sync the template to match the itinerary's current choice
                const { error: updateErr } = await supabase
                    .from("shared_itineraries")
                    .update({ template_id: templateId })
                    .eq("id", existing.id);

                if (updateErr) throw updateErr;
                setShareUrl(`${window.location.origin}/share/${existing.share_code}`);
            } else {
                // Brand-new share — use the itinerary's template
                const shareToken = crypto.randomUUID();
                const expiresAt = new Date();
                expiresAt.setMonth(expiresAt.getMonth() + 1);

                const { error: insertError } = await supabase
                    .from("shared_itineraries")
                    .insert({
                        itinerary_id: itineraryId,
                        share_code: shareToken,
                        expires_at: expiresAt.toISOString(),
                        template_id: templateId,
                    });

                if (insertError) throw insertError;
                setShareUrl(`${window.location.origin}/share/${shareToken}`);
            }
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
        if (!client?.email) {
            setError("Cannot send email: Client email is missing.");
            return;
        }
        setError("");
        const subject = encodeURIComponent(`Your bespoke itinerary to ${tripTitle}`);
        const body = encodeURIComponent(`Hello ${client.name},\n\nI have prepared your personalized itinerary for ${tripTitle}. You can view it here:\n\n${shareUrl}\n\nLooking forward to your feedback!`);
        window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
    };

    const shareViaWhatsApp = () => {
        if (!shareUrl) return;
        if (!client?.phone) {
            setError("Cannot send WhatsApp: Client phone number is missing.");
            return;
        }
        setError("");
        const text = encodeURIComponent(`Hello ${client.name}, here is your personalized itinerary for ${tripTitle}: ${shareUrl}`);
        window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${text}`);
    };

    const shareViaBoth = () => {
        if (!shareUrl) return;
        let missing = [];
        if (!client?.email) missing.push("email");
        if (!client?.phone) missing.push("phone number");

        if (missing.length > 0) {
            setError(`Missing client ${missing.join(" and ")}.`);
            return;
        }

        setError("");
        // Sequence: Open WhatsApp first, then Email
        shareViaWhatsApp();
        setTimeout(shareViaEmail, 1000);
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
                            <p className="text-sm text-gray-500 mb-3 font-medium">Send directly to {client?.name || "client"}:</p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 animate-in fade-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <button
                                        onClick={shareViaEmail}
                                        className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-all hover:border-primary/20 bg-white"
                                    >
                                        <Mail className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium text-gray-700">Send Email</span>
                                    </button>
                                    <button
                                        onClick={shareViaWhatsApp}
                                        className="flex-1 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-all hover:border-green-500/20 bg-white"
                                    >
                                        <MessageCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                                    </button>
                                </div>

                                <button
                                    onClick={shareViaBoth}
                                    className="w-full py-2.5 bg-secondary text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    <span className="text-sm font-semibold">Send via Both</span>
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
