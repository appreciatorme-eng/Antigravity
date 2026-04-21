"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownUp,
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  Clock3,
  Copy,
  Eye,
  PencilLine,
  FileDown,
  RotateCw,
  Loader2,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  Square,
  Trash2,
  XCircle,
} from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { OperatorTripRequestListItem } from "@/lib/whatsapp/trip-intake.server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TripRequestsApiPayload = {
  data?: {
    requests?: OperatorTripRequestListItem[];
    organizationName?: string;
  } | null;
  error?: string | null;
};

type ActionType = "regenerate_itinerary" | "resend_operator" | "resend_client" | "retry_request";
type BulkActionType = "resend_operator" | "resend_client" | "retry_request" | "delete_request";
type FilterKey = "all" | "attention" | "processing" | "completed" | "failed" | "resend" | "missing_phone";
type SortKey = "needs_attention" | "newest" | "completed_recently" | "traveller_name";
type EditFormState = {
  destination: string;
  durationDays: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  travelerCount: string;
  startDate: string;
  endDate: string;
  budget: string;
  hotelPreference: string;
  interests: string;
  originCity: string;
};

const FILTERS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All requests" },
  { key: "attention", label: "Needs attention" },
  { key: "processing", label: "Processing" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
  { key: "resend", label: "Resend needed" },
  { key: "missing_phone", label: "Missing phone" },
];

const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "needs_attention", label: "Needs attention first" },
  { key: "newest", label: "Newest activity" },
  { key: "completed_recently", label: "Completed recently" },
  { key: "traveller_name", label: "Traveller A–Z" },
];

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function toTimestamp(value: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function matchesFilter(item: OperatorTripRequestListItem, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "completed") return item.stage === "completed";
  if (filter === "processing") return item.stage === "processing" || item.stage === "submitted";
  if (filter === "failed") {
    return Boolean(item.generationError || item.operatorDeliveryError || item.clientDeliveryError);
  }
  if (filter === "resend") {
    return item.stage === "completed" && (
      !item.operatorNotified
      || (Boolean(item.clientPhone) && !item.clientNotified)
      || Boolean(item.operatorDeliveryError)
      || Boolean(item.clientDeliveryError)
    );
  }
  if (filter === "missing_phone") {
    return !item.clientPhone;
  }
  return item.stage === "draft" || item.stage === "submitted";
}

function stageClasses(stage: OperatorTripRequestListItem["stage"]): string {
  switch (stage) {
    case "completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "processing":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "submitted":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "cancelled":
      return "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
    default:
      return "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300";
  }
}

function sortRequests(items: readonly OperatorTripRequestListItem[], sortKey: SortKey): OperatorTripRequestListItem[] {
  const ranked = [...items];
  ranked.sort((left, right) => {
    if (sortKey === "traveller_name") {
      return (left.clientName || "zzz").localeCompare(right.clientName || "zzz", undefined, { sensitivity: "base" });
    }

    if (sortKey === "completed_recently") {
      return toTimestamp(right.completionDeliveredAt) - toTimestamp(left.completionDeliveredAt)
        || toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
    }

    if (sortKey === "newest") {
      return toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
    }

    const attentionScore = (item: OperatorTripRequestListItem) => {
      if (item.stage === "draft" || item.stage === "submitted") return 0;
      if (item.stage === "processing") return 1;
      if (item.stage === "completed" && item.clientPhone && !item.clientNotified) return 2;
      if (item.stage === "completed" && !item.operatorNotified) return 3;
      return 4;
    };

    return attentionScore(left) - attentionScore(right)
      || toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
  });
  return ranked;
}

type StatusBadge = {
  label: string;
  tone: string;
};

