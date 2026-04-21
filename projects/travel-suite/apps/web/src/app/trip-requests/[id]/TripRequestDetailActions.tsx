"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Loader2,
  PencilLine,
  RotateCw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { authedFetch } from "@/lib/api/authed-fetch";
import { useToast } from "@/components/ui/toast";
import type {
  OperatorTripRequestActionHistoryEntry,
  OperatorTripRequestListItem,
} from "@/lib/whatsapp/trip-intake.server";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ActionType = "regenerate_itinerary" | "resend_operator" | "resend_client" | "retry_request";

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

type StatusChip = {
  label: string;
  tone: string;
  actionLabel?: string;
  action?: ActionType | "edit";
};

type InlineFeedback = {
  title: string;
  description: string;
  tone: "success" | "info" | "error";
  action: "saved" | ActionType;
  occurredAt: string;
};

type ActionRailEntry = InlineFeedback;

function formatActionTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function toActionRailEntries(entries: readonly OperatorTripRequestActionHistoryEntry[]): ActionRailEntry[] {
  return entries.slice(0, 4).map((entry) => ({
    title: entry.title,
    description: entry.description,
    tone: entry.tone,
    action: entry.action === "completion_delivered" ? "resend_operator" : entry.action,
    occurredAt: entry.occurredAt,
  }));
}

