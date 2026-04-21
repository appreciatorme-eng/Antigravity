"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  PencilLine,
  FileDown,
  Loader2,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
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

type ActionType = "regenerate_itinerary" | "resend_operator" | "resend_client";
type FilterKey = "all" | "attention" | "processing" | "completed";
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

function matchesFilter(item: OperatorTripRequestListItem, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "completed") return item.stage === "completed";
  if (filter === "processing") return item.stage === "processing" || item.stage === "submitted";
  return item.stage === "draft" || item.stage === "submitted";
}

function stageClasses(stage: OperatorTripRequestListItem["stage"]): string {
  switch (stage) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20";
    case "processing":
      return "bg-sky-500/15 text-sky-300 border-sky-400/20";
    case "submitted":
      return "bg-amber-500/15 text-amber-300 border-amber-400/20";
    case "cancelled":
      return "bg-slate-500/15 text-slate-300 border-slate-400/20";
    default:
      return "bg-violet-500/15 text-violet-300 border-violet-400/20";
  }
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
  const [searchQuery, setSearchQuery] = useState("");
  const [runningAction, setRunningAction] = useState<Record<string, ActionType | undefined>>({});
  const [editingRequest, setEditingRequest] = useState<OperatorTripRequestListItem | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OperatorTripRequestListItem | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);

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
      return requests
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
        });
    },
    [filter, requests, searchQuery],
  );

  const summary = useMemo(() => {
    const completed = requests.filter((item) => item.stage === "completed").length;
    const processing = requests.filter((item) => item.stage === "processing" || item.stage === "submitted").length;
    const attention = requests.filter((item) => item.stage === "draft" || item.stage === "submitted").length;
    return { completed, processing, attention };
  }, [requests]);

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
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
              return (
                <article
                  key={item.id}
                  className="rounded-[26px] border border-border bg-background p-4 shadow-sm transition hover:border-foreground/15 md:p-5"
                >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
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
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-2">
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
