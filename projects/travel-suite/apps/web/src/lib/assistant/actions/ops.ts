import { randomUUID } from "crypto";

import {
  applyAutopilotApprovalDecision,
  getAutopilotApprovals,
} from "@/lib/platform/business-os";
import {
  createCommitment,
  createCommsSequence,
  loadCommitments,
  loadCommsSequences,
  updateCommitment,
  updateCommsSequence,
} from "@/lib/platform/business-comms";
import {
  createGodWorkItem,
  loadGodWorkItems,
  updateGodWorkItem,
  upsertGodAccountState,
} from "@/lib/platform/god-accounts";
import { ensureCollectionsPaymentLink } from "@/lib/payments/payment-links.server";
import { parseNaturalDate } from "../date-parser";
import type { ActionContext, ActionDefinition, ActionResult } from "../types";

type FollowupOutcome =
  | "replied"
  | "not_interested"
  | "needs_quote_revision"
  | "call_back_later"
  | "paid"
  | "trip_confirmed";

type OperatorListItem = {
  readonly id: string;
  readonly label: string;
  readonly metadata?: Record<string, unknown>;
};

function clampLimit(raw: unknown, fallback = 5, max = 10): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return fallback;
  }
  return Math.min(Math.max(1, Math.round(raw)), max);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "no due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmountInr(amount: number): string {
  return `INR ${Math.round(amount).toLocaleString("en-IN")}`;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(
  metadata: Record<string, unknown>,
  ...keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function buildFutureIso(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function parseDueDateInput(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return null;
  }

  const natural = parseNaturalDate(raw);
  if (natural) {
    return new Date(`${natural}T10:00:00.000Z`).toISOString();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function getClientContact(
  ctx: ActionContext,
  clientId: string,
): Promise<{
  readonly id: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly phoneWhatsapp: string | null;
} | null> {
  const { data, error } = await ctx.supabase
    .from("profiles")
    .select("id, full_name, phone, phone_whatsapp")
    .eq("id", clientId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name ?? "Unknown client",
    phone: data.phone ?? null,
    phoneWhatsapp: data.phone_whatsapp ?? null,
  };
}

async function queueWhatsappMessage(
  ctx: ActionContext,
  clientId: string,
  message: string,
): Promise<{
  readonly clientName: string;
  readonly phone: string;
} | { readonly error: string }> {
  const client = await getClientContact(ctx, clientId);
  if (!client) {
    return { error: "Client not found or access denied." };
  }

  const recipientPhone = client.phoneWhatsapp ?? client.phone;
  if (!recipientPhone) {
    return { error: `No phone number found for ${client.fullName}.` };
  }

  const { error } = await ctx.supabase.from("notification_queue").insert({
    notification_type: "assistant_whatsapp",
    channel_preference: "whatsapp",
    user_id: clientId,
    recipient_phone: recipientPhone,
    scheduled_for: new Date().toISOString(),
    payload: {
      message,
      sent_by: ctx.userId,
      client_name: client.fullName,
    },
  });

  if (error) {
    return { error: error.message };
  }

  await ctx.supabase
    .from("profiles")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("organization_id", ctx.organizationId);

  return {
    clientName: client.fullName,
    phone: recipientPhone,
  };
}

async function ensureTripShareUrl(
  ctx: ActionContext,
  itineraryId: string,
): Promise<string | null> {
  const { data: existing } = await ctx.supabase
    .from("shared_itineraries")
    .select("share_code")
    .eq("itinerary_id", itineraryId)
    .maybeSingle();

  if (existing?.share_code) {
    return `https://tripbuilt.com/share/${existing.share_code}`;
  }

  const shareCode = randomUUID().replace(/-/g, "").slice(0, 16);
  const { error } = await ctx.supabase.from("shared_itineraries").insert({
    itinerary_id: itineraryId,
    share_code: shareCode,
    status: "active",
    template_id: "safari_story",
  });

  if (error) {
    return null;
  }

  return `https://tripbuilt.com/share/${shareCode}`;
}

async function getInvoiceContext(
  ctx: ActionContext,
  invoiceId: string,
): Promise<{
  readonly id: string;
  readonly invoiceNumber: string;
  readonly balanceAmount: number;
  readonly totalAmount: number;
  readonly dueDate: string | null;
  readonly clientId: string;
  readonly clientName: string;
  readonly clientPhone: string | null;
  readonly clientEmail: string | null;
} | null> {
  const { data, error } = await ctx.supabase
    .from("invoices")
    .select(
      "id, invoice_number, total_amount, balance_amount, due_date, client_id, profiles!invoices_client_id_fkey(full_name, phone, phone_whatsapp, email)",
    )
    .eq("id", invoiceId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  if (error || !data?.client_id) {
    return null;
  }

  const profile = data.profiles as
    | {
        full_name: string | null;
        phone: string | null;
        phone_whatsapp: string | null;
        email: string | null;
      }
    | null;

  return {
    id: data.id,
    invoiceNumber: data.invoice_number ?? "Invoice",
    balanceAmount: Number(data.balance_amount ?? 0),
    totalAmount: Number(data.total_amount ?? 0),
    dueDate: data.due_date ?? null,
    clientId: data.client_id,
    clientName: profile?.full_name ?? "Unknown client",
    clientPhone: profile?.phone_whatsapp ?? profile?.phone ?? null,
    clientEmail: profile?.email ?? null,
  };
}

async function loadDueFollowupItems(
  ctx: ActionContext,
  limit: number,
): Promise<readonly OperatorListItem[]> {
  const [sequences, proposals, staleLeads] = await Promise.all([
    loadCommsSequences(ctx.supabase as never, ctx.organizationId, "active"),
    ctx.supabase
      .from("proposals")
      .select(
        "id, title, viewed_at, approved_at, status, clients!proposals_client_id_fkey(id, profiles!clients_id_fkey(full_name, phone, phone_whatsapp))",
      )
      .eq("organization_id", ctx.organizationId)
      .not("viewed_at", "is", null)
      .is("approved_at", null)
      .in("status", ["sent", "viewed"])
      .order("viewed_at", { ascending: true })
      .limit(limit * 2),
    ctx.supabase
      .from("profiles")
      .select("id, full_name, phone, phone_whatsapp, lead_status, lifecycle_stage, last_contacted_at, created_at")
      .eq("organization_id", ctx.organizationId)
      .eq("role", "client")
      .or("lead_status.eq.new,lifecycle_stage.eq.inquiry,lifecycle_stage.eq.proposal")
      .order("last_contacted_at", { ascending: true, nullsFirst: true })
      .limit(limit * 2),
  ]);

  const deduped = new Map<string, OperatorListItem>();

  for (const sequence of sequences) {
    const metadata = normalizeMetadata(sequence.metadata);
    const clientId = readString(metadata, "client_id");
    const clientName =
      readString(metadata, "client_name", "primary_contact_name", "account_name")
      ?? `${sequence.sequence_type.replaceAll("_", " ")} follow-up`;
    const key = clientId ?? `sequence:${sequence.id}`;

    if (deduped.has(key)) continue;

    deduped.set(key, {
      id: sequence.id,
      label: `${clientName} — ${sequence.sequence_type.replaceAll("_", " ")} due ${formatDateLabel(sequence.next_follow_up_at)}`,
      metadata: {
        source: "comms_sequence",
        client_id: clientId,
        client_name: clientName,
        sequence_type: sequence.sequence_type,
        next_follow_up_at: sequence.next_follow_up_at,
      },
    });
  }

  for (const row of (proposals.data ?? []) as Array<{
    id: string;
    title: string | null;
    viewed_at: string | null;
    clients:
      | {
          id: string;
          profiles:
            | { full_name: string | null; phone: string | null; phone_whatsapp: string | null }
            | null;
        }
      | null;
  }>) {
    const clientId = row.clients?.id;
    if (!clientId || deduped.has(clientId)) continue;
    const clientName = row.clients?.profiles?.full_name ?? "Unknown client";
    deduped.set(clientId, {
      id: `proposal:${row.id}`,
      label: `${clientName} — viewed proposal "${row.title ?? "Untitled proposal"}" with no approval`,
      metadata: {
        source: "proposal",
        client_id: clientId,
        client_name: clientName,
        proposal_id: row.id,
        viewed_at: row.viewed_at,
      },
    });
  }

  const staleThresholdMs = 3 * 86_400_000;
  for (const row of (staleLeads.data ?? []) as Array<{
    id: string;
    full_name: string | null;
    phone: string | null;
    phone_whatsapp: string | null;
    lead_status: string | null;
    lifecycle_stage: string | null;
    last_contacted_at: string | null;
    created_at: string | null;
  }>) {
    const lastTouch = row.last_contacted_at ?? row.created_at;
    const ageMs = lastTouch ? Date.now() - new Date(lastTouch).getTime() : staleThresholdMs + 1;
    if (ageMs < staleThresholdMs || deduped.has(row.id)) continue;

    deduped.set(row.id, {
      id: `lead:${row.id}`,
      label: `${row.full_name ?? "Unknown client"} — stale lead follow-up (${row.lead_status ?? row.lifecycle_stage ?? "open"})`,
      metadata: {
        source: "lead",
        client_id: row.id,
        client_name: row.full_name ?? "Unknown client",
        last_contacted_at: row.last_contacted_at,
      },
    });
  }

  return [...deduped.values()].slice(0, limit);
}

async function loadOverdueInvoiceItems(
  ctx: ActionContext,
  limit: number,
): Promise<readonly OperatorListItem[]> {
  const { data, error } = await ctx.supabase
    .from("invoices")
    .select(
      "id, invoice_number, balance_amount, currency, due_date, client_id, profiles!invoices_client_id_fkey(full_name)",
    )
    .eq("organization_id", ctx.organizationId)
    .gt("balance_amount", 0)
    .lt("due_date", todayISO())
    .order("due_date", { ascending: true })
    .limit(limit);

  if (error) return [];

  return (data ?? []).map((row) => {
    const profile = row.profiles as { full_name: string | null } | null;
    return {
      id: row.id,
      label: `${profile?.full_name ?? "Unknown client"} — #${row.invoice_number} ${formatAmountInr(Number(row.balance_amount ?? 0))} overdue since ${row.due_date ?? "unknown"}`,
      metadata: {
        invoice_id: row.id,
        client_id: row.client_id,
        client_name: profile?.full_name ?? "Unknown client",
        amount_inr: Number(row.balance_amount ?? 0),
        due_date: row.due_date,
      },
    };
  });
}

async function loadOpenWorkItemItems(
  ctx: ActionContext,
  limit: number,
): Promise<readonly OperatorListItem[]> {
  const workItems = await loadGodWorkItems(ctx.supabase as never, {
    orgIds: [ctx.organizationId],
    status: "active",
    limit,
  });

  return workItems.slice(0, limit).map((item) => ({
    id: item.id,
    label: `${item.title} — ${item.severity}${item.due_at ? ` due ${formatDateLabel(item.due_at)}` : ""}`,
    metadata: {
      kind: item.kind,
      severity: item.severity,
      due_at: item.due_at,
      title: item.title,
    },
  }));
}

async function loadBreachedCommitmentItems(
  ctx: ActionContext,
  limit: number,
): Promise<readonly OperatorListItem[]> {
  const commitments = await loadCommitments(ctx.supabase as never, ctx.organizationId, "all");
  const items = commitments
    .filter((item) => item.status === "breached" || (item.status === "open" && item.due_at !== null && item.due_at < new Date().toISOString()))
    .slice(0, limit);

  return items.map((item) => ({
    id: item.id,
    label: `${item.title} — ${item.status}${item.due_at ? ` due ${formatDateLabel(item.due_at)}` : ""}`,
    metadata: {
      source: item.source,
      severity: item.severity,
      status: item.status,
      due_at: item.due_at,
    },
  }));
}

async function loadPendingApprovalItems(
  ctx: ActionContext,
  limit: number,
): Promise<readonly OperatorListItem[]> {
  const approvals = await getAutopilotApprovals(ctx.supabase as never, ctx.userId, {
    status: "pending",
    limit: Math.max(limit, 10),
  });

  return approvals
    .filter((item) => item.org_id === ctx.organizationId)
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      label: `${item.title} — ${item.severity} (${item.account_name})`,
      metadata: {
        action_kind: item.action_kind,
        severity: item.severity,
        account_name: item.account_name,
      },
    }));
}

async function loadTripReadinessItems(
  ctx: ActionContext,
  limit: number,
  scope: "today" | "upcoming",
  query?: string,
): Promise<readonly OperatorListItem[]> {
  let request = ctx.supabase
    .from("trips")
    .select(
      "id, name, destination, status, start_date, end_date, driver_id, itinerary_id, client_id, profiles!trips_client_id_fkey(full_name)",
    )
    .eq("organization_id", ctx.organizationId)
    .order("start_date", { ascending: true })
    .limit(limit * 2);

  const today = todayISO();
  if (scope === "today") {
    request = request.lte("start_date", today).gte("end_date", today);
  } else {
    const endWindow = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
    request = request.gte("start_date", today).lte("start_date", endWindow);
  }

  if (query && query.trim().length > 0) {
    request = request.or(`destination.ilike.%${query}%,name.ilike.%${query}%`);
  }

  const { data, error } = await request;
  if (error) return [];

  const itineraryIds = (data ?? [])
    .map((row) => row.itinerary_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  const { data: shareRows } = itineraryIds.length > 0
    ? await ctx.supabase
        .from("shared_itineraries")
        .select("itinerary_id")
        .in("itinerary_id", itineraryIds)
    : { data: [] as Array<{ itinerary_id: string }> };

  const shared = new Set((shareRows ?? []).map((row) => row.itinerary_id));

  return (data ?? []).slice(0, limit).map((row) => {
    const client = row.profiles as { full_name: string | null } | null;
    const issues: string[] = [];
    if (!row.driver_id) issues.push("no driver");
    if (row.status === "planned" || row.status === "pending") issues.push(`status ${row.status}`);
    if (row.itinerary_id && !shared.has(row.itinerary_id)) issues.push("no share link");
    if (issues.length === 0) issues.push("ready");

    return {
      id: row.id,
      label: `${client?.full_name ?? row.name ?? row.destination ?? "Trip"} — ${issues.join(", ")}`,
      metadata: {
        trip_id: row.id,
        itinerary_id: row.itinerary_id,
        client_id: row.client_id,
        client_name: client?.full_name ?? null,
      },
    };
  });
}

function buildListMessage(
  title: string,
  items: readonly OperatorListItem[],
  empty: string,
  nextStep: string,
): string {
  if (items.length === 0) {
    return `${title}\n${empty}`;
  }

  return [
    title,
    ...items.map((item, index) => `${index + 1}. ${item.label}`),
    "",
    nextStep,
  ].join("\n");
}

const listDueFollowups: ActionDefinition = {
  name: "list_due_followups",
  description: "List the highest-priority follow-ups across comms sequences, viewed proposals, and stale leads",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Maximum follow-ups to return" },
    },
  },
  async execute(ctx, params): Promise<ActionResult> {
    const items = await loadDueFollowupItems(ctx, clampLimit(params.limit));
    return {
      success: true,
      data: { items },
      message: buildListMessage(
        "*Follow-ups due*",
        items,
        "No urgent follow-ups are due right now.",
        "Reply *sent 1*, *client replied 1*, *not interested 1*, or *snooze 1 2 days*.",
      ),
    };
  },
};

