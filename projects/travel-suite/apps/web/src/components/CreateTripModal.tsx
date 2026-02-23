"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, MapPin, Calendar, User, Link as LinkIcon, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Activity, Day, ItineraryResult } from "@/types/itinerary";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface Client {
    id: string;
    full_name: string;
    email: string;
}

interface FeatureLimitSnapshot {
    allowed: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
    tier: string;
}

function formatFeatureLimitError(payload: any, fallback: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (payload?.code !== "FEATURE_LIMIT_EXCEEDED") {
        return fallback;
    }

    const limit = Number(payload?.limit || 0);
    const used = Number(payload?.used || 0);
    const feature = String(payload?.feature || "usage");
    if (limit > 0) {
        return `Limit reached for ${feature}: ${used}/${limit}. Upgrade in Billing to continue.`;
    }
    return payload?.error || fallback;
}

interface CreateTripModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function CreateTripModal({ open, onOpenChange, onSuccess }: CreateTripModalProps) {
    const supabase = createClient();
    const { toast } = useToast();

    // Form State
    const [clientId, setClientId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedData, setGeneratedData] = useState<ItineraryResult | null>(null);
    const [importMode, setImportMode] = useState<"ai" | "url" | "pdf">("ai");
    const [importUrl, setImportUrl] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    // Clients Data
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [creating, setCreating] = useState(false);
    const [tripLimit, setTripLimit] = useState<FeatureLimitSnapshot | null>(null);

