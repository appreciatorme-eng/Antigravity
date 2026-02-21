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
} from "lucide-react";
import { TEMPLATE_REGISTRY } from "@/components/templates/TemplateRegistry";
import type { ItineraryResult } from "@/types/itinerary";

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    itineraryId?: string;           // If already saved; omit for planner (unsaved) trips
    tripTitle: string;
    isPro?: boolean;
    initialTemplateId?: string;     // Pre-select based on active template in planner
    rawItineraryData?: ItineraryResult; // For unsaved planner trips: auto-save before sharing
}

// ── Rich SVG thumbnail previews for each template ──
const SafariThumb = () => (
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <linearGradient id="sh" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>
        </defs>
        <rect width="200" height="120" fill="#0f172a" />
        <rect width="200" height="120" fill="url(#sh)" />
        <rect x="45" y="14" width="110" height="8" rx="4" fill="white" fillOpacity="0.85" />
        <rect x="70" y="26" width="60" height="5" rx="2.5" fill="white" fillOpacity="0.5" />
        <rect x="75" y="36" width="50" height="11" rx="5.5" fill="#d97706" fillOpacity="0.9" />
        <rect y="50" width="200" height="3" fill="#d97706" opacity="0.8" />
        <rect y="53" width="200" height="67" fill="white" />
        <rect x="12" y="62" width="55" height="5" rx="2.5" fill="#0f172a" fillOpacity="0.65" />
        {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${12 + i * 61}, 73)`}>
                <rect width="56" height="38" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                <rect width="56" height="20" rx="4" fill="#fef3c7" />
                <rect x="2" y="2" width="52" height="16" rx="3" fill="#d97706" fillOpacity="0.2" />
                <rect x="4" y="25" width="35" height="4" rx="2" fill="#1e293b" fillOpacity="0.5" />
                <rect x="4" y="32" width="22" height="3" rx="1.5" fill="#94a3b8" />
            </g>
        ))}
    </svg>
);

const UrbanThumb = () => (
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="200" height="120" fill="white" />
        <rect width="200" height="4" fill="#124ea2" />
        <rect x="12" y="11" width="32" height="4" rx="2" fill="#124ea2" fillOpacity="0.7" />
        <rect x="12" y="19" width="110" height="7" rx="3.5" fill="#0f172a" fillOpacity="0.8" />
        <rect x="12" y="30" width="65" height="4" rx="2" fill="#94a3b8" />
        {[0, 1, 2].map((i) => (
            <rect key={i} x={12 + i * 45} y="40" width="40" height="16" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        ))}
        {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(12, ${64 + i * 15})`}>
                <rect width="176" height="12" rx="3" fill={i === 0 ? "#dbeafe" : "#f8fafc"} stroke="#e2e8f0" strokeWidth="0.75" />
                <rect x="2" y="2" width="8" height="8" rx="1.5" fill="#124ea2" />
                <rect x="14" y="3" width="50" height="4" rx="2" fill="#1e293b" fillOpacity={i === 0 ? "0.75" : "0.45"} />
                <rect x="68" y="3" width="30" height="4" rx="2" fill="#124ea2" fillOpacity="0.25" />
            </g>
        ))}
        <rect y="116" width="200" height="4" fill="#124ea2" />
    </svg>
);