const sendFollowupMessage: ActionDefinition = {
  name: "send_followup_message",
  description: "Send a WhatsApp follow-up to a client and log it into the follow-up loop",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_id: { type: "string", description: "Client UUID" },
      message: { type: "string", description: "Follow-up message body" },
    },
    required: ["client_id", "message"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const clientId = cleanText(params.client_id);
    const message = cleanText(params.message);
    if (!clientId || !message) {
      return { success: false, message: "client_id and message are required." };
    }

    const sendResult = await queueWhatsappMessage(ctx, clientId, message);
    if ("error" in sendResult) {
      return { success: false, message: `Failed to send follow-up: ${sendResult.error}` };
    }

    const sequences = await loadCommsSequences(ctx.supabase as never, ctx.organizationId, "active");
    const existing = sequences.find((sequence) => {
      const metadata = normalizeMetadata(sequence.metadata);
      return readString(metadata, "client_id") === clientId;
    });

    const metadata = {
      ...(existing ? normalizeMetadata(existing.metadata) : {}),
      client_id: clientId,
      client_name: sendResult.clientName,
      last_operator_message: message,
      last_operator_message_at: new Date().toISOString(),
    };

    if (existing) {
      await updateCommsSequence(ctx.supabase as never, existing.id, {
        status: "active",
        last_sent_at: new Date().toISOString(),
        next_follow_up_at: buildFutureIso(2),
        metadata,
      });
    } else {
      await createCommsSequence(ctx.supabase as never, {
        org_id: ctx.organizationId,
        owner_id: ctx.userId,
        sequence_type: "activation_rescue",
        status: "active",
        channel: "whatsapp",
        step_index: 0,
        last_sent_at: new Date().toISOString(),
        next_follow_up_at: buildFutureIso(2),
        promise: "Operator follow-up sent from WhatsApp assistant",
        metadata,
      });
    }

    return {
      success: true,
      data: { clientId, clientName: sendResult.clientName },
      message: `Follow-up queued for ${sendResult.clientName}. Next follow-up is set for 2 days from now.`,
      affectedEntities: [{ type: "client", id: clientId }],
    };
  },
};