    const fetchClients = useCallback(async () => {
        setLoadingClients(true);

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch("/api/admin/clients", {
            headers: {
                "Authorization": `Bearer ${session?.access_token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Error fetching clients:", error);
            setLoadingClients(false);
            return;
        }

        const payload = await response.json();
        setClients(
            (payload.clients || []).map((client: Client) => ({
                id: client.id,
                full_name: client.full_name || "Unknown",
                email: client.email || "No Email",
            }))
        );
        setLoadingClients(false);
    }, [supabase]);

    useEffect(() => {
        if (open) {
            void fetchClients();
            void loadTripLimit();
            // Reset state on open
            setClientId("");
            setStartDate("");
            setEndDate("");
            setPrompt("");
            setImportUrl("");
            setPdfFile(null);
            setGeneratedData(null);
            setCreating(false);
            setImportMode("ai");
        }
    }, [open, fetchClients]);

    const loadTripLimit = async () => {
        try {
            const response = await fetch("/api/subscriptions/limits", {
                cache: "no-store",
            });
            if (!response.ok) return;
            const payload = await response.json();
            const limit = payload?.limits?.trips;
            if (!limit) return;
            setTripLimit({
                allowed: Boolean(limit.allowed),
                used: Number(limit.used || 0),
                limit: limit.limit === null ? null : Number(limit.limit || 0),
                remaining: limit.remaining === null ? null : Number(limit.remaining || 0),
                tier: String(limit.tier || "free"),
            });
        } catch {
            // best-effort only
        }
    };

    const handleGenerateAI = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            // Estimate days from prompt or default to 3 if not specified
            // For now, we'll ask the AI to infer or just pass a default
            const daysMatch = prompt.match(/(\d+)\s*days?/i);
            const days = daysMatch ? parseInt(daysMatch[1]) : 3;

            const res = await fetch("/api/itinerary/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, days }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate");

            setGeneratedData(data as ItineraryResult);

            // Auto-fill dates if possible (fallback for cases where AI returns relative days)
            // But we can set duration at least in the summary

        } catch (error) {
            console.error("AI Generation Error:", error);
            toast({
                title: "Generation failed",
                description: error instanceof Error ? `Failed to generate: ${error.message}` : "Failed to generate itinerary. Please try again.",
                variant: "error",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImportUrl = async () => {
        if (!importUrl) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/itinerary/import/url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: importUrl }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to import from URL");

            setGeneratedData(data.itinerary as ItineraryResult);
        } catch (error) {
            console.error("URL Import Error:", error);
            toast({
                title: "URL import failed",
                description: error instanceof Error ? error.message : "Failed to import from URL.",
                variant: "error",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImportPdf = async () => {
        if (!pdfFile) return;
        setIsGenerating(true);
        try {
            const formData = new FormData();
            formData.append('file', pdfFile);

            const res = await fetch("/api/itinerary/import/pdf", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to import from PDF");

            setGeneratedData(data.itinerary as ItineraryResult);
        } catch (error) {
            console.error("PDF Import Error:", error);
            toast({
                title: "PDF import failed",
                description: error instanceof Error ? error.message : "Failed to parse PDF.",
                variant: "error",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateTrip = async () => {
        if (!clientId || !startDate || !endDate) {
            toast({
                title: "Missing required fields",
                description: "Please fill in all required fields (Client and Dates).",
                variant: "warning",
            });
            return;
        }

        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/admin/trips", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    clientId,
                    startDate,
                    endDate,
                    itinerary: {
                        trip_title: generatedData?.trip_title || "New Trip",
                        destination: generatedData?.destination || "TBD",
                        summary: generatedData?.summary || "",
                        duration_days: generatedData?.days?.length || 1,
                        raw_data: { days: generatedData?.days || [] },
                    },
                }),
            });

            if (!response.ok) {
                const payload = await response.json();
                if (payload?.code === "FEATURE_LIMIT_EXCEEDED") {
                    setTripLimit((prev) => ({
                        allowed: false,
                        used: Number(payload?.used || prev?.used || 0),
                        limit: payload?.limit === null ? null : Number(payload?.limit || prev?.limit || 0),
                        remaining:
                            payload?.remaining === null
                                ? null
                                : Number(payload?.remaining || prev?.remaining || 0),
                        tier: String(payload?.tier || prev?.tier || "free"),
                    }));
                }
                throw new Error(
                    formatFeatureLimitError(
                        payload,
                        payload.error || "Failed to create trip"
                    )
                );
            }

            onSuccess();
            onOpenChange(false);
            toast({
                title: "Trip created",
                description: "Trip was created successfully.",
                variant: "success",
            });

        } catch (error) {
            console.error("Error creating trip:", error);
            toast({
                title: "Trip creation failed",
                description: error instanceof Error ? error.message : "Failed to create trip. Please try again.",
                variant: "error",
            });
        } finally {
            setCreating(false);
        }
    };

    const visibleTripLimit = tripLimit && tripLimit.limit !== null ? tripLimit : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif flex items-center gap-2">
                        {generatedData ? "Review & Confirm Trip" : "Create New Trip"}
                        {generatedData && <Sparkles className="w-5 h-5 text-purple-500" />}
                    </DialogTitle>
                    <DialogDescription>
                        Use AI to generate a complete itinerary or start from scratch.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {visibleTripLimit && (
                        <div className={`rounded-lg border p-3 ${
                            visibleTripLimit.allowed
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-amber-50 border-amber-200"
                        }`}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className={`text-sm font-medium ${
                                        visibleTripLimit.allowed ? "text-emerald-900" : "text-amber-900"
                                    }`}>
                                        Trips this month: {visibleTripLimit.used}/{visibleTripLimit.limit}
                                    </p>
                                    <p className={`text-xs mt-1 ${
                                        visibleTripLimit.allowed ? "text-emerald-700" : "text-amber-700"
                                    }`}>
                                        {visibleTripLimit.allowed
                                            ? `${visibleTripLimit.remaining ?? 0} trips remaining on your ${visibleTripLimit.tier} plan.`
                                            : "Trip limit reached. Upgrade in Billing to create more trips this month."}
                                    </p>
                                </div>
                                <Link
                                    href="/admin/billing"
                                    className={`text-xs font-medium hover:underline ${
                                        visibleTripLimit.allowed ? "text-emerald-800" : "text-amber-800"
                                    }`}
                                >
                                    Open Billing
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <User className="w-4 h-4" /> Client
                            </label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                            >
                                <option value="" disabled>Select a client</option>
                                {loadingClients ? (
                                    <option disabled>Loading...</option>
                                ) : (
                                    clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.full_name} ({client.email})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Start Date
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> End Date
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Import Mode Selector */}
                    {!generatedData ? (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 space-y-4">
                            <div className="flex gap-2 p-1 bg-white border rounded-lg w-fit">
                                <button
                                    onClick={() => setImportMode("ai")}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${importMode === "ai" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`}
                                >
                                    <Sparkles className="w-4 h-4" /> AI Describe
                                </button>
                                <button
                                    onClick={() => setImportMode("url")}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${importMode === "url" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}
                                >
                                    <LinkIcon className="w-4 h-4" /> From Website URL
                                </button>
                                <button
                                    onClick={() => setImportMode("pdf")}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${importMode === "pdf" ? "bg-rose-100 text-rose-700" : "text-gray-500 hover:bg-gray-100"}`}
                                >
                                    <FileText className="w-4 h-4" /> From PDF Upload
                                </button>
                            </div>

                            {importMode === "ai" && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="e.g. 7 days in Kyoto for a foodie couple..."
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className="bg-white"
                                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                                        />
                                        <Button
                                            onClick={handleGenerateAI}
                                            disabled={isGenerating || !prompt}
                                            className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Describe what you want; the AI will structure a complete multi-day itinerary.
                                    </p>
                                </div>
                            )}

                            {importMode === "url" && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="https://example-tour-agency.com/tours/italy-extravaganza"
                                            value={importUrl}
                                            onChange={(e) => setImportUrl(e.target.value)}
                                            className="bg-white"
                                            onKeyDown={(e) => e.key === 'Enter' && handleImportUrl()}
                                        />
                                        <Button
                                            onClick={handleImportUrl}
                                            disabled={isGenerating || !importUrl}
                                            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Extract from Web"}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Paste a link to any existing tour page. Our scraper will intelligently extract the itinerary.
                                    </p>
                                </div>
                            )}

                            {importMode === "pdf" && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                            className="bg-white file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                                        />
                                        <Button
                                            onClick={handleImportPdf}
                                            disabled={isGenerating || !pdfFile}
                                            className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import PDF"}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Upload a PDF brochure. The AI will read the text and parse it directly into your trip format.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4 border rounded-xl p-4 bg-gray-50/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{generatedData.trip_title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <MapPin className="w-4 h-4" />
                                        {generatedData.destination}
                                        <Badge variant="secondary" className="ml-2">
                                            {generatedData.days?.length || 0} Days
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setGeneratedData(null)}
                                    className="text-gray-500 hover:text-red-500"
                                >
                                    Start Over
                                </Button>
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed">
                                {generatedData.summary}
                            </p>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {generatedData.days?.map((day: Day) => (
                                    <div key={day.day_number} className="text-sm border-l-2 border-purple-200 pl-3 py-1">
                                        <span className="font-semibold text-gray-700">Day {day.day_number}: {day.theme}</span>
                                        <ul className="mt-1 space-y-1">
                                            {day.activities?.slice(0, 2).map((act: Activity, i: number) => (
                                                <li key={i} className="text-gray-500 text-xs truncate">• {act.title}</li>
                                            ))}
                                            {day.activities?.length > 2 && <li className="text-gray-400 text-xs italic">+ {day.activities.length - 2} more</li>}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateTrip}
                        disabled={creating || !!(generatedData && (!clientId || !startDate || !endDate))}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Trip...
                            </>
                        ) : (
                            "Create Trip"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