function getActionRailRecovery(entry: ActionRailEntry): { label: string; action: ActionType } | null {
  if (entry.tone !== "error") return null;
  if (entry.action === "retry_request") {
    return { label: "Retry now", action: "retry_request" };
  }
  if (entry.action === "regenerate_itinerary") {
    return { label: "Regenerate", action: "regenerate_itinerary" };
  }
  if (entry.action === "resend_operator") {
    return { label: "Resend operator", action: "resend_operator" };
  }
  if (entry.action === "resend_client") {
    return { label: "Resend traveller", action: "resend_client" };
  }
  return null;
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

function getActionableStatusChips(item: OperatorTripRequestListItem): StatusChip[] {
  const chips: StatusChip[] = [];

  if (item.stage === "draft" || item.stage === "submitted") {
    chips.push({
      label: "Waiting for traveller details",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      actionLabel: "Edit brief",
      action: "edit",
    });
  }

  if (item.stage === "processing") {
    chips.push({
      label: "Generation running",
      tone: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    });
  }

  if (item.generationError) {
    chips.push({
      label: "Generation failed",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      actionLabel: "Retry now",
      action: "retry_request",
    });
  }

  if (item.operatorDeliveryError) {
    chips.push({
      label: "Operator send failed",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      actionLabel: "Resend operator",
      action: "resend_operator",
    });
  }

  if (item.clientDeliveryError) {
    chips.push({
      label: "Traveller send failed",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      actionLabel: "Resend traveller",
      action: "resend_client",
    });
  }

  if (item.stage === "completed" && !item.operatorNotified) {
    chips.push({
      label: "Operator send pending",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      actionLabel: "Send now",
      action: "resend_operator",
    });
  }

  if (item.stage === "completed" && item.clientPhone && !item.clientNotified) {
    chips.push({
      label: "Traveller send pending",
      tone: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      actionLabel: "Send now",
      action: "resend_client",
    });
  }

  if (item.stage === "completed" && !item.clientPhone) {
    chips.push({
      label: "No traveller phone",
      tone: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
      actionLabel: "Edit brief",
      action: "edit",
    });
  }

  if (item.stage === "completed" && !item.pdfUrl) {
    chips.push({
      label: "PDF unavailable",
      tone: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      actionLabel: "Regenerate",
      action: "regenerate_itinerary",
    });
  }

  if (item.lastItineraryRegeneratedAt) {
    chips.push({
      label: "Regenerated",
      tone: "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    });
  }

  return chips;
}

export function TripRequestDetailActions({
  request: initialRequest,
}: {
  request: OperatorTripRequestListItem;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [request, setRequest] = useState(initialRequest);
  const [runningAction, setRunningAction] = useState<ActionType | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>(() => buildEditFormState(initialRequest));
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState<InlineFeedback | null>(null);
  const [actionRail, setActionRail] = useState<ActionRailEntry[]>(() => toActionRailEntries(initialRequest.actionHistory));

  useEffect(() => {
    setRequest(initialRequest);
    setEditForm(buildEditFormState(initialRequest));
    setActionRail(toActionRailEntries(initialRequest.actionHistory));
  }, [initialRequest]);

  const canResendClient = useMemo(
    () => Boolean(request.clientPhone || request.clientEmail || request.createdShareUrl || request.pdfUrl),
    [request],
  );
  const statusChips = useMemo(() => getActionableStatusChips(request), [request]);

  function applyOptimisticActionUpdate(action: ActionType) {
    const now = new Date().toISOString();
    setRequest((current) => {
      if (action === "resend_operator") {
        return {
          ...current,
          operatorNotified: true,
          operatorDeliveryError: null,
          lastOperatorResentAt: now,
        };
      }
      if (action === "resend_client") {
        return {
          ...current,
          clientNotified: true,
          clientDeliveryError: null,
          lastClientResentAt: now,
        };
      }
      if (action === "regenerate_itinerary") {
        return {
          ...current,
          lastItineraryRegeneratedAt: now,
          generationError: null,
          stage: current.stage === "completed" ? current.stage : "processing",
          stageLabel: current.stage === "completed" ? current.stageLabel : "Processing",
        };
      }
      return {
        ...current,
        generationError: null,
        operatorDeliveryError: null,
        clientDeliveryError: null,
        stage: current.stage === "draft" || current.stage === "submitted" ? "processing" : current.stage,
        stageLabel:
          current.stage === "draft" || current.stage === "submitted"
            ? "Processing"
            : current.stageLabel,
      };
    });
  }

  function setInlineActionFeedback(action: ActionType, description: string) {
    const title =
      action === "resend_operator"
        ? "Operator resend started"
        : action === "resend_client"
          ? "Traveller resend started"
          : action === "regenerate_itinerary"
            ? "Regeneration started"
            : "Retry started";

    const feedback: InlineFeedback = {
      title,
      description,
      tone: action === "retry_request" || action === "regenerate_itinerary" ? "info" : "success",
      action,
      occurredAt: new Date().toISOString(),
    };
    setInlineFeedback(feedback);
    setActionRail((current) => [feedback, ...current].slice(0, 4));
  }

  async function runAction(action: ActionType) {
    setRunningAction(action);
    try {
      const response = await authedFetch(`/api/trip-requests/${request.id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json() as {
        data?: { message?: string } | null;
        error?: string | null;
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Action failed");
      }

      toast({
        title: "Request updated",
        description: payload.data?.message ?? "Action completed.",
        variant: "success",
      });
      applyOptimisticActionUpdate(action);
      setInlineActionFeedback(action, payload.data?.message ?? "Action completed.");
      router.refresh();
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setRunningAction(null);
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: `${label} copied`,
        variant: "success",
      });
    } catch {
      toast({
        title: `Couldn’t copy ${label.toLowerCase()}`,
        variant: "error",
      });
    }
  }

  async function saveEdit() {
    setSavingEdit(true);
    try {
      const response = await authedFetch(`/api/trip-requests/${request.id}`, {
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
        setRequest(payload.data.request);
        setEditForm(buildEditFormState(payload.data.request));
      }

      toast({
        title: "Trip request updated",
        description: payload.data?.message ?? "Saved the new trip brief.",
        variant: "success",
      });
      const feedback: InlineFeedback = {
        title: "Brief saved",
        description: payload.data?.message ?? "The request details were updated successfully.",
        tone: "success",
        action: "saved",
        occurredAt: new Date().toISOString(),
      };
      setInlineFeedback(feedback);
      setActionRail((current) => [feedback, ...current].slice(0, 4));
      setEditOpen(false);
      router.refresh();
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

  async function deleteRequest() {
    setDeleting(true);
    try {
      const response = await authedFetch(`/api/trip-requests/${request.id}`, {
        method: "DELETE",
      });

      const payload = await response.json() as {
        data?: { message?: string } | null;
        error?: string | null;
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to delete request");
      }

      toast({
        title: "Trip request removed",
        description: payload.data?.message ?? "The request was removed from the inbox.",
        variant: "success",
      });
      router.push("/trip-requests");
      router.refresh();
    } catch (error) {
      toast({
        title: "Couldn’t remove request",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "error",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">Operator actions</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Work this intake request directly from here. Update the brief, rerun generation, retry sends, or remove
                the request without jumping back to the inbox.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <PencilLine className="h-4 w-4" />
                Edit brief
              </button>
              <button
                type="button"
                onClick={() => void runAction("regenerate_itinerary")}
                disabled={runningAction !== null}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-amber-300"
              >
                {runningAction === "regenerate_itinerary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                Regenerate itinerary
              </button>
              <button
                type="button"
                onClick={() => void runAction("retry_request")}
                disabled={runningAction !== null}
                className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-fuchsia-300"
              >
                {runningAction === "retry_request" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                Retry request
              </button>
              <button
                type="button"
                onClick={() => void runAction("resend_operator")}
                disabled={runningAction !== null}
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-sky-300"
              >
                {runningAction === "resend_operator" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Resend to operator
              </button>
              <button
                type="button"
                onClick={() => void runAction("resend_client")}
                disabled={runningAction !== null || !canResendClient}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300"
              >
                {runningAction === "resend_client" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Resend to traveller
              </button>
              <button
                type="button"
                onClick={() => request.formUrl && void copyValue(request.formUrl, "Form link")}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <Copy className="h-4 w-4" />
                Copy form link
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
                Delete request
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">Live recovery status</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Live issue chips show the exact blocker on this request. Use the inline action on each chip for the
              fastest recovery path.
            </p>
            {actionRail.length > 0 ? (
              <div className="mt-4 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-3">
                  {actionRail.map((entry) => (
                    <div
                      key={`${entry.action}-${entry.occurredAt}`}
                      className={cn(
                        "min-w-[220px] rounded-2xl border px-4 py-3",
                        entry.tone === "success"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : entry.tone === "error"
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                            : "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold">{entry.title}</div>
                          <div className="mt-1 text-xs leading-5 opacity-90">{entry.description}</div>
                          {getActionRailRecovery(entry) ? (
                            <button
                              type="button"
                              onClick={() => void runAction(getActionRailRecovery(entry)!.action)}
                              disabled={runningAction !== null}
                              className="mt-3 inline-flex items-center gap-2 rounded-full border border-current/20 bg-background/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {runningAction === getActionRailRecovery(entry)!.action ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : null}
                              {getActionRailRecovery(entry)!.label}
                            </button>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-75">
                          {formatActionTimestamp(entry.occurredAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {inlineFeedback ? (
              <div
                className={cn(
                  "mt-4 rounded-2xl border px-4 py-3",
                  inlineFeedback.tone === "success"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : inlineFeedback.tone === "error"
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                      : "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold">{inlineFeedback.title}</div>
                    <div className="mt-1 text-sm opacity-90">{inlineFeedback.description}</div>
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">
                    Just now
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {statusChips.map((chip) => {
                const isRunning = chip.action && chip.action !== "edit" && runningAction === chip.action;
                return (
                  <div
                    key={`${chip.label}-${chip.actionLabel ?? "status"}`}
                    className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold", chip.tone)}
                  >
                    <span>{chip.label}</span>
                    {chip.actionLabel ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (chip.action === "edit") {
                            setEditOpen(true);
                            return;
                          }
                          if (chip.action) {
                            void runAction(chip.action);
                          }
                        }}
                        disabled={
                          chip.action === "resend_client"
                            ? runningAction !== null || !canResendClient
                            : chip.action === "edit"
                              ? false
                              : runningAction !== null
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-current/20 bg-background/70 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {chip.actionLabel}
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {statusChips.length === 0 ? (
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  No blocking issues. This request is healthy.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <Dialog open={editOpen} onOpenChange={(open) => {
        if (!savingEdit) {
          setEditOpen(open);
        }
      }}>
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
                  onChange={(event) => setEditForm((current) => ({ ...current, clientName: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">WhatsApp number</span>
                <input
                  value={editForm.clientPhone}
                  onChange={(event) => setEditForm((current) => ({ ...current, clientPhone: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Email</span>
                <input
                  value={editForm.clientEmail}
                  onChange={(event) => setEditForm((current) => ({ ...current, clientEmail: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Travellers *</span>
                <input
                  type="number"
                  min={1}
                  value={editForm.travelerCount}
                  onChange={(event) => setEditForm((current) => ({ ...current, travelerCount: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Destination *</span>
                <input
                  value={editForm.destination}
                  onChange={(event) => setEditForm((current) => ({ ...current, destination: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Duration in days *</span>
                <input
                  type="number"
                  min={1}
                  value={editForm.durationDays}
                  onChange={(event) => setEditForm((current) => ({ ...current, durationDays: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Departure date *</span>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(event) => setEditForm((current) => ({ ...current, startDate: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Return date *</span>
                <input
                  type="date"
                  value={editForm.endDate}
                  onChange={(event) => setEditForm((current) => ({ ...current, endDate: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Budget note</span>
                <input
                  value={editForm.budget}
                  onChange={(event) => setEditForm((current) => ({ ...current, budget: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Hotel preference</span>
                <input
                  value={editForm.hotelPreference}
                  onChange={(event) => setEditForm((current) => ({ ...current, hotelPreference: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Origin city / airport</span>
                <input
                  value={editForm.originCity}
                  onChange={(event) => setEditForm((current) => ({ ...current, originCity: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-foreground">Interests</span>
                <textarea
                  rows={3}
                  value={editForm.interests}
                  onChange={(event) => setEditForm((current) => ({ ...current, interests: event.target.value }))}
                  placeholder="beaches, food, family time, shopping"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-emerald-500/40"
                />
              </label>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
            <button
              type="button"
              onClick={() => !savingEdit && setEditOpen(false)}
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
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <DialogContent className="border border-border bg-background text-foreground sm:max-w-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
              <XCircle className="h-5 w-5 text-rose-500" />
              Delete trip request
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Remove <span className="font-semibold text-foreground">{request.clientName || "this request"}</span> from the intake inbox.
              {request.createdTripId
                ? " The linked trip stays available in Trips."
                : " This only removes the request record from the operator queue."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              disabled={deleting}
            >
              Keep request
            </button>
            <button
              type="button"
              onClick={() => void deleteRequest()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