const snoozeFollowup: ActionDefinition = {
  name: "snooze_followup",
  description: "Snooze a follow-up without losing its context",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      followup_id: { type: "string", description: "Existing comms sequence ID when available" },
      client_id: { type: "string", description: "Client UUID if the follow-up has no comms sequence yet" },
      follow_up_at: { type: "string", description: "When to bring the follow-up back" },
      days: { type: "number", description: "Shortcut to snooze by N days" },
    },
  },
  async execute(ctx, params): Promise<ActionResult> {
    const followupId = cleanText(params.followup_id);
    const clientId = cleanText(params.client_id);
    const followUpAt = parseDueDateInput(params.follow_up_at);
    const days = typeof params.days === "number" && Number.isFinite(params.days)
      ? Math.max(1, Math.round(params.days))
      : null;
    const nextFollowUpAt = followUpAt ?? (days ? buildFutureIso(days) : null);

    if (!nextFollowUpAt) {
      return { success: false, message: "Provide follow_up_at or days to snooze the follow-up." };
    }

    if (followupId) {
      const updated = await updateCommsSequence(ctx.supabase as never, followupId, {
        status: "paused",
        next_follow_up_at: nextFollowUpAt,
      });
      if (!updated) {
        return { success: false, message: "Follow-up not found." };
      }
      return {
        success: true,
        data: { followupId, nextFollowUpAt },
        message: `Follow-up snoozed until ${formatDateLabel(nextFollowUpAt)}.`,
        affectedEntities: [{ type: "followup", id: followupId }],
      };
    }

    if (!clientId) {
      return { success: false, message: "Provide followup_id or client_id." };
    }

    const client = await getClientContact(ctx, clientId);
    if (!client) {
      return { success: false, message: "Client not found." };
    }

    const sequence = await createCommsSequence(ctx.supabase as never, {
      org_id: ctx.organizationId,
      owner_id: ctx.userId,
      sequence_type: "activation_rescue",
      status: "paused",
      channel: "whatsapp",
      next_follow_up_at: nextFollowUpAt,
      promise: "WhatsApp assistant snooze",
      metadata: {
        client_id: clientId,
        client_name: client.fullName,
      },
    });

    return {
      success: true,
      data: { followupId: sequence.id, nextFollowUpAt },
      message: `Follow-up for ${client.fullName} snoozed until ${formatDateLabel(nextFollowUpAt)}.`,
      affectedEntities: [{ type: "client", id: clientId }],
    };
  },
};