function getDeliveryBadges(item: OperatorTripRequestListItem): readonly StatusBadge[] {
  const badges: StatusBadge[] = [];

  if (item.stage === "draft" || item.stage === "submitted") {
    badges.push({
      label: "Waiting for traveller details",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    });
  }

  if (item.stage === "processing") {
    badges.push({
      label: "Generation running",
      tone: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    });
  }

  if (item.stage === "completed" && !item.pdfUrl) {
    badges.push({
      label: "PDF unavailable",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    });
  }

  if (item.generationError) {
    badges.push({
      label: "Generation failed",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    });
  }

  if (item.operatorDeliveryError) {
    badges.push({
      label: "Operator send failed",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    });
  }

  if (item.clientDeliveryError) {
    badges.push({
      label: "Traveller send failed",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    });
  }

  if (item.stage === "completed" && !item.operatorNotified) {
    badges.push({
      label: "Operator send pending",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    });
  }

  if (item.stage === "completed" && item.clientPhone && !item.clientNotified) {
    badges.push({
      label: "Client send pending",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    });
  }

  if (item.stage === "completed" && !item.clientPhone) {
    badges.push({
      label: "No traveller phone",
      tone: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    });
  }

  if (item.lastItineraryRegeneratedAt) {
    badges.push({
      label: "Regenerated",
      tone: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    });
  }

  return badges;
}

type TimelineEvent = {
  label: string;
  value: string;
  tone: string;
};

function getTimelineEvents(item: OperatorTripRequestListItem): readonly TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (item.submittedAt) {
    events.push({
      label: "Submitted",
      value: item.submittedAt,
      tone: "bg-slate-500",
    });
  }

  if (item.lastItineraryRegeneratedAt) {
    events.push({
      label: "Regenerated",
      value: item.lastItineraryRegeneratedAt,
      tone: "bg-fuchsia-500",
    });
  }

  if (item.completionDeliveredAt) {
    events.push({
      label: "Trip ready",
      value: item.completionDeliveredAt,
      tone: "bg-emerald-500",
    });
  }

  if (item.lastOperatorResentAt) {
    events.push({
      label: "Resent to operator",
      value: item.lastOperatorResentAt,
      tone: "bg-sky-500",
    });
  }

  if (item.lastClientResentAt) {
    events.push({
      label: "Resent to traveller",
      value: item.lastClientResentAt,
      tone: "bg-amber-500",
    });
  }

  return events.sort((left, right) => toTimestamp(left.value) - toTimestamp(right.value));
}

function buildEditFormState(item: OperatorTripRequestListItem): EditFormState {
  return {
    destination: item.destination ?? "",
    durationDays: item.durationDays ? String(item.durationDays) : "",
    clientName: item.clientName ?? "",
    clientEmail: item.clientEmail ?? "",
    clientPhone: item.clientPhone ?? "",
    travelerCount: item.travelerCount ? String(item.travelerCount) : "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    budget: item.budget ?? "",
    hotelPreference: item.hotelPreference ?? "",
    interests: item.interests.join(", "),
    originCity: item.originCity ?? "",
  };
}

