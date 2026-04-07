"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Check,
  ClipboardPaste,
  FileText,
  FolderOpen,
  Globe,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  Clock,
  TriangleAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { ItineraryResult } from "@/types/itinerary";
import {
  buildItineraryRawDataFromDraft,
  getImportedItineraryDraftErrors,
  normalizeImportedItineraryDraft,
  type ImportedItineraryDraft,
} from "@/lib/import/trip-draft";
import { formatFeatureLimitError } from "@/lib/subscriptions/feature-limit-error";
import { logError } from "@/lib/observability/logger";
import { useDemoMode } from "@/lib/demo/demo-mode-context";
import { authedFetch } from "@/lib/api/authed-fetch";

interface SavedItinerary {
  id: string;
  trip_title: string;
  destination: string | null;
  duration_days: number | null;
  summary: string | null;
  created_at: string;
  budget: string | null;
  interests: string[] | null;
  client_id: string | null;
  client: { full_name: string | null } | null;
  trip_id: string | null;
  share_code: string | null;
  share_status: string | null;
}

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

interface CreateTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ImportMode = "saved" | "ai" | "url" | "pdf" | "text";
type DraftListField = "interests" | "tips" | "inclusions" | "exclusions";

function parseListInput(value: string): string[] | undefined {
  const entries = value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  return entries.length > 0 ? Array.from(new Set(entries)) : undefined;
}

function listToText(value?: string[]): string {
  return value?.join("\n") ?? "";
}

function renumberDays(days: ImportedItineraryDraft["days"]): ImportedItineraryDraft["days"] {
  return days.map((day, index) => ({
    ...day,
    day_number: index + 1,
    day: index + 1,
    title: day.title || day.theme || `Day ${index + 1}`,
    theme: day.theme || day.title || `Day ${index + 1}`,
  }));
}

function createEmptyActivity() {
  return {
    time: "TBD",
    title: "",
    description: "",
    location: "",
  };
}

function createEmptyDay(dayNumber: number) {
  return {
    day_number: dayNumber,
    day: dayNumber,
    theme: `Day ${dayNumber}`,
    title: `Day ${dayNumber}`,
    summary: "",
    activities: [createEmptyActivity()],
  };
}