const setNextAction: ActionDefinition = {
  name: "set_next_action",
  description: "Set the operator's next action and due date in Business OS",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      next_action: { type: "string", description: "What should happen next" },
      due_date: { type: "string", description: "When it should be done" },
    },
    required: ["next_action", "due_date"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const nextAction = cleanText(params.next_action);
    const dueDate = parseDueDateInput(params.due_date);
    if (!nextAction || !dueDate) {
      return { success: false, message: "next_action and a valid due_date are required." };
    }

    await upsertGodAccountState(ctx.supabase as never, ctx.organizationId, {
      next_action: nextAction,
      next_action_due_at: dueDate,
      last_reviewed_at: new Date().toISOString(),
    });

    return {
      success: true,
      data: { nextAction, dueDate },
      message: `Next action set to "${nextAction}" due ${formatDateLabel(dueDate)}.`,
      affectedEntities: [{ type: "organization", id: ctx.organizationId }],
    };
  },
};

const markFollowupOutcome: ActionDefinition = {
  name: "mark_followup_outcome",
  description: "Record the outcome of a follow-up and close or update the loop",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_id: { type: "string", description: "Client UUID" },
      outcome: {
        type: "string",
        enum: ["replied", "not_interested", "needs_quote_revision", "call_back_later", "paid", "trip_confirmed"],
        description: "What happened after the follow-up",
      },
      followup_id: { type: "string", description: "Comms sequence ID when available" },
    },
    required: ["client_id", "outcome"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const clientId = cleanText(params.client_id);
    const followupId = cleanText(params.followup_id);
    const outcome = cleanText(params.outcome) as FollowupOutcome | null;
    if (!clientId || !outcome) {
      return { success: false, message: "client_id and outcome are required." };
    }

    if (followupId) {
      await updateCommsSequence(ctx.supabase as never, followupId, {
        status: outcome === "call_back_later" ? "paused" : "completed",
        next_follow_up_at: outcome === "call_back_later" ? buildFutureIso(3) : null,
        metadata: {
          outcome,
          resolved_at: new Date().toISOString(),
          client_id: clientId,
        },
      });
    }

    const profilePatch: Record<string, unknown> = {
      last_contacted_at: new Date().toISOString(),
    };

    if (outcome === "not_interested") {
      profilePatch.lead_status = "lost";
      profilePatch.lifecycle_stage = "closed_lost";
    } else if (outcome === "needs_quote_revision") {
      profilePatch.lead_status = "proposal_revision";
    } else if (outcome === "call_back_later") {
      profilePatch.lead_status = "follow_up_scheduled";
    } else if (outcome === "paid") {
      profilePatch.lead_status = "paid";
    } else if (outcome === "trip_confirmed") {
      profilePatch.lead_status = "won";
      profilePatch.lifecycle_stage = "confirmed";
    } else {
      profilePatch.lead_status = "engaged";
    }

    await ctx.supabase
      .from("profiles")
      .update(profilePatch)
      .eq("id", clientId)
      .eq("organization_id", ctx.organizationId);

    return {
      success: true,
      data: { clientId, outcome },
      message: `Recorded follow-up outcome: ${outcome.replaceAll("_", " ")}.`,
      affectedEntities: [{ type: "client", id: clientId }],
    };
  },
};

