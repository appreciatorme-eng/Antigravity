import "server-only";

import crypto from "node:crypto";

import { isValid, parse } from "date-fns";

import type { Database, Json } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export type WhatsAppCollectedFields = {
  destination: string | null;
  travelDates: string | null;
  groupSize: string | null;
  budget: string | null;
};

export type WhatsAppProposalDraft = {
  id: string;
  chatbotSessionId: string;
  clientId: string | null;
  templateId: string | null;
  travelerName: string | null;
  travelerPhone: string;
  travelerEmail: string | null;
  destination: string | null;
  travelDates: string | null;
  tripStartDate: string | null;
  tripEndDate: string | null;
  groupSize: number | null;
  budgetInr: number | null;
  title: string;
  status: Database["public"]["Tables"]["whatsapp_proposal_drafts"]["Row"]["status"];
  sourceContext: Json;
  createdAt: string;
  updatedAt: string;
};

export type WhatsAppProposalDraftSummary = {
  id: string;
  chatbotSessionId: string;
  title: string;
  status: Database["public"]["Tables"]["whatsapp_proposal_drafts"]["Row"]["status"];
  updatedAt: string;
};

type DraftRow = Database["public"]["Tables"]["whatsapp_proposal_drafts"]["Row"];

const DRAFT_COLUMNS =
  "id, organization_id, chatbot_session_id, client_id, template_id, traveler_name, traveler_phone, traveler_email, destination, travel_dates, trip_start_date, trip_end_date, group_size, budget_inr, title, status, source_context, created_at, updated_at" as const;

const DRAFT_PLACEHOLDER_DOMAIN = "lead.tripbuilt.invalid";

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `+${digits}` : phone.trim();
}

function getPhoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

function trimOrNull(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

export function buildLeadPlaceholderEmail(phone: string) {
  const digits = getPhoneDigits(phone);
  const suffix = digits || crypto.randomUUID().replace(/-/g, "");
  return `whatsapp-${suffix}@${DRAFT_PLACEHOLDER_DOMAIN}`;
}

export function parseGroupSize(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const matches = value.match(/\d+/g);
  if (!matches?.length) {
    return null;
  }

  const numbers = matches
    .map((entry) => Number.parseInt(entry, 10))
    .filter((entry) => Number.isFinite(entry) && entry > 0 && entry <= 50);

  if (!numbers.length) {
    return null;
  }

  if (numbers.length > 1 && /\b(adult|child|kid|people|traveler|traveller|pax|family)\b/i.test(value)) {
    return numbers.reduce((sum, entry) => sum + entry, 0);
  }

  return numbers[0] ?? null;
}

export function parseBudgetInr(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase().replace(/,/g, "").trim();
  const lakhMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs)\b/);
  if (lakhMatch) {
    return Math.round(Number.parseFloat(lakhMatch[1] ?? "0") * 100_000);
  }

  const thousandMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k\b/);
  if (thousandMatch) {
    return Math.round(Number.parseFloat(thousandMatch[1] ?? "0") * 1_000);
  }

  const numericMatch = normalized.match(/\d{3,}/);
  return numericMatch ? Number.parseInt(numericMatch[0], 10) : null;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseSlashDate(value: string) {
  const cleaned = value.trim().replace(/\./g, "/").replace(/-/g, "/");
  const [day, month, rawYear] = cleaned.split("/");
  if (!day || !month || !rawYear) {
    return null;
  }

  const normalizedYear = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  const parsed = parse(`${day}/${month}/${normalizedYear}`, "d/M/yyyy", new Date());
  return isValid(parsed) ? formatDateOnly(parsed) : null;
}

export function parseLooseDateRange(value: string | null | undefined) {
  if (!value) {
    return { startDate: null, endDate: null };
  }

  const isoMatches = value.match(/\b\d{4}-\d{2}-\d{2}\b/g);
  if (isoMatches?.length) {
    return {
      startDate: isoMatches[0] ?? null,
      endDate: isoMatches[1] ?? isoMatches[0] ?? null,
    };
  }

  const slashMatches = value.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g);
  if (slashMatches?.length) {
    return {
      startDate: parseSlashDate(slashMatches[0] ?? ""),
      endDate: parseSlashDate(slashMatches[1] ?? slashMatches[0] ?? ""),
    };
  }

  return { startDate: null, endDate: null };
}