function ReviewNotice({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "warning" | "error";
  items: string[];
}) {
  if (items.length === 0) return null;

  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className={`rounded-xl border p-3 ${styles}`}>
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <ul className="space-y-1 text-xs">
            {items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CreateTripModal({ open, onOpenChange, onSuccess }: CreateTripModalProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const router = useRouter();

  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prompt, setPrompt] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [importText, setImportText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("saved");
  const [draftData, setDraftData] = useState<ImportedItineraryDraft | null>(null);
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [loadingRawData, setLoadingRawData] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [tripLimit, setTripLimit] = useState<FeatureLimitSnapshot | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  const draftErrors = draftData ? getImportedItineraryDraftErrors(draftData) : [];

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    const response = await authedFetch("/api/admin/clients");

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
      })),
    );
    setLoadingClients(false);
  }, [supabase]);

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !newClientEmail.trim()) {
      toast({ title: "Name and email required", variant: "warning" });
      return;
    }

    setCreatingClient(true);
    try {
      const response = await authedFetch("/api/admin/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: newClientName.trim(),
          email: newClientEmail.trim(),
          phone: newClientPhone.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create client");
      }

      const data = await response.json();
      const newClient: Client = {
        id: data.client?.id || data.id,
        full_name: newClientName.trim(),
        email: newClientEmail.trim(),
      };

      setClients((prev) => [newClient, ...prev]);
      setClientId(newClient.id);
      setShowNewClient(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      toast({
        title: "Client created!",
        description: `${newClient.full_name} added and selected.`,
        variant: "success",
      });
    } catch (error) {
      logError("Inline client creation failed", error);
      toast({
        title: "Failed to create client",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setCreatingClient(false);
    }
  };

  const fetchSavedItineraries = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const response = await authedFetch("/api/itineraries");

      if (!response.ok) {
        console.error("Error fetching saved itineraries");
        return;
      }

      const payload = await response.json();
      setSavedItineraries(payload.itineraries || []);
    } catch (error) {
      console.error("Error fetching saved itineraries:", error);
    } finally {
      setLoadingSaved(false);
    }
  }, [supabase]);

  const loadTripLimit = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!open) return;

    void fetchClients();
    void fetchSavedItineraries();
    void loadTripLimit();

    setClientId("");
    setStartDate("");
    setEndDate("");
    setPrompt("");
    setImportUrl("");
    setImportText("");
    setPdfFile(null);
    setDraftData(null);
    setCreating(false);
    setImportMode("saved");
    setSelectedSavedId(null);
    setShowNewClient(false);
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
  }, [open, fetchClients, fetchSavedItineraries, loadTripLimit]);

  const updateDraft = useCallback((updater: (current: ImportedItineraryDraft) => ImportedItineraryDraft) => {
    setDraftData((current) => {
      if (!current) return current;
      const next = updater(current);
      return {
        ...next,
        days: renumberDays(next.days),
      };
    });
  }, []);

  const handleSelectSavedItinerary = useCallback(async (itinerary: SavedItinerary) => {
    setSelectedSavedId(itinerary.id);
    setLoadingRawData(true);
    try {
      const { data, error } = await supabase
        .from("itineraries")
        .select("trip_title, destination, summary, duration_days, raw_data")
        .eq("id", itinerary.id)
        .single();

      if (error || !data) {
        toast({
          title: "Failed to load itinerary",
          description: "Could not fetch itinerary data. Please try again.",
          variant: "error",
        });
        setSelectedSavedId(null);
        return;
      }

      setDraftData(
        normalizeImportedItineraryDraft(data, {
          source: "saved",
        }),
      );

      if (itinerary.client_id) {
        setClientId(itinerary.client_id);
      }

      toast({
        title: "Itinerary loaded",
        description: `"${itinerary.trip_title}" is ready for review before trip creation.`,
        variant: "success",
      });
    } catch (error) {
      logError("Error loading itinerary raw data", error);
      toast({
        title: "Load failed",
        description: "Something went wrong loading the itinerary.",
        variant: "error",
      });
      setSelectedSavedId(null);
    } finally {
      setLoadingRawData(false);
    }
  }, [supabase, toast]);

  const handleGenerateAI = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const daysMatch = prompt.match(/(\d+)\s*days?/i);
      const days = daysMatch ? parseInt(daysMatch[1], 10) : 3;

      const res = await authedFetch("/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, days }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");

      setDraftData(
        normalizeImportedItineraryDraft(data as ItineraryResult, {
          source: "ai",
        }),
      );
    } catch (error) {
      logError("AI generation error", error);
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
      const res = await authedFetch("/api/itinerary/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import from URL");

      setDraftData(data.draft);
    } catch (error) {
      logError("URL import error", error);
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
      formData.append("file", pdfFile);

      const res = await authedFetch("/api/itinerary/import/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import from PDF");

      setDraftData(
        normalizeImportedItineraryDraft(data.draft, {
          filename: pdfFile.name,
          source: "pdf",
        }),
      );
    } catch (error) {
      logError("PDF Import Error", error);
      toast({
        title: "PDF import failed",
        description: error instanceof Error ? error.message : "Failed to parse PDF.",
        variant: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const parseImportText = async (): Promise<ImportedItineraryDraft> => {
    const res = await authedFetch("/api/itinerary/import/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: importText }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to parse text");
    return data.draft;
  };

  const handleImportText = async () => {
    if (!importText) return;
    setIsGenerating(true);
    try {
      const itinerary = await parseImportText();
      setDraftData(itinerary);
    } catch (error) {
      logError("Text import error", error);
      toast({
        title: "Text import failed",
        description: error instanceof Error ? error.message : "Failed to parse the pasted text.",
        variant: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTrip = async () => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode Active",
        description: "Toggle off Demo Mode to create real trips.",
        variant: "warning",
      });
      return;
    }

    if (!clientId || !startDate || !endDate) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (Client and Dates).",
        variant: "warning",
      });
      return;
    }

    if (!draftData) {
      toast({
        title: "Extract and review first",
        description: "Import a draft itinerary and review it before creating the trip.",
        variant: "warning",
      });
      return;
    }

    if (draftErrors.length > 0) {
      toast({
        title: "Review required",
        description: draftErrors[0],
        variant: "warning",
      });
      return;
    }

    setCreating(true);
    try {
      const resolvedDraft = draftData;

      const itineraryPayload = {
        trip_title: resolvedDraft.trip_title,
        destination: resolvedDraft.destination,
        summary: resolvedDraft.summary,
        duration_days: resolvedDraft.duration_days || resolvedDraft.days.length || 1,
        raw_data: buildItineraryRawDataFromDraft(resolvedDraft),
      };

      const response = await authedFetch("/api/admin/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          startDate,
          endDate,
          itinerary: itineraryPayload,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        if (payload?.code === "FEATURE_LIMIT_EXCEEDED") {
          setTripLimit((prev) => ({
            allowed: false,
            used: Number(payload?.used || prev?.used || 0),
            limit: payload?.limit === null ? null : Number(payload?.limit || prev?.limit || 0),
            remaining: payload?.remaining === null ? null : Number(payload?.remaining || prev?.remaining || 0),
            tier: String(payload?.tier || prev?.tier || "free"),
          }));
        }
        throw new Error(
          formatFeatureLimitError(
            payload,
            payload.error || "Failed to create trip",
          ),
        );
      }

      const payloadData = await response.json();
      const tripId = payloadData.tripId;

      let shareLinkCopied = false;
      try {
        const shareLinkResponse = await authedFetch(`/api/admin/trips/${tripId}/share-link`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ templateId: "safari_story" }),
        });

        if (!shareLinkResponse.ok) throw new Error("Share link creation failed");

        const shareLinkData = await shareLinkResponse.json();
        const shareUrl = shareLinkData?.data?.shareUrl;
        if (shareUrl) {
          await navigator.clipboard.writeText(shareUrl);
          shareLinkCopied = true;
        }
      } catch {
        // best-effort
      }

      onOpenChange(false);
      onSuccess();

      if (tripId) {
        router.push(`/trips/${tripId}`);
        return;
      }

      setTimeout(() => {
        if (shareLinkCopied) {
          toast({
            title: "Trip Created & Link Copied",
            description: "Share this magic quote with your client to close the deal.",
            durationMs: 4000,
            variant: "success",
          });
        } else {
          toast({
            title: "Trip created",
            description: "Trip was created successfully.",
            variant: "success",
          });
        }
      }, 100);
    } catch (error) {
      logError("Error creating trip", error);
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
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-serif">
            {draftData ? "Review & Confirm Trip" : "Create New Trip"}
            {draftData && <Sparkles className="h-5 w-5 text-purple-500" />}
          </DialogTitle>
          <DialogDescription>
            Import from a saved plan, AI prompt, web page, or brochure PDF and review the itinerary before creating the trip.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {visibleTripLimit && (
            <div
              className={`rounded-lg border p-3 ${
                visibleTripLimit.allowed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-sm font-medium ${visibleTripLimit.allowed ? "text-emerald-900" : "text-amber-900"}`}>
                    Trips this month: {visibleTripLimit.used}/{visibleTripLimit.limit}
                  </p>
                  <p className={`mt-1 text-xs ${visibleTripLimit.allowed ? "text-emerald-700" : "text-amber-700"}`}>
                    {visibleTripLimit.allowed
                      ? `${visibleTripLimit.remaining ?? 0} trips remaining on your ${visibleTripLimit.tier} plan.`
                      : "Trip limit reached. Upgrade in Billing to create more trips this month."}
                  </p>
                </div>
                <Link
                  href="/admin/billing"
                  className={`text-xs font-medium hover:underline ${visibleTripLimit.allowed ? "text-emerald-800" : "text-amber-800"}`}
                >
                  Open Billing
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" /> Client
              </label>
              <div className="flex min-w-0 gap-2">
                <select
                  className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="" disabled>
                    Select a client
                  </option>
                  {loadingClients ? (
                    <option disabled>Loading...</option>
                  ) : (
                    clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.full_name} ({client.email})
                      </option>
                    ))
                  )}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setShowNewClient((value) => !value)}
                  title="Add new client"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              {showNewClient && (
                <div className="mt-2 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Quick Add Client</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Full name *"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="h-9 bg-white text-sm dark:bg-slate-900"
                    />
                    <Input
                      placeholder="Email *"
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="h-9 bg-white text-sm dark:bg-slate-900"
                    />
                  </div>
                  <Input
                    placeholder="Phone (optional)"
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="h-9 bg-white text-sm dark:bg-slate-900"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewClient(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={creatingClient || !newClientName.trim() || !newClientEmail.trim()}
                      onClick={handleCreateClient}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {creatingClient ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                      Add & Select
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" /> Start Date
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" /> End Date
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {!draftData ? (
            <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-6">
              <div className="flex w-fit flex-wrap gap-2 rounded-lg border bg-white p-1">
                <button
                  onClick={() => setImportMode("saved")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    importMode === "saved" ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <FolderOpen className="h-4 w-4" /> Saved Plans
                  {savedItineraries.length > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        importMode === "saved" ? "bg-emerald-200 text-emerald-800" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {savedItineraries.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setImportMode("ai")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    importMode === "ai" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <Sparkles className="h-4 w-4" /> AI Describe
                </button>
                <button
                  onClick={() => setImportMode("url")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    importMode === "url" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <LinkIcon className="h-4 w-4" /> From Website URL
                </button>
                <button
                  onClick={() => setImportMode("pdf")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    importMode === "pdf" ? "bg-rose-100 text-rose-700" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <FileText className="h-4 w-4" /> From PDF Upload
                </button>
                <button
                  onClick={() => setImportMode("text")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    importMode === "text" ? "bg-amber-100 text-amber-700" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <ClipboardPaste className="h-4 w-4" /> Copy Text
                </button>
              </div>

              {importMode === "saved" && (
                <div className="space-y-3 pt-2">
                  {loadingSaved ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading saved plans...</span>
                    </div>
                  ) : savedItineraries.length === 0 ? (
                    <div className="space-y-2 py-8 text-center">
                      <FolderOpen className="mx-auto h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-600">No saved plans yet</p>
                      <p className="text-xs text-gray-400">Create itineraries in the Planner page and they will appear here.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500">
                        Select a saved itinerary from the Planner to review and use as the trip blueprint.
                      </p>
                      <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                        {savedItineraries.map((itinerary) => (
                          <button
                            key={itinerary.id}
                            type="button"
                            disabled={loadingRawData}
                            onClick={() => handleSelectSavedItinerary(itinerary)}
                            className={`w-full rounded-xl border p-3 text-left transition hover:shadow-sm ${
                              selectedSavedId === itinerary.id
                                ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            } ${loadingRawData && selectedSavedId === itinerary.id ? "opacity-70" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">{itinerary.trip_title}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  {itinerary.destination && (
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-3 w-3" />
                                      {itinerary.destination}
                                    </span>
                                  )}
                                  {itinerary.duration_days && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {itinerary.duration_days} days
                                    </span>
                                  )}
                                  {itinerary.client?.full_name && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {itinerary.client.full_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                {loadingRawData && selectedSavedId === itinerary.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                ) : selectedSavedId === itinerary.id ? (
                                  <Check className="h-4 w-4 text-emerald-600" />
                                ) : null}
                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  {new Date(itinerary.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {itinerary.summary && <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">{itinerary.summary}</p>}
                            {itinerary.interests && itinerary.interests.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {itinerary.interests.slice(0, 4).map((interest) => (
                                  <span
                                    key={interest}
                                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {importMode === "ai" && (
                <div className="space-y-4 pt-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. 7 days in Kyoto for a foodie couple..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="bg-white"
                      onKeyDown={(e) => e.key === "Enter" && handleGenerateAI()}
                    />
                    <Button
                      onClick={handleGenerateAI}
                      disabled={isGenerating || !prompt}
                      className="shrink-0 bg-purple-600 text-white hover:bg-purple-700"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Describe the trip. The AI will create a draft itinerary that you can review and edit before saving.
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
                      onKeyDown={(e) => e.key === "Enter" && handleImportUrl()}
                    />
                    <Button
                      onClick={handleImportUrl}
                      disabled={isGenerating || !importUrl}
                      className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extract from Web"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Paste a tour page URL. The extracted itinerary will open in review mode before trip creation.
                  </p>
                </div>
              )}

              {importMode === "pdf" && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="bg-white file:mr-4 file:rounded-full file:border-0 file:bg-rose-50 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-rose-700 hover:file:bg-rose-100"
                    />
                    <Button
                      onClick={handleImportPdf}
                      disabled={isGenerating || !pdfFile}
                      className="shrink-0 bg-rose-600 text-white hover:bg-rose-700"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extract PDF"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload a brochure PDF. The system will extract a draft itinerary for review, including package details when available.
                  </p>
                </div>
              )}

              {importMode === "text" && (
                <div className="space-y-4 pt-2">
                  <Textarea
                    placeholder="Paste your itinerary text here — day-by-day plan, tour description, WhatsApp notes, anything..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={8}
                    className="resize-none bg-white text-sm"
                  />
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                      Paste any raw itinerary text. The AI will structure it into a reviewable day-by-day trip draft.
                    </p>
                    <Button
                      onClick={handleImportText}
                      disabled={isGenerating || importText.trim().length < 50}
                      className="shrink-0 bg-amber-600 text-white hover:bg-amber-700"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Parse Text"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{draftData.trip_title}</h3>
                    <Badge variant="secondary">{draftData.days.length} Days</Badge>
                    {draftData.source_meta?.source && (
                      <Badge variant="outline" className="uppercase">
                        {draftData.source_meta.source}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    {draftData.destination}
                    {draftData.source_meta?.filename && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {draftData.source_meta.filename}
                      </span>
                    )}
                    {draftData.source_meta?.url && (
                      <span className="max-w-full truncate rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {draftData.source_meta.url}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDraftData(null)} className="text-gray-500 hover:text-red-500">
                  Start Over
                </Button>
              </div>

              <ReviewNotice title="Review warnings" tone="warning" items={draftData.warnings} />
              <ReviewNotice title="Fix before creating the trip" tone="error" items={draftErrors} />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trip Title</label>
                  <Input
                    value={draftData.trip_title}
                    onChange={(e) =>
                      updateDraft((current) => ({
                        ...current,
                        trip_title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination</label>
                  <Input
                    value={draftData.destination}
                    onChange={(e) =>
                      updateDraft((current) => ({
                        ...current,
                        destination: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (Days)</label>
                  <Input
                    type="number"
                    min="1"
                    value={draftData.duration_days}
                    onChange={(e) =>
                      updateDraft((current) => ({
                        ...current,
                        duration_days: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget</label>
                  <Input
                    value={draftData.budget ?? ""}
                    onChange={(e) =>
                      updateDraft((current) => ({
                        ...current,
                        budget: e.target.value.trim() || undefined,
                      }))
                    }
                    placeholder="Budget / Moderate / Luxury"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Summary</label>
                <Textarea
                  rows={3}
                  value={draftData.summary}
                  onChange={(e) =>
                    updateDraft((current) => ({
                      ...current,
                      summary: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Package Pricing</h4>
                  {draftData.pricing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateDraft((current) => ({
                          ...current,
                          pricing: undefined,
                        }))
                      }
                    >
                      Clear
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateDraft((current) => ({
                          ...current,
                          pricing: {},
                        }))
                      }
                    >
                      Add pricing
                    </Button>
                  )}
                </div>

                {draftData.pricing && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      type="number"
                      placeholder="Per person cost"
                      value={draftData.pricing.per_person_cost ?? ""}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            per_person_cost: e.target.value ? Number(e.target.value) : undefined,
                          },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Total package cost"
                      value={draftData.pricing.total_cost ?? ""}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            total_cost: e.target.value ? Number(e.target.value) : undefined,
                          },
                        }))
                      }
                    />
                    <Input
                      placeholder="Currency"
                      value={draftData.pricing.currency ?? ""}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            currency: e.target.value.trim() || undefined,
                          },
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Passenger count"
                      value={draftData.pricing.pax_count ?? ""}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          pricing: {
                            ...current.pricing,
                            pax_count: e.target.value ? Number(e.target.value) : undefined,
                          },
                        }))
                      }
                    />
                    <div className="md:col-span-2">
                      <Textarea
                        rows={2}
                        placeholder="Pricing notes"
                        value={draftData.pricing.notes ?? ""}
                        onChange={(e) =>
                          updateDraft((current) => ({
                            ...current,
                            pricing: {
                              ...current.pricing,
                              notes: e.target.value.trim() || undefined,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(["interests", "tips", "inclusions", "exclusions"] as DraftListField[]).map((field) => (
                  <div key={field} className="space-y-2 rounded-xl border bg-white p-4">
                    <label className="text-sm font-medium capitalize">{field.replace("_", " ")}</label>
                    <Textarea
                      rows={4}
                      placeholder="One item per line"
                      value={listToText(draftData[field])}
                      onChange={(e) =>
                        updateDraft((current) => ({
                          ...current,
                          [field]: parseListInput(e.target.value),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">Itinerary Days</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateDraft((current) => ({
                        ...current,
                        days: [...current.days, createEmptyDay(current.days.length + 1)],
                      }))
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add day
                  </Button>
                </div>

                <div className="space-y-4">
                  {draftData.days.map((day, dayIndex) => (
                    <div key={`${day.day_number}-${dayIndex}`} className="rounded-xl border bg-white p-4">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <Badge variant="secondary">Day {dayIndex + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateDraft((current) => ({
                              ...current,
                              days: current.days.filter((_, index) => index !== dayIndex),
                            }))
                          }
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove day
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          value={day.title ?? ""}
                          placeholder="Day title"
                          onChange={(e) =>
                            updateDraft((current) => ({
                              ...current,
                              days: current.days.map((entry, index) =>
                                index === dayIndex
                                  ? {
                                      ...entry,
                                      title: e.target.value,
                                      theme: e.target.value || entry.theme,
                                    }
                                  : entry,
                              ),
                            }))
                          }
                        />
                        <Input
                          value={day.theme}
                          placeholder="Day theme"
                          onChange={(e) =>
                            updateDraft((current) => ({
                              ...current,
                              days: current.days.map((entry, index) =>
                                index === dayIndex
                                  ? {
                                      ...entry,
                                      theme: e.target.value,
                                    }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </div>

                      <div className="mt-3">
                        <Textarea
                          rows={2}
                          placeholder="Day summary"
                          value={day.summary ?? ""}
                          onChange={(e) =>
                            updateDraft((current) => ({
                              ...current,
                              days: current.days.map((entry, index) =>
                                index === dayIndex
                                  ? {
                                      ...entry,
                                      summary: e.target.value,
                                    }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">Activities</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateDraft((current) => ({
                                ...current,
                                days: current.days.map((entry, index) =>
                                  index === dayIndex
                                    ? {
                                        ...entry,
                                        activities: [...entry.activities, createEmptyActivity()],
                                      }
                                    : entry,
                                ),
                              }))
                            }
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Add activity
                          </Button>
                        </div>

                        {day.activities.map((activity, activityIndex) => (
                          <div key={`${dayIndex}-${activityIndex}`} className="rounded-lg border bg-gray-50 p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Activity {activityIndex + 1}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateDraft((current) => ({
                                    ...current,
                                    days: current.days.map((entry, index) =>
                                      index === dayIndex
                                        ? {
                                            ...entry,
                                            activities: entry.activities.filter((_, idx) => idx !== activityIndex),
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                                className="text-gray-500 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                value={activity.title}
                                placeholder="Activity title"
                                onChange={(e) =>
                                  updateDraft((current) => ({
                                    ...current,
                                    days: current.days.map((entry, index) =>
                                      index === dayIndex
                                        ? {
                                            ...entry,
                                            activities: entry.activities.map((item, idx) =>
                                              idx === activityIndex
                                                ? {
                                                    ...item,
                                                    title: e.target.value,
                                                  }
                                                : item,
                                            ),
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                              />
                              <Input
                                value={activity.time}
                                placeholder="Time"
                                onChange={(e) =>
                                  updateDraft((current) => ({
                                    ...current,
                                    days: current.days.map((entry, index) =>
                                      index === dayIndex
                                        ? {
                                            ...entry,
                                            activities: entry.activities.map((item, idx) =>
                                              idx === activityIndex
                                                ? {
                                                    ...item,
                                                    time: e.target.value,
                                                  }
                                                : item,
                                            ),
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                              />
                              <Input
                                value={activity.location}
                                placeholder="Location"
                                onChange={(e) =>
                                  updateDraft((current) => ({
                                    ...current,
                                    days: current.days.map((entry, index) =>
                                      index === dayIndex
                                        ? {
                                            ...entry,
                                            activities: entry.activities.map((item, idx) =>
                                              idx === activityIndex
                                                ? {
                                                    ...item,
                                                    location: e.target.value,
                                                  }
                                                : item,
                                            ),
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                              />
                              <Input
                                value={activity.cost ?? ""}
                                placeholder="Cost / Included / Self-pay"
                                onChange={(e) =>
                                  updateDraft((current) => ({
                                    ...current,
                                    days: current.days.map((entry, index) =>
                                      index === dayIndex
                                        ? {
                                            ...entry,
                                            activities: entry.activities.map((item, idx) =>
                                              idx === activityIndex
                                                ? {
                                                    ...item,
                                                    cost: e.target.value || undefined,
                                                  }
                                                : item,
                                            ),
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                              />
                              <div className="md:col-span-2">
                                <Textarea
                                  rows={2}
                                  placeholder="Activity description"
                                  value={activity.description}
                                  onChange={(e) =>
                                    updateDraft((current) => ({
                                      ...current,
                                      days: current.days.map((entry, index) =>
                                        index === dayIndex
                                          ? {
                                              ...entry,
                                              activities: entry.activities.map((item, idx) =>
                                                idx === activityIndex
                                                  ? {
                                                      ...item,
                                                      description: e.target.value,
                                                    }
                                                  : item,
                                              ),
                                            }
                                          : entry,
                                      ),
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTrip}
            disabled={creating || !clientId || !startDate || !endDate || !draftData || draftErrors.length > 0}
            className="bg-primary hover:bg-primary/90"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