const reviewOverdueAccounts: ActionDefinition = {
  name: "review_overdue_accounts",
  description: "Summarize overdue invoices and the next collections move",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Maximum overdue invoices to return" },
    },
  },
  async execute(ctx, params): Promise<ActionResult> {
    const items = await loadOverdueInvoiceItems(ctx, clampLimit(params.limit));
    return {
      success: true,
      data: { items },
      message: buildListMessage(
        "*Collections queue*",
        items,
        "No overdue invoices need attention right now.",
        "Reply *send payment link 1* or *payment promised Friday* after reviewing the queue.",
      ),
    };
  },
};

const createPaymentLink: ActionDefinition = {
  name: "create_payment_link",
  description: "Create or reuse a payment link for an outstanding invoice",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      invoice_id: { type: "string", description: "Invoice UUID" },
    },
    required: ["invoice_id"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const invoiceId = cleanText(params.invoice_id);
    if (!invoiceId) {
      return { success: false, message: "invoice_id is required." };
    }

    const invoice = await getInvoiceContext(ctx, invoiceId);
    if (!invoice) {
      return { success: false, message: "Invoice not found." };
    }
    if (invoice.balanceAmount <= 0) {
      return { success: false, message: `Invoice #${invoice.invoiceNumber} has no outstanding balance.` };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tripbuilt.com";
    const link = await ensureCollectionsPaymentLink(ctx.supabase as never, {
      organizationId: ctx.organizationId,
      createdBy: ctx.userId,
      amountInr: invoice.balanceAmount,
      description: `Outstanding invoice #${invoice.invoiceNumber}`,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      clientPhone: invoice.clientPhone ?? undefined,
      clientEmail: invoice.clientEmail ?? undefined,
      baseUrl,
    });

    return {
      success: true,
      data: { invoiceId, paymentUrl: link.paymentUrl, paymentLinkId: link.id },
      message: `Payment link ready for ${invoice.clientName}: ${link.paymentUrl}`,
      affectedEntities: [{ type: "invoice", id: invoiceId }],
    };
  },
};