export function buildProposalDraftTitle(args: {
  destination: string | null;
  travelerName: string | null;
}) {
  const destination = trimOrNull(args.destination, 120);
  const travelerName = trimOrNull(args.travelerName, 120);

  if (destination && travelerName) {
    return `${destination} proposal for ${travelerName}`;
  }

  if (destination) {
    return `${destination} travel proposal`;
  }

  if (travelerName) {
    return `Travel proposal for ${travelerName}`;
  }

  return "WhatsApp travel proposal";
}

function parseCollectedFields(value: unknown): WhatsAppCollectedFields {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      destination: null,
      travelDates: null,
      groupSize: null,
      budget: null,
    };
  }

  const raw = value as Record<string, unknown>;
  const collected =
    raw.collected && typeof raw.collected === "object" && !Array.isArray(raw.collected)
      ? (raw.collected as Record<string, unknown>)
      : raw;

  return {
    destination: typeof collected.destination === "string" ? collected.destination : null,
    travelDates: typeof collected.travelDates === "string" ? collected.travelDates : null,
    groupSize: typeof collected.groupSize === "string" ? collected.groupSize : null,
    budget: typeof collected.budget === "string" ? collected.budget : null,
  };
}

function mapDraft(row: DraftRow): WhatsAppProposalDraft {
  return {
    id: row.id,
    chatbotSessionId: row.chatbot_session_id,
    clientId: row.client_id,
    templateId: row.template_id,
    travelerName: row.traveler_name,
    travelerPhone: row.traveler_phone,
    travelerEmail: row.traveler_email,
    destination: row.destination,
    travelDates: row.travel_dates,
    tripStartDate: row.trip_start_date,
    tripEndDate: row.trip_end_date,
    groupSize: row.group_size,
    budgetInr: row.budget_inr,
    title: row.title,
    status: row.status,
    sourceContext: row.source_context,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findSuggestedTemplate(organizationId: string, destination: string | null) {
  const admin = createAdminClient();

  if (destination) {
    const { data: matchingTemplate } = await admin
      .from("tour_templates")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .ilike("destination", `%${destination}%`)
      .order("usage_count", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (matchingTemplate?.id) {
      return matchingTemplate.id;
    }
  }

  const { data: fallbackTemplate } = await admin
    .from("tour_templates")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("usage_count", { ascending: false })
    .limit(1)
    .maybeSingle();

  return fallbackTemplate?.id ?? null;
}

async function ensureLeadClient(args: {
  organizationId: string;
  travelerPhone: string;
  travelerName: string | null;
  destination: string | null;
}) {
  const admin = createAdminClient();
  const normalizedPhone = normalizePhone(args.travelerPhone);
  const phoneDigits = getPhoneDigits(normalizedPhone);
  const safeName = trimOrNull(args.travelerName, 160) ?? `WhatsApp Lead ${phoneDigits.slice(-4) || "guest"}`;

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("organization_id", args.organizationId)
    .eq("phone_normalized", phoneDigits)
    .maybeSingle();

  const profileId = existingProfile?.id ?? crypto.randomUUID();
  const email = existingProfile?.email ?? null;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: profileId,
      organization_id: args.organizationId,
      role: "client",
      full_name: safeName,
      email,
      phone: normalizedPhone,
      phone_normalized: phoneDigits || null,
      preferred_destination: trimOrNull(args.destination, 160),
      lifecycle_stage: "qualified",
      source_channel: "whatsapp_ai",
      lead_status: "new",
      client_tag: "standard",
      phase_notifications_enabled: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw profileError;
  }

  const { error: clientError } = await admin.from("clients").upsert(
    {
      id: profileId,
      organization_id: args.organizationId,
      user_id: null,
    },
    { onConflict: "id" },
  );

  if (clientError) {
    throw clientError;
  }

  return { clientId: profileId, travelerName: safeName, travelerEmail: email };
}

export async function upsertWhatsAppProposalDraftFromCollected(args: {
  organizationId: string;
  chatbotSessionId: string;
  travelerPhone: string;
  collected: WhatsAppCollectedFields;
  sourceContext: Json;
}) {
  const admin = createAdminClient();
  const { clientId, travelerName, travelerEmail } = await ensureLeadClient({
    organizationId: args.organizationId,
    travelerPhone: args.travelerPhone,
    travelerName: null,
    destination: args.collected.destination,
  });

  const { startDate, endDate } = parseLooseDateRange(args.collected.travelDates);
  const templateId = await findSuggestedTemplate(args.organizationId, args.collected.destination);

  const { data: existing } = await admin
    .from("whatsapp_proposal_drafts")
    .select("id, status")
    .eq("organization_id", args.organizationId)
    .eq("chatbot_session_id", args.chatbotSessionId)
    .maybeSingle();

  const payload: Database["public"]["Tables"]["whatsapp_proposal_drafts"]["Insert"] = {
    organization_id: args.organizationId,
    chatbot_session_id: args.chatbotSessionId,
    client_id: clientId,
    template_id: templateId,
    traveler_name: travelerName,
    traveler_phone: normalizePhone(args.travelerPhone),
    traveler_email: travelerEmail,
    destination: trimOrNull(args.collected.destination, 160),
    travel_dates: trimOrNull(args.collected.travelDates, 160),
    trip_start_date: startDate,
    trip_end_date: endDate,
    group_size: parseGroupSize(args.collected.groupSize),
    budget_inr: parseBudgetInr(args.collected.budget),
    title: buildProposalDraftTitle({
      destination: args.collected.destination,
      travelerName,
    }),
    source_context: args.sourceContext,
    status:
      existing?.status === "opened" || existing?.status === "converted" || existing?.status === "archived"
        ? existing.status
        : "ready",
  };

  const { data, error } = await admin
    .from("whatsapp_proposal_drafts")
    .upsert(existing ? { ...payload, id: existing.id } : payload, {
      onConflict: "chatbot_session_id",
    })
    .select(DRAFT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return mapDraft(data);
}

export async function getWhatsAppProposalDraftForOrg(args: {
  draftId: string;
  organizationId: string;
  markOpened?: boolean;
}) {
  const admin = createAdminClient();
  const draftQuery = admin
    .from("whatsapp_proposal_drafts")
    .select(DRAFT_COLUMNS)
    .eq("id", args.draftId)
    .eq("organization_id", args.organizationId)
    .maybeSingle();

  const { data, error } = await draftQuery;
  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  if (!args.markOpened || data.status !== "ready") {
    return mapDraft(data);
  }

  const { data: updated, error: updateError } = await admin
    .from("whatsapp_proposal_drafts")
    .update({
      status: "opened",
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .eq("organization_id", args.organizationId)
    .select(DRAFT_COLUMNS)
    .single();

  if (updateError) {
    throw updateError;
  }

  return mapDraft(updated);
}

export async function refreshWhatsAppProposalDraft(args: {
  draftId: string;
  organizationId: string;
}) {
  const admin = createAdminClient();
  const { data: draft, error: draftError } = await admin
    .from("whatsapp_proposal_drafts")
    .select("id, chatbot_session_id, traveler_phone")
    .eq("id", args.draftId)
    .eq("organization_id", args.organizationId)
    .maybeSingle();

  if (draftError) {
    throw draftError;
  }

  if (!draft) {
    return null;
  }

  const { data: session, error: sessionError } = await admin
    .from("whatsapp_chatbot_sessions")
    .select("context")
    .eq("id", draft.chatbot_session_id)
    .eq("organization_id", args.organizationId)
    .maybeSingle();

  if (sessionError) {
    throw sessionError;
  }

  return upsertWhatsAppProposalDraftFromCollected({
    organizationId: args.organizationId,
    chatbotSessionId: draft.chatbot_session_id,
    travelerPhone: draft.traveler_phone,
    collected: parseCollectedFields(session?.context ?? null),
    sourceContext: (session?.context as Json | null) ?? {},
  });
}

export async function getProposalDraftSummariesForSessions(
  organizationId: string,
  chatbotSessionIds: string[],
) {
  const admin = createAdminClient();

  if (!chatbotSessionIds.length) {
    return new Map<string, WhatsAppProposalDraftSummary>();
  }

  const { data, error } = await admin
    .from("whatsapp_proposal_drafts")
    .select("id, chatbot_session_id, title, status, updated_at")
    .eq("organization_id", organizationId)
    .in("chatbot_session_id", chatbotSessionIds);

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((row) => [
      row.chatbot_session_id,
      {
        id: row.id,
        chatbotSessionId: row.chatbot_session_id,
        title: row.title,
        status: row.status,
        updatedAt: row.updated_at,
      },
    ]),
  );
}
