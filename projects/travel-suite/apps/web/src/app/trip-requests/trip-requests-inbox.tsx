"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  FileDown,
  Loader2,
  RefreshCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { OperatorTripRequestListItem } from "@/lib/whatsapp/trip-intake.server";

type TripRequestsApiPayload = {
  data?: {
    requests?: OperatorTripRequestListItem[];
    organizationName?: string;
  } | null;
  error?: string | null;
};

type ActionType = "regenerate_itinerary" | "resend_operator" | "resend_client";
type FilterKey = "all" | "attention" | "processing" | "completed";

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

export function TripRequestsInbox() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<OperatorTripRequestListItem[]>([]);
  const [organizationName, setOrganizationName] = useState("Your organization");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [runningAction, setRunningAction] = useState<Record<string, ActionType | undefined>>({});

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
    () => requests.filter((item) => matchesFilter(item, filter)),
    [filter, requests],
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

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_#071119_0%,_#0b1624_100%)] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-8">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Intake operations
              </div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">Trip request control room</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Review every magic-link submission for {organizationName}, retry generation when needed, and resend the
                final itinerary package without jumping back into WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-black/20 p-3 text-center">
              <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Need action</div>
                <div className="mt-2 text-2xl font-black">{summary.attention}</div>
              </div>
              <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Processing</div>
                <div className="mt-2 text-2xl font-black">{summary.processing}</div>
              </div>
              <div className="rounded-2xl bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Completed</div>
                <div className="mt-2 text-2xl font-black">{summary.completed}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    filter === item.key
                      ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void loadRequests(false)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.09]"
              disabled={refreshing}
            >
              <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/10">
              <div className="inline-flex items-center gap-3 text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading trip requests…
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-14 text-center text-slate-300">
              <div className="mx-auto max-w-xl">
                <h2 className="text-xl font-bold text-white">No intake requests in this view</h2>
                <p className="mt-2 text-sm leading-6">
                  Use the TripBuilt Assistant group and send <span className="font-semibold text-white">link</span> to
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
                    className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02))] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)] md:p-5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", stageClasses(item.stage))}>
                              {item.stageLabel}
                            </span>
                            {item.operatorNotified ? (
                              <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
                                Operator sent
                              </span>
                            ) : null}
                            {item.clientNotified ? (
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                                Client sent
                              </span>
                            ) : null}
                          </div>

                          <div>
                            <h2 className="text-xl font-bold tracking-tight text-white">
                              {item.clientName || "Unnamed traveller"}
                              {item.destination ? ` • ${item.destination}` : ""}
                            </h2>
                            <p className="mt-1 text-sm text-slate-300">
                              {item.requestSummary || "Trip request submitted through the magic link flow."}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-white/10 bg-black/15 p-3 text-sm text-slate-300 md:min-w-[320px]">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Submitted</div>
                            <div className="mt-1 font-medium text-white">{formatDateTime(item.submittedAt)}</div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Updated</div>
                            <div className="mt-1 font-medium text-white">{formatDateTime(item.updatedAt)}</div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Travellers</div>
                            <div className="mt-1 font-medium text-white">{item.travelerCount ?? "—"}</div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Duration</div>
                            <div className="mt-1 font-medium text-white">{item.durationDays ? `${item.durationDays} days` : "—"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Traveller details</div>
                          <div className="mt-2 space-y-1 text-sm text-slate-200">
                            <div>{item.clientPhone || "No WhatsApp number yet"}</div>
                            <div className="text-slate-400">{item.clientEmail || "No email added"}</div>
                            <div className="text-slate-400">{item.travelWindow || "Travel window not finalised"}</div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Delivery</div>
                          <div className="mt-2 space-y-1 text-sm text-slate-200">
                            <div>Completed package: {formatDateTime(item.completionDeliveredAt)}</div>
                            <div className="text-slate-400">Operator resend: {formatDateTime(item.lastOperatorResentAt)}</div>
                            <div className="text-slate-400">Client resend: {formatDateTime(item.lastClientResentAt)}</div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Operator note</div>
                          <div className="mt-2 text-sm text-slate-200">
                            {item.attentionReason || "This request is healthy and ready for normal follow-through."}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void runAction(item.id, "regenerate_itinerary")}
                            disabled={Boolean(actionInFlight)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
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
                            className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:opacity-50"
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
                            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionInFlight === "resend_client" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Resend to client
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void copyValue(item.formUrl, "Form link")}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-black/30"
                          >
                            <Copy className="h-4 w-4" />
                            Copy form link
                          </button>
                          {item.createdShareUrl ? (
                            <a
                              href={item.createdShareUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-black/30"
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
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-black/30"
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
      </div>
    </div>
  );
}