const sendPaymentLink: ActionDefinition = {
  name: "send_payment_link",
  description: "Send a payment link to a client on WhatsApp",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      invoice_id: { type: "string", description: "Invoice UUID" },
      message: { type: "string", description: "Optional custom message" },
    },
    required: ["invoice_id"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const invoiceId = cleanText(params.invoice_id);
    const customMessage = cleanText(params.message);
    if (!invoiceId) {
      return { success: false, message: "invoice_id is required." };
    }

    const invoice = await getInvoiceContext(ctx, invoiceId);
    if (!invoice) {
      return { success: false, message: "Invoice not found." };
    }
    if (invoice.balanceAmount <= 0) {
      return { success: false, message: `Invoice #${invoice.invoiceNumber} has no outstanding balance.` };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tripbuilt.com";
    const link = await ensureCollectionsPaymentLink(ctx.supabase as never, {
      organizationId: ctx.organizationId,
      createdBy: ctx.userId,
      amountInr: invoice.balanceAmount,
      description: `Outstanding invoice #${invoice.invoiceNumber}`,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      clientPhone: invoice.clientPhone ?? undefined,
      clientEmail: invoice.clientEmail ?? undefined,
      baseUrl,
    });

    const message =
      customMessage
      ?? `Hi ${invoice.clientName}, here is your payment link for invoice #${invoice.invoiceNumber}: ${link.paymentUrl}`;
    const sendResult = await queueWhatsappMessage(ctx, invoice.clientId, message);
    if ("error" in sendResult) {
      return { success: false, message: `Failed to send payment link: ${sendResult.error}` };
    }

    const sequences = await loadCommsSequences(ctx.supabase as never, ctx.organizationId, "all");
    const current = sequences.find((sequence) => {
      const metadata = normalizeMetadata(sequence.metadata);
      return readString(metadata, "client_id") === invoice.clientId && sequence.sequence_type === "collections";
    });

    const metadata = {
      ...(current ? normalizeMetadata(current.metadata) : {}),
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      invoice_id: invoice.id,
      payment_link_url: link.paymentUrl,
      payment_link_id: link.id,
    };

    if (current) {
      await updateCommsSequence(ctx.supabase as never, current.id, {
        status: "active",
        channel: "whatsapp",
        last_sent_at: new Date().toISOString(),
        next_follow_up_at: buildFutureIso(2),
        metadata,
      });
    } else {
      await createCommsSequence(ctx.supabase as never, {
        org_id: ctx.organizationId,
        owner_id: ctx.userId,
        sequence_type: "collections",
        status: "active",
        channel: "whatsapp",
        last_sent_at: new Date().toISOString(),
        next_follow_up_at: buildFutureIso(2),
        promise: `Collect payment for invoice #${invoice.invoiceNumber}`,
        metadata,
      });
    }

    return {
      success: true,
      data: { invoiceId, paymentUrl: link.paymentUrl },
      message: `Payment link sent to ${invoice.clientName}.`,
      affectedEntities: [{ type: "invoice", id: invoiceId }],
    };
  },
};

const recordPaymentPromise: ActionDefinition = {
  name: "record_payment_promise",
  description: "Record a customer payment promise and track it as a commitment",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      client_id: { type: "string", description: "Client UUID" },
      amount_inr: { type: "number", description: "Promised payment amount in INR" },
      due_date: { type: "string", description: "When the customer promised to pay" },
      note: { type: "string", description: "Optional promise note" },
    },
    required: ["client_id", "amount_inr", "due_date"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const clientId = cleanText(params.client_id);
    const amountInr = typeof params.amount_inr === "number" ? Number(params.amount_inr) : NaN;
    const dueDate = parseDueDateInput(params.due_date);
    const note = cleanText(params.note);
    if (!clientId || !Number.isFinite(amountInr) || amountInr <= 0 || !dueDate) {
      return { success: false, message: "client_id, amount_inr, and a valid due_date are required." };
    }

    const client = await getClientContact(ctx, clientId);
    if (!client) {
      return { success: false, message: "Client not found." };
    }

    const commitment = await createCommitment(ctx.supabase as never, {
      org_id: ctx.organizationId,
      owner_id: ctx.userId,
      source: "collections",
      title: `Payment promise from ${client.fullName}`,
      detail: note ?? `Promised ${formatAmountInr(amountInr)}`,
      severity: "medium",
      due_at: dueDate,
      metadata: {
        client_id: clientId,
        amount_inr: amountInr,
      },
    });

    return {
      success: true,
      data: { commitmentId: commitment.id, dueDate, amountInr },
      message: `Recorded payment promise from ${client.fullName} for ${formatAmountInr(amountInr)} due ${formatDateLabel(dueDate)}.`,
      affectedEntities: [{ type: "commitment", id: commitment.id }],
    };
  },
};

const listOpenWorkItems: ActionDefinition = {
  name: "list_open_work_items",
  description: "List open Business OS work items for the operator",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Maximum work items to return" },
    },
  },
  async execute(ctx, params): Promise<ActionResult> {
    const items = await loadOpenWorkItemItems(ctx, clampLimit(params.limit));
    return {
      success: true,
      data: { items },
      message: buildListMessage(
        "*Open work*",
        items,
        "No open work items right now.",
        "Reply *done 1* to clear an item or *create task call Rahul tomorrow* to add a new one.",
      ),
    };
  },
};

const completeWorkItem: ActionDefinition = {
  name: "complete_work_item",
  description: "Mark a Business OS work item as done",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      work_item_id: { type: "string", description: "Work item UUID" },
    },
    required: ["work_item_id"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const workItemId = cleanText(params.work_item_id);
    if (!workItemId) {
      return { success: false, message: "work_item_id is required." };
    }

    const updated = await updateGodWorkItem(ctx.supabase as never, workItemId, {
      status: "done",
    });
    if (!updated || updated.org_id !== ctx.organizationId) {
      return { success: false, message: "Work item not found." };
    }

    return {
      success: true,
      data: { workItemId },
      message: `Marked "${updated.title}" as done.`,
      affectedEntities: [{ type: "work_item", id: workItemId }],
    };
  },
};