const ProfessionalThumb = () => (
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="200" height="120" fill="#f9fafb" />
        <rect x="60" y="10" width="80" height="3" rx="1.5" fill="#6b7280" />
        <rect x="30" y="17" width="140" height="8" rx="4" fill="#111827" fillOpacity="0.85" />
        <rect x="65" y="29" width="70" height="4" rx="2" fill="#6b7280" fillOpacity="0.65" />
        <line x1="12" y1="41" x2="188" y2="41" stroke="#e5e7eb" strokeWidth="1" />
        <rect x="20" y="47" width="160" height="3.5" rx="1.75" fill="#374151" fillOpacity="0.45" />
        <rect x="35" y="54" width="130" height="3.5" rx="1.75" fill="#374151" fillOpacity="0.30" />
        <rect x="55" y="61" width="90" height="3.5" rx="1.75" fill="#374151" fillOpacity="0.20" />
        <line x1="12" y1="71" x2="188" y2="71" stroke="#e5e7eb" strokeWidth="1" />
        {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(12, ${78 + i * 12})`}>
                <circle cx="5" cy="4" r="4.5" fill="#124ea2" fillOpacity={1 - i * 0.2} />
                <rect x="14" y="1.5" width="52" height="4" rx="2" fill="#111827" fillOpacity={0.65 - i * 0.1} />
                <rect x="70" y="1.5" width="100" height="4" rx="2" fill="#9ca3af" fillOpacity="0.6" />
            </g>
        ))}
    </svg>
);

const LuxuryThumb = () => (
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="200" height="120" fill="#000000" />
        <rect width="200" height="40" fill="#ccb27a" fillOpacity="0.15" />
        <rect x="60" y="15" width="80" height="8" rx="4" fill="#ffffff" fillOpacity="0.9" />
        <rect x="80" y="27" width="40" height="3" rx="1.5" fill="#ccb27a" />
        {[0, 1].map((i) => (
            <g key={i} transform={`translate(${15 + i * 90}, 50)`}>
                <rect width="80" height="60" rx="6" fill="#ffffff" fillOpacity="0.05" stroke="#ffffff" strokeOpacity="0.1" />
                <rect x="5" y="5" width="70" height="25" rx="4" fill="#ffffff" fillOpacity="0.1" />
                <rect x="10" y="38" width="50" height="4" rx="2" fill="#ffffff" fillOpacity="0.8" />
            </g>
        ))}
    </svg>
);

const VisualThumb = () => (
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="200" height="120" fill="#f8fafc" />
        <rect width="200" height="40" fill="#0f172a" />
        <rect x="20" y="20" width="100" height="8" rx="4" fill="#ffffff" />
        {[0, 1].map((i) => (
            <g key={i} transform={`translate(15, ${50 + i * 35})`}>
                <rect x={i % 2 === 0 ? 0 : 100} width="70" height="25" rx="4" fill="#0f172a" fillOpacity="0.1" />
                <rect x={i % 2 === 0 ? 80 : 0} y="5" width="90" height="4" rx="2" fill="#0f172a" fillOpacity="0.8" />
            </g>
        ))}
    </svg>
);

const ExecutiveThumb = () => (
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="200" height="120" fill="#ffffff" />
        <rect width="80" height="120" fill="#f4f4f5" />
        <rect x="10" y="90" width="50" height="6" rx="3" fill="#000000" fillOpacity="0.2" />
        <rect x="100" y="20" width="70" height="6" rx="3" fill="#18181b" />
        <line x1="110" y1="40" x2="110" y2="100" stroke="#e4e4e7" strokeWidth="2" />
        {[0, 1].map((i) => (
            <g key={i} transform={`translate(110, ${50 + i * 30})`}>
                <circle cx="0" cy="3" r="3" fill="#0ea5e9" />
                <rect x="10" y="0" width="40" height="4" rx="2" fill="#3f3f46" />
                <rect x="10" y="8" width="60" height="3" rx="1.5" fill="#a1a1aa" />
            </g>
        ))}
    </svg>
);

const TEMPLATE_THUMBNAILS_RICH: Record<string, React.ReactNode> = {
    safari_story: <SafariThumb />,
    urban_brief: <UrbanThumb />,
    professional: <ProfessionalThumb />,
    luxury_resort: <LuxuryThumb />,
    visual_journey: <VisualThumb />,
    executive_direct: <ExecutiveThumb />,
    // legacy share-modal templates:
    classic: (
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-sky-100 p-2 flex flex-col gap-1.5">
            <div className="h-2 w-full rounded bg-white/80" />
            <div className="h-3 w-3/4 rounded bg-emerald-600/40" />
            <div className="h-2 w-1/2 rounded bg-gray-300/60" />
            <div className="flex-1 rounded bg-emerald-200/60 flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-500/60" />
            </div>
            <div className="h-2.5 w-full rounded bg-white/70" />
            <div className="h-2.5 w-full rounded bg-white/70" />
        </div>
    ),
    modern: (
        <div className="w-full h-full bg-stone-900 p-2 flex flex-col gap-1.5">
            <div className="h-8 rounded bg-stone-700 flex flex-col justify-end p-1 gap-0.5">
                <div className="h-1.5 w-2/3 rounded bg-white/50" />
                <div className="h-1 w-1/2 rounded bg-white/30" />
            </div>
            <div className="flex-1 flex gap-1.5">
                <div className="flex-1 flex flex-col gap-1">
                    <div className="h-2.5 w-full rounded bg-white/10" />
                    <div className="h-2.5 w-5/6 rounded bg-white/10" />
                    <div className="h-2.5 w-full rounded bg-white/10" />
                </div>
                <div className="w-1/3 flex flex-col gap-1">
                    <div className="flex-1 rounded bg-stone-700" />
                    <div className="h-3 rounded bg-slate-800" />
                </div>
            </div>
        </div>
    ),
};

// Accent colors per template for the selection ring
const TEMPLATE_ACCENT: Record<string, string> = {
    safari_story: '#d97706',
    urban_brief: '#124ea2',
    professional: '#4f46e5',
    luxury_resort: '#ccb27a',
    visual_journey: '#e11d48',
    executive_direct: '#0ea5e9',
    classic: '#10b981',
    modern: '#78716c',
};

export default function ShareTripModal({
    isOpen,
    onClose,
    itineraryId,
    tripTitle,
    isPro = false,
    initialTemplateId,
    rawItineraryData,
}: ShareTripModalProps) {
    const [loading, setLoading] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId ?? "classic");
    const supabase = createClient();

    // Sync when parent changes the active template (user picks template then opens share)
    const [lastInitial, setLastInitial] = useState(initialTemplateId);
    if (initialTemplateId !== lastInitial) {
        setLastInitial(initialTemplateId);
        if (!shareLink) setSelectedTemplateId(initialTemplateId ?? 'classic');
    }

    const generateShareLink = async () => {
        setLoading(true);
        try {
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            let resolvedItineraryId = itineraryId;

            // Auto-save the raw itinerary if it hasn't been saved yet
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
            }

            const { error } = await supabase.from("shared_itineraries").insert({
                itinerary_id: resolvedItineraryId ?? null,
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
                                    const isSelected = selectedTemplateId === template.id;
                                    const accentColor = TEMPLATE_ACCENT[template.id] ?? '#6366f1';

                                    return (
                                        <button
                                            key={template.id}
                                            type="button"
                                            disabled={isLocked}
                                            onClick={() =>
                                                !isLocked &&
                                                setSelectedTemplateId(template.id)
                                            }
                                            className={`relative group rounded-xl border-2 text-left transition-all overflow-hidden 
                                                ${isSelected ? 'shadow-md' : 'border-gray-200 hover:border-gray-300'}
                                                ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'}`}
                                            style={isSelected ? { borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}22` } : {}}
                                        >
                                            {/* Thumbnail Preview */}
                                            <div className="h-28 w-full rounded-t-[10px] overflow-hidden">
                                                {TEMPLATE_THUMBNAILS_RICH[template.id] ?? (
                                                    <div className="w-full h-full bg-gray-100" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-3">
                                                <div className="flex items-center justify-between gap-1 mb-1">
                                                    <span className="font-semibold text-sm text-gray-800">
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
                                                <div
                                                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow"
                                                    style={{ backgroundColor: accentColor }}
                                                >
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}

                                            {/* Accent bottom bar */}
                                            {isSelected && (
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: accentColor }} />
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
