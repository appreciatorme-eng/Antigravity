"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Copy,
    Check,
    Share2,
    Globe,
    Loader2,
    Sparkles,
    Lock,
    LayoutDashboard,
    Newspaper,
} from "lucide-react";
import { TEMPLATE_REGISTRY } from "@/components/templates/TemplateRegistry";

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    itineraryId: string;
    tripTitle: string;
    isPro?: boolean; // Whether the current org has a PRO subscription
}

// Icon map for rendering template icons
const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
    classic: <LayoutDashboard className="w-6 h-6" />,
    modern: <Newspaper className="w-6 h-6" />,
};

// Thumbnail previews using simple gradient/color blocks representing each template
const TEMPLATE_THUMBNAILS: Record<string, React.ReactNode> = {
    classic: (
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-sky-100 p-2 flex flex-col gap-1.5">
            {/* Header bar */}
            <div className="h-2 w-full rounded bg-white/80" />
            {/* Title block */}
            <div className="h-3 w-3/4 rounded bg-emerald-600/40" />
            <div className="h-2 w-1/2 rounded bg-gray-300/60" />
            {/* Map block */}
            <div className="flex-1 rounded bg-emerald-200/60 flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-500/60" />
            </div>
            {/* Day cards */}
            <div className="h-2.5 w-full rounded bg-white/70" />
            <div className="h-2.5 w-full rounded bg-white/70" />
        </div>
    ),
    modern: (
        <div className="w-full h-full bg-stone-900 p-2 flex flex-col gap-1.5">
            {/* Hero section */}
            <div className="h-8 rounded bg-stone-700 flex flex-col justify-end p-1 gap-0.5">
                <div className="h-1.5 w-2/3 rounded bg-white/50" />
                <div className="h-1 w-1/2 rounded bg-white/30" />
            </div>
            {/* Two-column layout */}
            <div className="flex-1 flex gap-1.5">
                {/* Main content column */}
                <div className="flex-1 flex flex-col gap-1">
                    <div className="h-2.5 w-full rounded bg-white/10" />
                    <div className="h-2.5 w-5/6 rounded bg-white/10" />
                    <div className="h-2.5 w-full rounded bg-white/10" />
                </div>
                {/* Sidebar */}
                <div className="w-1/3 flex flex-col gap-1">
                    <div className="flex-1 rounded bg-stone-700" />
                    <div className="h-3 rounded bg-slate-800" />
                </div>
            </div>
        </div>
    ),
};

export default function ShareTripModal({
    isOpen,
    onClose,
    itineraryId,
    tripTitle,
    isPro = false,
}: ShareTripModalProps) {
    const [loading, setLoading] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState("classic");
    const supabase = createClient();

    const generateShareLink = async () => {
        setLoading(true);
        try {
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            const { error } = await supabase.from("shared_itineraries").insert({
                itinerary_id: itineraryId,
                share_code: token,
                expires_at: expiresAt.toISOString(),
                template_id: selectedTemplateId,
            });

            if (error) {
                console.error("Error creating share link:", error);
                throw error;
            }

            const link = `${window.location.origin}/share/${token}`;
            setShareLink(link);
        } catch (error) {
            console.error(error);
            alert("Failed to generate share link. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" />
                        Share {tripTitle}
                    </DialogTitle>
                    <DialogDescription>
                        Choose a presentation style and generate a client link.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* ─── Template Selector ─── */}
                    {!shareLink && (
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-3">
                                Presentation Template
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {TEMPLATE_REGISTRY.map((template) => {
                                    const isLocked = template.isPremium && !isPro;
                                    const isSelected =
                                        selectedTemplateId === template.id;

                                    return (
                                        <button
                                            key={template.id}
                                            type="button"
                                            disabled={isLocked}
                                            onClick={() =>
                                                !isLocked &&
                                                setSelectedTemplateId(template.id)
                                            }
                                            className={`relative group rounded-xl border-2 text-left transition-all ${isSelected
                                                    ? "border-primary shadow-md ring-2 ring-primary/20"
                                                    : "border-gray-200 hover:border-gray-300"
                                                } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                            {/* Thumbnail Preview */}
                                            <div className="h-28 w-full rounded-t-[10px] overflow-hidden">
                                                {TEMPLATE_THUMBNAILS[template.id] ?? (
                                                    <div className="w-full h-full bg-gray-100" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-3">
                                                <div className="flex items-center justify-between gap-1 mb-1">
                                                    <span className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                                                        {TEMPLATE_ICONS[template.id]}
                                                        {template.name}
                                                    </span>
                                                    {template.isPremium && (
                                                        <span
                                                            className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isPro
                                                                    ? "bg-amber-100 text-amber-700"
                                                                    : "bg-gray-100 text-gray-500"
                                                                }`}
                                                        >
                                                            {isPro ? (
                                                                <Sparkles className="w-3 h-3" />
                                                            ) : (
                                                                <Lock className="w-3 h-3" />
                                                            )}
                                                            PRO
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 leading-snug">
                                                    {template.description}
                                                </p>
                                            </div>

                                            {/* Selection indicator */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}

                                            {/* Locked overlay */}
                                            {isLocked && (
                                                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                                    <div className="flex flex-col items-center gap-1 text-center px-4">
                                                        <Lock className="w-5 h-5 text-gray-500" />
                                                        <span className="text-xs font-semibold text-gray-600">
                                                            Upgrade to PRO
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ─── Generate / Link Display ─── */}
                    {!shareLink ? (
                        <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <Globe className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-gray-900">Ready to share?</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Your client will see the{" "}
                                    <span className="font-semibold text-gray-700">
                                        {TEMPLATE_REGISTRY.find(
                                            (t) => t.id === selectedTemplateId
                                        )?.name}{" "}
                                    </span>
                                    template.
                                </p>
                            </div>
                            <Button
                                onClick={generateShareLink}
                                disabled={loading}
                                className="w-full sm:w-auto"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating…
                                    </>
                                ) : (
                                    "Generate Client Link ✨"
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                <Check className="w-4 h-4 shrink-0" />
                                <span>
                                    Link generated with the{" "}
                                    <span className="font-semibold">
                                        {TEMPLATE_REGISTRY.find(
                                            (t) => t.id === selectedTemplateId
                                        )?.name}
                                    </span>{" "}
                                    template.
                                </span>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Share Link
                                </label>
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
                                        className={
                                            copied
                                                ? "text-green-600 border-green-600 bg-green-50"
                                                : ""
                                        }
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md flex gap-2 items-start">
                                <div className="mt-0.5">ℹ️</div>
                                <p>
                                    This link expires in 30 days. Anyone with the link
                                    can view the itinerary.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    {shareLink ? (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShareLink(null);
                            }}
                            disabled={loading}
                            className="text-gray-500"
                        >
                            Change Template
                        </Button>
                    ) : (
                        <span />
                    )}
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