const createWorkItem: ActionDefinition = {
  name: "create_work_item",
  description: "Create a lightweight operator work item from WhatsApp",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Task title" },
      summary: { type: "string", description: "Optional extra detail" },
      due_date: { type: "string", description: "When the task is due" },
      severity: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Task severity",
      },
    },
    required: ["title"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const title = cleanText(params.title);
    const summary = cleanText(params.summary);
    const severity = cleanText(params.severity);
    const dueDate = parseDueDateInput(params.due_date) ?? buildFutureIso(1);
    if (!title) {
      return { success: false, message: "title is required." };
    }

    const workItem = await createGodWorkItem(ctx.supabase as never, {
      kind: "growth_followup",
      target_type: "organization",
      target_id: ctx.organizationId,
      org_id: ctx.organizationId,
      owner_id: ctx.userId,
      status: "open",
      severity:
        severity === "low" || severity === "high" || severity === "critical"
          ? severity
          : "medium",
      title,
      summary,
      due_at: dueDate,
      metadata: {
        source: "whatsapp_operator_assistant",
      },
    });

    return {
      success: true,
      data: { workItemId: workItem.id },
      message: `Created work item "${workItem.title}" due ${formatDateLabel(dueDate)}.`,
      affectedEntities: [{ type: "work_item", id: workItem.id }],
    };
  },
};

const listBreachedCommitments: ActionDefinition = {
  name: "list_breached_commitments",
  description: "List breached or overdue commitments that need resolution",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Maximum commitments to return" },
    },
  },
  async execute(ctx, params): Promise<ActionResult> {
    const items = await loadBreachedCommitmentItems(ctx, clampLimit(params.limit));
    return {
      success: true,
      data: { items },
      message: buildListMessage(
        "*Promises at risk*",
        items,
        "No breached or overdue commitments right now.",
        "Reply *resolve 1* once a promise is closed.",
      ),
    };
  },
};

const resolveCommitment: ActionDefinition = {
  name: "resolve_commitment",
  description: "Resolve a commitment after the outcome is known",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      commitment_id: { type: "string", description: "Commitment UUID" },
      resolution: {
        type: "string",
        enum: ["met", "cancelled"],
        description: "How the commitment was resolved",
      },
    },
    required: ["commitment_id"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const commitmentId = cleanText(params.commitment_id);
    const resolution = cleanText(params.resolution);
    if (!commitmentId) {
      return { success: false, message: "commitment_id is required." };
    }

    const updated = await updateCommitment(ctx.supabase as never, commitmentId, {
      status: resolution === "cancelled" ? "cancelled" : "met",
    });

    if (!updated || updated.org_id !== ctx.organizationId) {
      return { success: false, message: "Commitment not found." };
    }

    return {
      success: true,
      data: { commitmentId },
      message: `Commitment "${updated.title}" marked as ${updated.status}.`,
      affectedEntities: [{ type: "commitment", id: commitmentId }],
    };
  },
};

const checkTripReadiness: ActionDefinition = {
  name: "check_trip_readiness",
  description: "Review trip readiness for today or the next few days",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      scope: {
        type: "string",
        enum: ["today", "upcoming"],
        description: "Whether to check only today or the next few days",
      },
      query: { type: "string", description: "Optional trip or destination search" },
      limit: { type: "number", description: "Maximum trips to return" },
    },
  },
  async execute(ctx, params): Promise<ActionResult> {
    const scope = cleanText(params.scope) === "upcoming" ? "upcoming" : "today";
    const query = cleanText(params.query) ?? undefined;
    const items = await loadTripReadinessItems(ctx, clampLimit(params.limit), scope, query);
    return {
      success: true,
      data: { items },
      message: buildListMessage(
        scope === "today" ? "*Trip readiness today*" : "*Upcoming trip readiness*",
        items,
        "No trips in that window need attention.",
        "Reply *share link for <trip>* or *send pickup details 1* when you need the next handoff step.",
      ),
    };
  },
};

const resendTripShareLink: ActionDefinition = {
  name: "resend_trip_share_link",
  description: "Generate or reuse the trip share link and return it to the operator",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      trip_id: { type: "string", description: "Trip UUID" },
    },
    required: ["trip_id"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const tripId = cleanText(params.trip_id);
    if (!tripId) {
      return { success: false, message: "trip_id is required." };
    }

    const { data, error } = await ctx.supabase
      .from("trips")
      .select("id, itinerary_id, destination, name")
      .eq("id", tripId)
      .eq("organization_id", ctx.organizationId)
      .maybeSingle();

    if (error || !data?.itinerary_id) {
      return { success: false, message: "Trip not found or no itinerary is linked yet." };
    }

    const shareUrl = await ensureTripShareUrl(ctx, data.itinerary_id);
    if (!shareUrl) {
      return { success: false, message: "Trip found, but the share link could not be generated." };
    }

    return {
      success: true,
      data: { tripId, shareUrl },
      message: `Share link for ${data.name ?? data.destination ?? "this trip"}: ${shareUrl}`,
      affectedEntities: [{ type: "trip", id: tripId }],
    };
  },
};

const sendTripUpdate: ActionDefinition = {
  name: "send_trip_update",
  description: "Send a custom trip update to the traveler on WhatsApp",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      trip_id: { type: "string", description: "Trip UUID" },
      message: { type: "string", description: "Message body" },
    },
    required: ["trip_id", "message"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const tripId = cleanText(params.trip_id);
    const message = cleanText(params.message);
    if (!tripId || !message) {
      return { success: false, message: "trip_id and message are required." };
    }

    const { data, error } = await ctx.supabase
      .from("trips")
      .select("id, client_id")
      .eq("id", tripId)
      .eq("organization_id", ctx.organizationId)
      .maybeSingle();

    if (error || !data?.client_id) {
      return { success: false, message: "Trip not found or no traveler is linked yet." };
    }

    const sendResult = await queueWhatsappMessage(ctx, data.client_id, message);
    if ("error" in sendResult) {
      return { success: false, message: `Failed to send trip update: ${sendResult.error}` };
    }

    return {
      success: true,
      data: { tripId },
      message: `Trip update queued for ${sendResult.clientName}.`,
      affectedEntities: [{ type: "trip", id: tripId }],
    };
  },
};