export function TripRequestsInbox() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<OperatorTripRequestListItem[]>([]);
  const [organizationName, setOrganizationName] = useState("Your organization");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("needs_attention");
  const [searchQuery, setSearchQuery] = useState("");
  const [runningAction, setRunningAction] = useState<Record<string, ActionType | undefined>>({});
  const [editingRequest, setEditingRequest] = useState<OperatorTripRequestListItem | null>(null);
  const [detailRequest, setDetailRequest] = useState<OperatorTripRequestListItem | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OperatorTripRequestListItem | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkActionType | null>(null);

  const loadRequests = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await authedFetch("/api/trip-requests", { cache: "no-store" });
      const payload = await response.json() as TripRequestsApiPayload;
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to load trip requests");
      }

      setRequests(payload.data?.requests ?? []);
      setOrganizationName(payload.data?.organizationName ?? "Your organization");
    } catch (error) {
      toast({
        title: "Couldn’t load intake requests",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadRequests(true);
  }, [loadRequests]);

  const filteredRequests = useMemo(
    () => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      return sortRequests(
        requests
        .filter((item) => matchesFilter(item, filter))
        .filter((item) => {
          if (!normalizedQuery) return true;
          return [
            item.clientName,
            item.destination,
            item.clientPhone,
            item.clientEmail,
            item.requestSummary,
          ]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedQuery));
        }),
        sortKey,
      );
    },
    [filter, requests, searchQuery, sortKey],
  );

  const summary = useMemo(() => {
    const completed = requests.filter((item) => item.stage === "completed").length;
    const processing = requests.filter((item) => item.stage === "processing" || item.stage === "submitted").length;
    const attention = requests.filter((item) => item.stage === "draft" || item.stage === "submitted").length;
    return { completed, processing, attention };
  }, [requests]);

  const selectedVisibleIds = useMemo(
    () => filteredRequests.map((item) => item.id).filter((id) => selectedRequestIds.includes(id)),
    [filteredRequests, selectedRequestIds],
  );

  const allVisibleSelected = filteredRequests.length > 0 && selectedVisibleIds.length === filteredRequests.length;

  function toggleSelection(id: string) {
    setSelectedRequestIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function toggleSelectAllVisible() {
    setSelectedRequestIds((current) => {
      const visibleSet = new Set(filteredRequests.map((item) => item.id));
      if (filteredRequests.length > 0 && filteredRequests.every((item) => current.includes(item.id))) {
        return current.filter((id) => !visibleSet.has(id));
      }
      const next = new Set(current);
      filteredRequests.forEach((item) => next.add(item.id));
      return [...next];
    });
  }

  async function runAction(id: string, action: ActionType) {
    setRunningAction((current) => ({ ...current, [id]: action }));
    try {
      const response = await authedFetch(`/api/trip-requests/${id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json() as { data?: { message?: string } | null; error?: string | null };
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Action failed");
      }

      toast({
        title: "Updated",
        description: payload.data?.message ?? "Action completed",
        variant: "success",
      });
      await loadRequests(false);
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setRunningAction((current) => ({ ...current, [id]: undefined }));
    }
  }

  async function runBulkAction(action: BulkActionType) {
    const ids = [...selectedVisibleIds];
    if (ids.length === 0) {
      toast({
        title: "No requests selected",
        description: "Select one or more trip requests first.",
        variant: "error",
      });
      return;
    }

    setBulkAction(action);
    let successCount = 0;
    let failureCount = 0;

    try {
      if (action === "delete_request") {
        for (const id of ids) {
          try {
            const response = await authedFetch(`/api/trip-requests/${id}`, { method: "DELETE" });
            const payload = await response.json() as { error?: string | null };
            if (!response.ok || payload.error) {
              throw new Error(payload.error || "Delete failed");
            }
            successCount += 1;
          } catch {
            failureCount += 1;
          }
        }
      } else {
        for (const id of ids) {
          try {
            const response = await authedFetch(`/api/trip-requests/${id}/actions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action }),
            });
            const payload = await response.json() as { error?: string | null };
            if (!response.ok || payload.error) {
              throw new Error(payload.error || "Action failed");
            }
            successCount += 1;
          } catch {
            failureCount += 1;
          }
        }
      }

      await loadRequests(false);
      setSelectedRequestIds((current) => current.filter((id) => !ids.includes(id)));
      toast({
        title: "Bulk action finished",
        description:
          failureCount > 0
            ? `${successCount} succeeded, ${failureCount} failed.`
            : `${successCount} request${successCount === 1 ? "" : "s"} updated.`,
        variant: failureCount > 0 ? "error" : "success",
      });
    } finally {
      setBulkAction(null);
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied`, variant: "success" });
    } catch {
      toast({ title: `Couldn’t copy ${label.toLowerCase()}`, variant: "error" });
    }
  }

  function openEditor(item: OperatorTripRequestListItem) {
    setEditingRequest(item);
    setEditForm(buildEditFormState(item));
  }

  function updateLocalRequest(next: OperatorTripRequestListItem) {
    setRequests((current) => current.map((item) => (item.id === next.id ? next : item)));
    setDetailRequest((current) => (current?.id === next.id ? next : current));
  }

  async function deleteRequest() {
    if (!deleteTarget) return;

    setDeletingRequestId(deleteTarget.id);
    try {
      const response = await authedFetch(`/api/trip-requests/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const payload = await response.json() as { data?: { message?: string } | null; error?: string | null };
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to delete request");
      }

      setRequests((current) => current.filter((item) => item.id !== deleteTarget.id));
      toast({
        title: "Trip request removed",
        description: payload.data?.message ?? "The request was removed from the inbox.",
        variant: "success",
      });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: "Couldn’t remove request",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setDeletingRequestId(null);
    }
  }

  async function saveEdit() {
    if (!editingRequest || !editForm) return;

    setSavingEdit(true);
    try {
      const response = await authedFetch(`/api/trip-requests/${editingRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: editForm.destination,
          durationDays: Number(editForm.durationDays),
          clientName: editForm.clientName,
          clientEmail: editForm.clientEmail || null,
          clientPhone: editForm.clientPhone || null,
          travelerCount: Number(editForm.travelerCount),
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          budget: editForm.budget || null,
          hotelPreference: editForm.hotelPreference || null,
          interests: editForm.interests
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          originCity: editForm.originCity || null,
        }),
      });

      const payload = await response.json() as {
        data?: { request?: OperatorTripRequestListItem | null; message?: string } | null;
        error?: string | null;
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to update request");
      }

      if (payload.data?.request) {
        updateLocalRequest(payload.data.request);
        setEditingRequest(payload.data.request);
        setEditForm(buildEditFormState(payload.data.request));
      }

      toast({
        title: "Trip request updated",
        description: payload.data?.message ?? "Saved the new trip brief.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Couldn’t save changes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-6 p-5 md:flex-row md:items-end md:justify-between md:p-8">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Intake operations
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Trip request control room</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Review every magic-link submission for {organizationName}, retry generation when needed, and resend the
                final itinerary package without jumping back into WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-border bg-muted/40 p-3 text-center">
              <div className="rounded-2xl bg-background px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Need action</div>
                <div className="mt-2 text-2xl font-black text-foreground">{summary.attention}</div>
              </div>
              <div className="rounded-2xl bg-background px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Processing</div>
                <div className="mt-2 text-2xl font-black text-foreground">{summary.processing}</div>
              </div>
              <div className="rounded-2xl bg-background px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Completed</div>
                <div className="mt-2 text-2xl font-black text-foreground">{summary.completed}</div>
              </div>
            </div>
          </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[28px] border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    filter === item.key
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1 sm:min-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search traveller, destination, phone, email"
                className="w-full rounded-2xl border border-border bg-background px-10 py-2.5 text-sm text-foreground outline-none transition focus:border-emerald-500/40"
              />
            </label>

            <label className="relative min-w-0 sm:min-w-[220px]">
              <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="w-full appearance-none rounded-2xl border border-border bg-background px-10 py-2.5 text-sm text-foreground outline-none transition focus:border-emerald-500/40"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => void loadRequests(false)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              disabled={refreshing}
            >
              <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={toggleSelectAllVisible}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground transition hover:bg-muted"
            >
              {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {allVisibleSelected ? "Clear visible" : "Select visible"}
            </button>
            <span>
              {selectedVisibleIds.length} selected in this view
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void runBulkAction("retry_request")}
              disabled={Boolean(bulkAction) || selectedVisibleIds.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-300"
            >
              {bulkAction === "retry_request" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
              Retry selected
            </button>
            <button
              type="button"
              onClick={() => void runBulkAction("resend_operator")}
              disabled={Boolean(bulkAction) || selectedVisibleIds.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
            >
              {bulkAction === "resend_operator" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Resend to operator
            </button>
            <button
              type="button"
              onClick={() => void runBulkAction("resend_client")}
              disabled={Boolean(bulkAction) || selectedVisibleIds.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300"
            >
              {bulkAction === "resend_client" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Resend to traveller
            </button>
            <button
              type="button"
              onClick={() => void runBulkAction("delete_request")}
              disabled={Boolean(bulkAction) || selectedVisibleIds.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
            >
              {bulkAction === "delete_request" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete selected
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-border bg-muted/20">
            <div className="inline-flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading trip requests…
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-border bg-muted/20 px-6 py-14 text-center text-muted-foreground">
            <div className="mx-auto max-w-xl">
              <h2 className="text-xl font-bold text-foreground">No intake requests in this view</h2>
                <p className="mt-2 text-sm leading-6">
                  Use the TripBuilt Assistant group and send <span className="font-semibold text-foreground">link</span> to
                  create a shareable intake link, or wait for a client to submit the magic-link form.
                </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((item) => {
              const actionInFlight = runningAction[item.id];
              const canResend = item.stage === "completed";
              const canRetry =
                item.stage === "processing"
                || item.stage === "submitted"
                || Boolean(item.generationError)
                || Boolean(item.operatorDeliveryError)
                || Boolean(item.clientDeliveryError);
              return (
                <article
                  key={item.id}
                  className={cn(
                    "rounded-[26px] border bg-background p-4 shadow-sm transition hover:border-foreground/15 md:p-5",
                    selectedRequestIds.includes(item.id)
                      ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
                      : "border-border",
                  )}
                >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => toggleSelection(item.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-muted"
                          >
                            {selectedRequestIds.includes(item.id) ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4" />}
                            {selectedRequestIds.includes(item.id) ? "Selected" : "Select"}
                          </button>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", stageClasses(item.stage))}>
                              {item.stageLabel}
                            </span>
                            {item.operatorNotified ? (
                              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                                Operator sent
                              </span>
                            ) : null}
                            {item.clientNotified ? (
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                Client sent
                              </span>
                            ) : null}
                            {getDeliveryBadges(item).map((badge) => (
                              <span
                                key={badge.label}
                                className={cn("rounded-full border px-3 py-1 text-xs font-semibold", badge.tone)}
                              >
                                {badge.label}
                              </span>
                            ))}
                          </div>

                          <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">
                              {item.clientName || "Unnamed traveller"}
                              {item.destination ? ` • ${item.destination}` : ""}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.requestSummary || "Trip request submitted through the magic link flow."}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground md:min-w-[320px]">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Submitted</div>
                            <div className="mt-1 font-medium text-foreground">{formatDateTime(item.submittedAt)}</div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Updated</div>
                            <div className="mt-1 font-medium text-foreground">{formatDateTime(item.updatedAt)}</div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Travellers</div>
                            <div className="mt-1 font-medium text-foreground">{item.travelerCount ?? "—"}</div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Duration</div>
                            <div className="mt-1 font-medium text-foreground">{item.durationDays ? `${item.durationDays} days` : "—"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-border bg-muted/20 p-4">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Traveller details</div>
                          <div className="mt-2 space-y-1 text-sm text-foreground">
                            <div>{item.clientPhone || "No WhatsApp number yet"}</div>
                            <div className="text-muted-foreground">{item.clientEmail || "No email added"}</div>
                            <div className="text-muted-foreground">{item.travelWindow || "Travel window not finalised"}</div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/20 p-4">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Delivery</div>
                          <div className="mt-2 space-y-1 text-sm text-foreground">
                            <div>Completed package: {formatDateTime(item.completionDeliveredAt)}</div>
                            <div className="text-muted-foreground">Operator resend: {formatDateTime(item.lastOperatorResentAt)}</div>
                            <div className="text-muted-foreground">Client resend: {formatDateTime(item.lastClientResentAt)}</div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/20 p-4">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Operator note</div>
                          <div className="mt-2 text-sm text-foreground">
                            {item.attentionReason || "This request is healthy and ready for normal follow-through."}
                          </div>
                          {item.generationError ? (
                            <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                              Generation: {item.generationError}
                            </div>
                          ) : null}
                          {item.operatorDeliveryError ? (
                            <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                              Operator delivery: {item.operatorDeliveryError}
                            </div>
                          ) : null}
                          {item.clientDeliveryError ? (
                            <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                              Traveller delivery: {item.clientDeliveryError}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          Activity timeline
                        </div>
                        {getTimelineEvents(item).length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {getTimelineEvents(item).map((event) => (
                              <div
                                key={`${event.label}-${event.value}`}
                                className="min-w-[160px] flex-1 rounded-2xl border border-border bg-background px-4 py-3"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={cn("h-2.5 w-2.5 rounded-full", event.tone)} />
                                  <span className="text-sm font-semibold text-foreground">{event.label}</span>
                                </div>
                                <div className="mt-2 text-sm text-muted-foreground">
                                  {formatDateTime(event.value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4" />
                            No activity history yet beyond the current request stage.
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailRequest(item)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                          >
                            <Eye className="h-4 w-4" />
                            View details
                          </button>
                          <a
                            href={`/trip-requests/${item.id}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            Open page
                          </a>
                          <button
                            type="button"
                            onClick={() => openEditor(item)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-500/15 dark:text-fuchsia-300"
                          >
                            <PencilLine className="h-4 w-4" />
                            Edit brief
                          </button>
                          <button
                            type="button"
                            onClick={() => void runAction(item.id, "regenerate_itinerary")}
                            disabled={Boolean(actionInFlight)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionInFlight === "regenerate_itinerary" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCcw className="h-4 w-4" />
                            )}
                            Regenerate itinerary
                          </button>
                          <button
                            type="button"
                            onClick={() => void runAction(item.id, "retry_request")}
                            disabled={Boolean(actionInFlight) || !canRetry}
                            className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-300"
                          >
                            {actionInFlight === "retry_request" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCw className="h-4 w-4" />
                            )}
                            Retry request
                          </button>
                          <button
                            type="button"
                            onClick={() => void runAction(item.id, "resend_operator")}
                            disabled={Boolean(actionInFlight) || !canResend}
                            className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-300"
                          >
                            {actionInFlight === "resend_operator" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Resend to operator
                          </button>
                          <button
                            type="button"
                            onClick={() => void runAction(item.id, "resend_client")}
                            disabled={Boolean(actionInFlight) || !canResend || !item.clientPhone}
                            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300"
                          >
                            {actionInFlight === "resend_client" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Resend to client
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-300"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete request
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void copyValue(item.formUrl, "Form link")}
                            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                          >
                            <Copy className="h-4 w-4" />
                            Copy form link
                          </button>
                          {item.createdTripId ? (
                            <a
                              href={`/trips/${item.createdTripId}`}
                              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                              Open trip
                            </a>
                          ) : null}
                          {item.createdShareUrl ? (
                            <a
                              href={item.createdShareUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                            >
                              <ArrowUpRight className="h-4 w-4" />
                              View itinerary
                            </a>
                          ) : null}
                          {item.pdfUrl ? (
                            <a
                              href={item.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                            >
                              <FileDown className="h-4 w-4" />
                              Open PDF
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={Boolean(editingRequest && editForm)} onOpenChange={(open) => {
        if (!open && !savingEdit) {
          setEditingRequest(null);
          setEditForm(null);
        }
      }}>
        {editingRequest && editForm ? (
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-3xl">
            <div className="border-b border-border bg-muted/30 p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Edit trip request brief</DialogTitle>
                <DialogDescription className="text-sm leading-6 text-muted-foreground">
                  Update the submitted answers, save them, then regenerate the itinerary to apply the new brief to the
                  final trip and PDF.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="grid gap-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Traveller name *</span>
                  <input
                    value={editForm.clientName}
                    onChange={(event) => setEditForm((current) => current ? { ...current, clientName: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">WhatsApp number</span>
                  <input
                    value={editForm.clientPhone}
                    onChange={(event) => setEditForm((current) => current ? { ...current, clientPhone: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Email</span>
                  <input
                    value={editForm.clientEmail}
                    onChange={(event) => setEditForm((current) => current ? { ...current, clientEmail: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Travellers *</span>
                  <input
                    type="number"
                    min={1}
                    value={editForm.travelerCount}
                    onChange={(event) => setEditForm((current) => current ? { ...current, travelerCount: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Destination *</span>
                  <input
                    value={editForm.destination}
                    onChange={(event) => setEditForm((current) => current ? { ...current, destination: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Duration in days *</span>
                  <input
                    type="number"
                    min={1}
                    value={editForm.durationDays}
                    onChange={(event) => setEditForm((current) => current ? { ...current, durationDays: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Departure date *</span>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(event) => setEditForm((current) => current ? { ...current, startDate: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Return date *</span>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(event) => setEditForm((current) => current ? { ...current, endDate: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Budget note</span>
                  <input
                    value={editForm.budget}
                    onChange={(event) => setEditForm((current) => current ? { ...current, budget: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Hotel preference</span>
                  <input
                    value={editForm.hotelPreference}
                    onChange={(event) => setEditForm((current) => current ? { ...current, hotelPreference: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-foreground">Origin city / airport</span>
                  <input
                    value={editForm.originCity}
                    onChange={(event) => setEditForm((current) => current ? { ...current, originCity: event.target.value } : current)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-foreground">Interests</span>
                  <textarea
                    rows={3}
                    value={editForm.interests}
                    onChange={(event) => setEditForm((current) => current ? { ...current, interests: event.target.value } : current)}
                    placeholder="beaches, food, family time, shopping"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                  />
                </label>
              </div>
            </div>

            <DialogFooter className="border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  if (!savingEdit) {
                    setEditingRequest(null);
                    setEditForm(null);
                  }
                }}
                className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingEdit}
              >
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
                Save changes
              </button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(detailRequest)} onOpenChange={(open) => {
        if (!open) {
          setDetailRequest(null);
        }
      }}>
        {detailRequest ? (
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border border-border bg-background text-foreground shadow-2xl sm:max-w-4xl">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-black tracking-tight">
                {detailRequest.clientName || "Unnamed traveller"}
                {detailRequest.destination ? ` • ${detailRequest.destination}` : ""}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                Full intake brief, linked records, delivery history, and retry context for this request.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6">
              <div className="flex flex-wrap gap-2">
                <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", stageClasses(detailRequest.stage))}>
                  {detailRequest.stageLabel}
                </span>
                {getDeliveryBadges(detailRequest).map((badge) => (
                  <span
                    key={badge.label}
                    className={cn("rounded-full border px-3 py-1 text-xs font-semibold", badge.tone)}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Submitted</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{formatDateTime(detailRequest.submittedAt)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Updated</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{formatDateTime(detailRequest.updatedAt)}</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Source</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{detailRequest.sourceChannel}</div>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Submitter role</div>
                  <div className="mt-2 text-sm font-semibold capitalize text-foreground">{detailRequest.submitterRole || "—"}</div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-border bg-muted/20 p-5">
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">Traveller brief</h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Traveller name</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.clientName || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">WhatsApp</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.clientPhone || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.clientEmail || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Travellers</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.travelerCount ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Destination</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.destination || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Duration</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.durationDays ? `${detailRequest.durationDays} days` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Dates</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {detailRequest.startDate && detailRequest.endDate
                          ? `${detailRequest.startDate} to ${detailRequest.endDate}`
                          : detailRequest.travelWindow || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Origin</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.originCity || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Budget</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.budget || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Hotel preference</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.hotelPreference || "—"}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Interests</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {detailRequest.interests.length > 0 ? detailRequest.interests.join(", ") : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-border bg-muted/20 p-5">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">Linked records</h3>
                    <dl className="mt-4 grid gap-4">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Trip id</dt>
                        <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.createdTripId || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Itinerary id</dt>
                        <dd className="mt-1 text-sm font-medium text-foreground">{detailRequest.createdItineraryId || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Form token</dt>
                        <dd className="mt-1 break-all text-sm font-medium text-foreground">{detailRequest.formToken}</dd>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => void copyValue(detailRequest.formUrl, "Form link")}
                          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                        >
                          <Copy className="h-4 w-4" />
                          Copy form link
                        </button>
                        {detailRequest.createdTripId ? (
                          <a
                            href={`/trips/${detailRequest.createdTripId}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            Open trip
                          </a>
                        ) : null}
                        {detailRequest.createdShareUrl ? (
                          <a
                            href={detailRequest.createdShareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            View itinerary
                          </a>
                        ) : null}
                        {detailRequest.pdfUrl ? (
                          <a
                            href={detailRequest.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                          >
                            <FileDown className="h-4 w-4" />
                            Open PDF
                          </a>
                        ) : null}
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-3xl border border-border bg-muted/20 p-5">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">Delivery log</h3>
                    <div className="mt-4 space-y-3 text-sm text-foreground">
                      <div>Completed package: {formatDateTime(detailRequest.completionDeliveredAt)}</div>
                      <div>Operator resend: {formatDateTime(detailRequest.lastOperatorResentAt)}</div>
                      <div>Traveller resend: {formatDateTime(detailRequest.lastClientResentAt)}</div>
                      <div>Last regenerated: {formatDateTime(detailRequest.lastItineraryRegeneratedAt)}</div>
                      {detailRequest.generationError ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-rose-700 dark:text-rose-300">
                          Generation error: {detailRequest.generationError}
                        </div>
                      ) : null}
                      {detailRequest.operatorDeliveryError ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-rose-700 dark:text-rose-300">
                          Operator delivery error: {detailRequest.operatorDeliveryError}
                        </div>
                      ) : null}
                      {detailRequest.clientDeliveryError ? (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-rose-700 dark:text-rose-300">
                          Traveller delivery error: {detailRequest.clientDeliveryError}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-muted/20 p-5">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  Activity timeline
                </div>
                {getTimelineEvents(detailRequest).length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {getTimelineEvents(detailRequest).map((event) => (
                      <div
                        key={`${event.label}-${event.value}`}
                        className="rounded-2xl border border-border bg-background px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full", event.tone)} />
                          <span className="text-sm font-semibold text-foreground">{event.label}</span>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">{formatDateTime(event.value)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    No retry or resend history yet for this request.
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <a
                href={`/trip-requests/${detailRequest.id}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <ArrowUpRight className="h-4 w-4" />
                Open full page
              </a>
              <button
                type="button"
                onClick={() => setDetailRequest(null)}
                className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => {
        if (!open && !deletingRequestId) {
          setDeleteTarget(null);
        }
      }}>
        {deleteTarget ? (
          <DialogContent className="border border-border bg-background text-foreground sm:max-w-lg">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                <XCircle className="h-5 w-5 text-rose-500" />
                Delete trip request
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                Remove <span className="font-semibold text-foreground">{deleteTarget.clientName || "this request"}</span> from the intake inbox.
                {deleteTarget.createdTripId
                  ? " The linked trip stays available in Trips."
                  : " This only removes the request record from the operator queue."}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
                disabled={Boolean(deletingRequestId)}
              >
                Keep request
              </button>
              <button
                type="button"
                onClick={() => void deleteRequest()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletingRequestId === deleteTarget.id}
              >
                {deletingRequestId === deleteTarget.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete request
              </button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