const sendPickupDetails: ActionDefinition = {
  name: "send_pickup_details",
  description: "Send a concise pickup and driver handoff message to the traveler",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      trip_id: { type: "string", description: "Trip UUID" },
      message: { type: "string", description: "Optional override message" },
    },
    required: ["trip_id"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const tripId = cleanText(params.trip_id);
    const customMessage = cleanText(params.message);
    if (!tripId) {
      return { success: false, message: "trip_id is required." };
    }

    const { data, error } = await ctx.supabase
      .from("trips")
      .select(
        "id, client_id, destination, start_date, status, notes, profiles!trips_client_id_fkey(full_name), driver:profiles!trips_driver_id_fkey(full_name, phone)",
      )
      .eq("id", tripId)
      .eq("organization_id", ctx.organizationId)
      .maybeSingle();

    if (error || !data?.client_id) {
      return { success: false, message: "Trip not found or no traveler is linked yet." };
    }

    const traveler = data.profiles as { full_name: string | null } | null;
    const driver = data.driver as { full_name: string | null; phone: string | null } | null;
    if (!customMessage && !driver?.full_name) {
      return { success: false, message: "Pickup details need a driver assigned, or provide a custom message." };
    }

    const message = customMessage ?? [
      `Hi ${traveler?.full_name ?? "traveler"},`,
      `Your ${data.destination ?? "upcoming"} trip is on ${data.start_date ?? "the scheduled date"}.`,
      `Driver: ${driver?.full_name ?? "TBA"}${driver?.phone ? ` (${driver.phone})` : ""}`,
      data.notes ? `Notes: ${data.notes}` : null,
      "Reply here if you need any help before departure.",
    ].filter((value): value is string => Boolean(value)).join("\n");

    const sendResult = await queueWhatsappMessage(ctx, data.client_id, message);
    if ("error" in sendResult) {
      return { success: false, message: `Failed to send pickup details: ${sendResult.error}` };
    }

    return {
      success: true,
      data: { tripId },
      message: `Pickup details queued for ${sendResult.clientName}.`,
      affectedEntities: [{ type: "trip", id: tripId }],
    };
  },
};

const listPendingApprovals: ActionDefinition = {
  name: "list_pending_approvals",
  description: "List guarded Business OS drafts that still need explicit approval",
  category: "read",
  requiresConfirmation: false,
  parameters: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Maximum approvals to return" },
    },
  },
  async execute(ctx, params): Promise<ActionResult> {
    const items = await loadPendingApprovalItems(ctx, clampLimit(params.limit));
    return {
      success: true,
      data: { items },
      message: buildListMessage(
        "*Pending approvals*",
        items,
        "No guarded drafts need approval right now.",
        "Reply *approve 1* or *reject 1* to clear the queue.",
      ),
    };
  },
};

const approveDraft: ActionDefinition = {
  name: "approve_draft",
  description: "Approve a guarded draft so it can move into execution",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      approval_id: { type: "string", description: "Approval ID" },
    },
    required: ["approval_id"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const approvalId = cleanText(params.approval_id);
    if (!approvalId) {
      return { success: false, message: "approval_id is required." };
    }

    const result = await applyAutopilotApprovalDecision(ctx.supabase as never, {
      currentUserId: ctx.userId,
      approvalId,
      decision: "approved",
    });

    return {
      success: true,
      data: { approvalId, workItemId: result.work_item?.id ?? null },
      message: `Approved "${result.approval.title}".`,
      affectedEntities: [{ type: "approval", id: approvalId }],
    };
  },
};

const rejectDraft: ActionDefinition = {
  name: "reject_draft",
  description: "Reject a guarded draft",
  category: "write",
  requiresConfirmation: true,
  parameters: {
    type: "object",
    properties: {
      approval_id: { type: "string", description: "Approval ID" },
    },
    required: ["approval_id"],
  },
  async execute(ctx, params): Promise<ActionResult> {
    const approvalId = cleanText(params.approval_id);
    if (!approvalId) {
      return { success: false, message: "approval_id is required." };
    }

    const result = await applyAutopilotApprovalDecision(ctx.supabase as never, {
      currentUserId: ctx.userId,
      approvalId,
      decision: "rejected",
    });

    return {
      success: true,
      data: { approvalId },
      message: `Rejected "${result.approval.title}".`,
      affectedEntities: [{ type: "approval", id: approvalId }],
    };
  },
};

export const operatorOpsActions: readonly ActionDefinition[] = [
  listDueFollowups,
  sendFollowupMessage,
  snoozeFollowup,
  setNextAction,
  markFollowupOutcome,
  createPaymentLink,
  sendPaymentLink,
  recordPaymentPromise,
  reviewOverdueAccounts,
  listOpenWorkItems,
  completeWorkItem,
  createWorkItem,
  listBreachedCommitments,
  resolveCommitment,
  checkTripReadiness,
  resendTripShareLink,
  sendTripUpdate,
  sendPickupDetails,
  listPendingApprovals,
  approveDraft,
  rejectDraft,
];
