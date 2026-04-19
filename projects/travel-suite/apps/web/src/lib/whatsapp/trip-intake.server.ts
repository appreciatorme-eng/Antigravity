import "server-only";

import { randomUUID } from "node:crypto";

import type { Json } from "@/lib/database.types";
import { deleteCachedByPrefix, getCachedJson, setCachedJson } from "@/lib/cache/upstash";
import { logError } from "@/lib/observability/logger";
import type { ActionContext } from "@/lib/assistant/types";
import { parseLooseDateRange } from "@/lib/whatsapp/proposal-drafts.server";

type TripRequestStatus = "draft" | "ready_to_create" | "completed" | "cancelled";

type TripRequestStepId =
  | "client_identity"
  | "traveler_count"
  | "travel_window"
  | "budget"
  | "hotel_preference"
  | "interests"
  | "origin_city";

type TripRequestRow = {
  id: string;
  organization_id: string;
  operator_user_id: string;
  client_id: string | null;
  source_channel: string;
  status: TripRequestStatus;
  request_summary: string | null;
  destination: string | null;
  duration_days: number | null;
  client_name: string | null;
  client_phone: string | null;
  traveler_count: number | null;
  travel_window: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: string | null;
  hotel_preference: string | null;
  interests: string[] | null;
  origin_city: string | null;
  current_step: TripRequestStepId | null;
  collected_fields: Json;
  missing_required_fields: Json;
  created_trip_id: string | null;
  created_itinerary_id: string | null;
  created_share_url: string | null;
  created_at: string;
  updated_at: string;
};

type TripRequestDraft = {
  id: string;
  status: TripRequestStatus;
  requestSummary: string | null;
  destination: string | null;
  durationDays: number | null;
  clientName: string | null;
  clientPhone: string | null;
  travelerCount: number | null;
  travelWindow: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  hotelPreference: string | null;
  interests: readonly string[];
  originCity: string | null;
  currentStep: TripRequestStepId | null;
  collectedFields: Readonly<Record<string, unknown>>;
  missingRequiredFields: readonly string[];
  createdTripId: string | null;
  createdItineraryId: string | null;
  createdShareUrl: string | null;
  updatedAt: string;
};

type ActiveTripIntakeState = {
  selectedDraftId: string;
};

type StepDefinition = {
  id: TripRequestStepId;
  prompt: string;
  required: boolean;
};

type TripSeed = {
  destination: string;
  durationDays: number;
};

type TravelWindowResolution = {
  startDate: string;
  endDate: string;
  displayValue: string;
};

type ParsedClientIdentity = {
  clientName: string;
  clientPhone: string | null;
};

const ACTIVE_DRAFT_STATUSES = ["draft", "ready_to_create"] as const;
const ACTIVE_STATE_KEY_PREFIX = "assistant:trip-intake";
const ACTIVE_STATE_TTL_SECONDS = 60 * 60 * 24;

const STEP_DEFINITIONS: readonly StepDefinition[] = [
  {
    id: "client_identity",
    required: true,
    prompt: "Who is this trip for? Reply with the client name. Add the phone number too if you have it.",
  },
  {
    id: "traveler_count",
    required: true,
    prompt: "How many travelers is this for?",
  },
  {
    id: "travel_window",
    required: true,
    prompt: "What dates or travel window should I use? Examples: 2026-06-10 to 2026-06-14, 12/06/2026 to 16/06/2026, June 2026, next month.",
  },
  {
    id: "budget",
    required: false,
    prompt: "Any budget note for this trip? Reply with an amount or type skip.",
  },
  {
    id: "hotel_preference",
    required: false,
    prompt: "Any hotel preference? Reply with the preference or type skip.",
  },
  {
    id: "interests",
    required: false,
    prompt: "Any key interests to shape the plan? Examples: beaches, temples, adventure, honeymoon. Or type skip.",
  },
  {
    id: "origin_city",
    required: false,
    prompt: "What is the origin city or airport? Or type skip.",
  },
] as const;

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function buildActiveStateKey(ctx: ActionContext): string {
  return `${ACTIVE_STATE_KEY_PREFIX}:${ctx.organizationId}:${ctx.userId}`;
}

async function getActiveState(ctx: ActionContext): Promise<ActiveTripIntakeState | null> {
  try {
    return await getCachedJson<ActiveTripIntakeState>(buildActiveStateKey(ctx));
  } catch {
    return null;
  }
}

async function setActiveState(ctx: ActionContext, draftId: string): Promise<void> {
  await setCachedJson<ActiveTripIntakeState>(
    buildActiveStateKey(ctx),
    { selectedDraftId: draftId },
    ACTIVE_STATE_TTL_SECONDS,
  );
}

async function clearActiveState(ctx: ActionContext): Promise<void> {
  await deleteCachedByPrefix(buildActiveStateKey(ctx));
}

function normalizePhoneDigits(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length > 6 ? digits : null;
}

function formatPhoneForStorage(value: string): string | null {
  const digits = normalizePhoneDigits(value);
  return digits ? `+${digits}` : null;
}

function trimOrNull(value: string | null | undefined, maxLength = 160): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : null;
}

function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addUtcDays(dateOnly: string, offsetDays: number): string {
  const base = new Date(`${dateOnly}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return formatDateOnly(base);
}

function formatDraftLabel(draft: TripRequestDraft): string {
  const parts = [
    draft.destination,
    draft.durationDays ? `${draft.durationDays}d` : null,
    draft.clientName,
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0 ? parts.join(" · ") : "Untitled draft";
}

function summarizeDraft(data: {
  destination?: string | null;
  durationDays?: number | null;
  clientName?: string | null;
}): string | null {
  const parts = [
    trimOrNull(data.destination, 80),
    typeof data.durationDays === "number" ? `${data.durationDays} day trip` : null,
    trimOrNull(data.clientName, 80),
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0 ? parts.join(" · ") : null;
}

function toCollectedFields(value: Json): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toMissingRequiredFields(value: Json): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function mapDraft(row: TripRequestRow): TripRequestDraft {
  return {
    id: row.id,
    status: row.status,
    requestSummary: row.request_summary,
    destination: row.destination,
    durationDays: row.duration_days,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    travelerCount: row.traveler_count,
    travelWindow: row.travel_window,
    startDate: row.start_date,
    endDate: row.end_date,
    budget: row.budget,
    hotelPreference: row.hotel_preference,
    interests: row.interests ?? [],
    originCity: row.origin_city,
    currentStep: row.current_step,
    collectedFields: toCollectedFields(row.collected_fields),
    missingRequiredFields: toMissingRequiredFields(row.missing_required_fields),
    createdTripId: row.created_trip_id,
    createdItineraryId: row.created_itinerary_id,
    createdShareUrl: row.created_share_url,
    updatedAt: row.updated_at,
  };
}

function computeMissingRequiredFields(input: {
  destination: string | null;
  durationDays: number | null;
  clientName: string | null;
  travelerCount: number | null;
  travelWindow: string | null;
}): readonly string[] {
  const missing: string[] = [];
  if (!input.destination) missing.push("destination");
  if (!input.durationDays) missing.push("duration_days");
  if (!input.clientName) missing.push("client_name");
  if (!input.travelerCount) missing.push("traveler_count");
  if (!input.travelWindow) missing.push("travel_window");
  return missing;
}

function getCurrentStep(draft: TripRequestDraft): StepDefinition | null {
  if (draft.currentStep) {
    return STEP_DEFINITIONS.find((step) => step.id === draft.currentStep) ?? null;
  }

  for (const step of STEP_DEFINITIONS) {
    switch (step.id) {
      case "client_identity":
        if (!draft.clientName) return step;
        break;
      case "traveler_count":
        if (!draft.travelerCount) return step;
        break;
      case "travel_window":
        if (!draft.travelWindow) return step;
        break;
      case "budget":
        if (draft.budget === null) return step;
        break;
      case "hotel_preference":
        if (draft.hotelPreference === null) return step;
        break;
      case "interests":
        if (!("interests" in draft.collectedFields)) return step;
        break;
      case "origin_city":
        if (draft.originCity === null) return step;
        break;
      default:
        break;
    }
  }

  return null;
}

function getNextStepId(draft: TripRequestDraft): TripRequestStepId | null {
  return getCurrentStep(draft)?.id ?? null;
}

function buildStepPrompt(step: StepDefinition): string {
  const suffix = step.required
    ? 'Reply "skip for later" if you want to pause and resume this request later.'
    : 'Reply "skip" to leave this blank, or "skip for later" to pause the whole request.';
  return `${step.prompt}\n\n${suffix}`;
}

function isPauseCommand(value: string): boolean {
  return /^(skip\s+for\s+later|later|pause|resume later)$/i.test(value.trim());
}

function isCancelCommand(value: string): boolean {
  return /^(cancel|abort|stop this trip)$/i.test(value.trim());
}

function isResumeCommand(value: string): boolean {
  return /^(resume|continue|resume trip|resume trip request|continue trip request|drafts)$/i.test(value.trim());
}

function isFinalizeCommand(value: string): boolean {
  return /^(create now|done|finish|that'?s all|thats all)$/i.test(value.trim());
}

function parsePositiveInteger(value: string, max: number): number | null {
  const match = value.match(/\d+/);
  if (!match) return null;
  const parsed = Number.parseInt(match[0] ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > max) {
    return null;
  }
  return parsed;
}

function cleanDestination(value: string): string | null {
  return trimOrNull(
    value
      .replace(/\b(for|with|from)\b.*$/i, "")
      .replace(/\btrip\b/gi, "")
      .replace(/[.?!,]+$/g, ""),
    120,
  );
}

function extractTripSeed(message: string): TripSeed | null {
  const trimmed = message.trim();
  const durationDays = parsePositiveInteger(trimmed, 30);
  if (!durationDays) return null;

  const patterns: readonly RegExp[] = [
    /\b\d{1,2}\s*(?:day|days|night|nights)\b(?:\s+trip|\s+itinerary|\s+plan)?(?:\s+to)?\s+(.+)$/i,
    /\b(?:trip|itinerary|plan)\s+(?:to|for)\s+(.+?)\s+for\s+\d{1,2}\s*(?:day|days|night|nights)\b/i,
    /^(.+?)\s+for\s+\d{1,2}\s*(?:day|days|night|nights)\b/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    const destination = cleanDestination(match?.[1] ?? "");
    if (destination) {
      return { destination, durationDays };
    }
  }

  return null;
}

function parseClientIdentity(value: string): ParsedClientIdentity | null {
  const phoneDigits = normalizePhoneDigits(value);
  const phone = phoneDigits ? `+${phoneDigits}` : null;
  const name = trimOrNull(
    phoneDigits
      ? value.replace(/[\s()+-]*\d[\d\s()+-]{6,}/g, " ")
      : value,
    160,
  );

  if (!name) return null;

  return {
    clientName: name,
    clientPhone: phone,
  };
}

function parseInterests(value: string): readonly string[] {
  return value
    .split(/[,\n]/)
    .map((item) => trimOrNull(item, 60))
    .filter((item): item is string => Boolean(item));
}

function resolveTravelWindow(
  value: string,
  durationDays: number,
): TravelWindowResolution | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const loose = parseLooseDateRange(trimmed);
  if (loose.startDate) {
    return {
      startDate: loose.startDate,
      endDate: loose.endDate ?? addUtcDays(loose.startDate, durationDays - 1),
      displayValue: trimmed,
    };
  }

  const lower = trimmed.toLowerCase();
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  if (lower === "next month") {
    const start = new Date(Date.UTC(currentYear, currentMonth + 1, 1));
    const startDate = formatDateOnly(start);
    return {
      startDate,
      endDate: addUtcDays(startDate, durationDays - 1),
      displayValue: trimmed,
    };
  }

  if (lower === "this month") {
    const start = new Date(Date.UTC(currentYear, currentMonth, 1));
    const startDate = formatDateOnly(start);
    return {
      startDate,
      endDate: addUtcDays(startDate, durationDays - 1),
      displayValue: trimmed,
    };
  }

  const monthYearMatch = lower.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/i,
  );
  if (monthYearMatch) {
    const month = MONTH_INDEX[monthYearMatch[1]!.toLowerCase()];
    const year = Number.parseInt(monthYearMatch[2] ?? "", 10);
    if (Number.isFinite(month) && Number.isFinite(year)) {
      const startDate = formatDateOnly(new Date(Date.UTC(year, month, 1)));
      return {
        startDate,
        endDate: addUtcDays(startDate, durationDays - 1),
        displayValue: trimmed,
      };
    }
  }

  const monthOnlyMatch = lower.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  );
  if (monthOnlyMatch) {
    const month = MONTH_INDEX[monthOnlyMatch[1]!.toLowerCase()];
    if (Number.isFinite(month)) {
      const year = month >= currentMonth ? currentYear : currentYear + 1;
      const startDate = formatDateOnly(new Date(Date.UTC(year, month, 1)));
      return {
        startDate,
        endDate: addUtcDays(startDate, durationDays - 1),
        displayValue: trimmed,
      };
    }
  }

  return null;
}

function buildInterestAwareTheme(dayNumber: number, interests: readonly string[]): string {
  const lowered = interests.map((interest) => interest.toLowerCase());
  if (lowered.some((interest) => interest.includes("beach"))) {
    return dayNumber === 1 ? "Arrival and coastal unwind" : "Beach and island highlights";
  }
  if (lowered.some((interest) => interest.includes("temple") || interest.includes("culture"))) {
    return dayNumber === 1 ? "Arrival and local orientation" : "Culture and temple day";
  }
  if (lowered.some((interest) => interest.includes("adventure"))) {
    return dayNumber === 1 ? "Arrival and easy exploration" : "Adventure and activity day";
  }
  if (lowered.some((interest) => interest.includes("honeymoon"))) {
    return dayNumber === 1 ? "Arrival and romantic check-in" : "Romantic experiences";
  }
  return dayNumber === 1 ? "Arrival and local orientation" : "Signature local experiences";
}

function buildStructuredItinerary(draft: TripRequestDraft) {
  const destination = draft.destination ?? "Destination";
  const durationDays = draft.durationDays ?? 1;
  const clientName = draft.clientName ?? "your client";
  const interests = draft.interests;
  const notes = [
    draft.budget ? `Budget: ${draft.budget}` : null,
    draft.hotelPreference ? `Hotel: ${draft.hotelPreference}` : null,
    draft.originCity ? `Origin: ${draft.originCity}` : null,
    interests.length > 0 ? `Interests: ${interests.join(", ")}` : null,
    draft.travelWindow ? `Travel window: ${draft.travelWindow}` : null,
  ].filter((value): value is string => Boolean(value));

  return {
    trip_title: `${destination} Trip for ${clientName}`,
    destination,
    duration_days: durationDays,
    summary: notes.length > 0
      ? `Operator-planned trip draft for ${clientName}. ${notes.join(" · ")}`
      : `Operator-planned ${durationDays}-day trip draft for ${clientName}.`,
    budget: draft.budget,
    interests,
    hotel_preference: draft.hotelPreference,
    origin_city: draft.originCity,
    travel_window: draft.travelWindow,
    raw_data: {
      trip_title: `${destination} Trip for ${clientName}`,
      destination,
      duration_days: durationDays,
      summary: `Created from the TripBuilt WhatsApp assistant for ${clientName}.`,
      budget: draft.budget,
      interests,
      hotel_preference: draft.hotelPreference,
      origin_city: draft.originCity,
      travel_window: draft.travelWindow,
      travelers: draft.travelerCount,
      created_via: "whatsapp_trip_intake",
      days: Array.from({ length: durationDays }, (_, index) => ({
        day_number: index + 1,
        theme: buildInterestAwareTheme(index + 1, interests),
        activities: [
          {
            time: "Morning",
            title: index === 0 ? "Arrival and check-in" : `Explore ${destination}`,
            description: index === 0
              ? `Arrival, transfer, and settle into the trip base in ${destination}.`
              : `Start the day with one of the signature experiences in ${destination}.`,
            location: destination,
          },
          {
            time: "Afternoon",
            title: "Curated sightseeing",
            description: interests.length > 0
              ? `Focus on ${interests.join(", ")} and other strong-fit activities for this trip.`
              : `Keep the afternoon flexible for the best sightseeing and local experiences.`,
            location: destination,
          },
          {
            time: "Evening",
            title: index === durationDays - 1 ? "Departure prep" : "Dinner and downtime",
            description: index === durationDays - 1
              ? "Wrap up the trip with buffer time for checkout or onward travel."
              : "Leave the evening open for dining, leisure, and operator customization.",
            location: destination,
          },
        ],
      })),
    },
  };
}

async function listActiveDrafts(ctx: ActionContext): Promise<readonly TripRequestDraft[]> {
  const { data, error } = await ctx.supabase
    .from("assistant_trip_requests")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .eq("operator_user_id", ctx.userId)
    .in("status", [...ACTIVE_DRAFT_STATUSES])
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    logError("[trip-intake] failed to load active drafts", error, {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
    });
    return [];
  }

  return ((data ?? []) as TripRequestRow[]).map(mapDraft);
}

async function getDraftById(
  ctx: ActionContext,
  draftId: string,
): Promise<TripRequestDraft | null> {
  const { data, error } = await ctx.supabase
    .from("assistant_trip_requests")
    .select("*")
    .eq("id", draftId)
    .eq("organization_id", ctx.organizationId)
    .eq("operator_user_id", ctx.userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapDraft(data as TripRequestRow);
}

async function createDraft(
  ctx: ActionContext,
  seed: TripSeed,
): Promise<TripRequestDraft | null> {
  const missingRequiredFields = computeMissingRequiredFields({
    destination: seed.destination,
    durationDays: seed.durationDays,
    clientName: null,
    travelerCount: null,
    travelWindow: null,
  });

  const { data, error } = await ctx.supabase
    .from("assistant_trip_requests")
    .insert({
      organization_id: ctx.organizationId,
      operator_user_id: ctx.userId,
      source_channel: ctx.channel,
      status: "draft",
      request_summary: summarizeDraft({
        destination: seed.destination,
        durationDays: seed.durationDays,
      }),
      destination: seed.destination,
      duration_days: seed.durationDays,
      current_step: "client_identity",
      collected_fields: {
        destination: seed.destination,
        duration_days: seed.durationDays,
      } as unknown as Json,
      missing_required_fields: missingRequiredFields as unknown as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    logError("[trip-intake] failed to create draft", error, {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
    });
    return null;
  }

  return mapDraft(data as TripRequestRow);
}

async function updateDraft(
  ctx: ActionContext,
  draftId: string,
  patch: Record<string, unknown>,
): Promise<TripRequestDraft | null> {
  const { data, error } = await ctx.supabase
    .from("assistant_trip_requests")
    .update(patch)
    .eq("id", draftId)
    .eq("organization_id", ctx.organizationId)
    .eq("operator_user_id", ctx.userId)
    .select("*")
    .single();

  if (error || !data) {
    logError("[trip-intake] failed to update draft", error, {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      draftId,
    });
    return null;
  }

  return mapDraft(data as TripRequestRow);
}

async function pickActiveDraft(
  ctx: ActionContext,
  message: string,
): Promise<TripRequestDraft | null> {
  const activeState = await getActiveState(ctx);
  if (activeState?.selectedDraftId) {
    const selected = await getDraftById(ctx, activeState.selectedDraftId);
    if (selected && (selected.status === "draft" || selected.status === "ready_to_create")) {
      return selected;
    }
    await clearActiveState(ctx);
  }

  const drafts = await listActiveDrafts(ctx);
  if (drafts.length === 1) {
    await setActiveState(ctx, drafts[0].id);
    return drafts[0];
  }

  if (drafts.length > 1) {
    const choice = parsePositiveInteger(message, drafts.length);
    if (choice) {
      const selected = drafts[choice - 1] ?? null;
      if (selected) {
        await setActiveState(ctx, selected.id);
        return selected;
      }
    }
  }

  return null;
}

function buildDraftChooserReply(drafts: readonly TripRequestDraft[]): string {
  const lines = drafts.map((draft, index) => `${index + 1}. ${formatDraftLabel(draft)}`);
  return [
    "You have multiple trip drafts in progress.",
    "",
    ...lines,
    "",
    "Reply with the draft number to continue, or send a new request like `5 day trip to Bali` to start another one.",
  ].join("\n");
}

async function ensureClientProfile(
  ctx: ActionContext,
  draft: TripRequestDraft,
): Promise<{ clientId: string; clientName: string } | { error: string }> {
  const clientName = trimOrNull(draft.clientName, 160);
  if (!clientName) {
    return { error: "Client name is missing from the trip request." };
  }

  const normalizedPhone = normalizePhoneDigits(draft.clientPhone);

  if (normalizedPhone) {
    const { data: existingByPhone, error } = await ctx.supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", ctx.organizationId)
      .eq("role", "client")
      .eq("phone_normalized", normalizedPhone)
      .maybeSingle();

    if (error) {
      return { error: `Failed to look up client by phone: ${error.message}` };
    }

    if (existingByPhone?.id) {
      const { error: updateProfileError } = await ctx.supabase
        .from("profiles")
        .update({
          full_name: clientName,
          phone: formatPhoneForStorage(draft.clientPhone ?? normalizedPhone),
          phone_whatsapp: formatPhoneForStorage(draft.clientPhone ?? normalizedPhone),
          phone_normalized: normalizedPhone,
          organization_id: ctx.organizationId,
          role: "client",
          lifecycle_stage: "inquiry",
          lead_status: "new",
          source_channel: "whatsapp_group_assistant",
          travelers_count: draft.travelerCount,
        })
        .eq("id", existingByPhone.id);

      if (updateProfileError) {
        return { error: `Failed to update existing client profile: ${updateProfileError.message}` };
      }

      const { error: clientUpsertError } = await ctx.supabase
        .from("clients")
        .upsert(
          {
            id: existingByPhone.id,
            organization_id: ctx.organizationId,
            user_id: null,
          },
          { onConflict: "id" },
        );

      if (clientUpsertError) {
        return { error: `Failed to link client record: ${clientUpsertError.message}` };
      }

      return { clientId: existingByPhone.id, clientName };
    }
  }

  const { data: exactNameMatches, error: nameLookupError } = await ctx.supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", ctx.organizationId)
    .eq("role", "client")
    .ilike("full_name", clientName)
    .limit(2);

  if (nameLookupError) {
    return { error: `Failed to look up existing client name: ${nameLookupError.message}` };
  }

  if ((exactNameMatches ?? []).length === 1 && exactNameMatches?.[0]?.id) {
    const existing = exactNameMatches[0];
    const { error: updateProfileError } = await ctx.supabase
      .from("profiles")
      .update({
        full_name: clientName,
        phone: draft.clientPhone ? formatPhoneForStorage(draft.clientPhone) : null,
        phone_whatsapp: draft.clientPhone ? formatPhoneForStorage(draft.clientPhone) : null,
        phone_normalized: draft.clientPhone ? normalizePhoneDigits(draft.clientPhone) : null,
        organization_id: ctx.organizationId,
        role: "client",
        lifecycle_stage: "inquiry",
        lead_status: "new",
        source_channel: "whatsapp_group_assistant",
        travelers_count: draft.travelerCount,
      })
      .eq("id", existing.id);

    if (updateProfileError) {
      return { error: `Failed to update existing client profile: ${updateProfileError.message}` };
    }

    const { error: clientUpsertError } = await ctx.supabase
      .from("clients")
      .upsert(
        {
          id: existing.id,
          organization_id: ctx.organizationId,
          user_id: null,
        },
        { onConflict: "id" },
      );

    if (clientUpsertError) {
      return { error: `Failed to link client record: ${clientUpsertError.message}` };
    }

    return { clientId: existing.id, clientName };
  }

  const profileId = randomUUID();
  const formattedPhone = draft.clientPhone ? formatPhoneForStorage(draft.clientPhone) : null;
  const phoneDigits = draft.clientPhone ? normalizePhoneDigits(draft.clientPhone) : null;

  const { error: profileInsertError } = await ctx.supabase
    .from("profiles")
    .insert({
      id: profileId,
      organization_id: ctx.organizationId,
      role: "client",
      full_name: clientName,
      phone: formattedPhone,
      phone_whatsapp: formattedPhone,
      phone_normalized: phoneDigits,
      lifecycle_stage: "inquiry",
      lead_status: "new",
      source_channel: "whatsapp_group_assistant",
      travelers_count: draft.travelerCount,
    });

  if (profileInsertError) {
    return { error: `Failed to create client profile: ${profileInsertError.message}` };
  }

  const { error: clientInsertError } = await ctx.supabase
    .from("clients")
    .insert({
      id: profileId,
      organization_id: ctx.organizationId,
      user_id: null,
    });

  if (clientInsertError) {
    return { error: `Failed to create client record: ${clientInsertError.message}` };
  }

  return { clientId: profileId, clientName };
}

async function ensureTripShareUrl(
  ctx: ActionContext,
  itineraryId: string,
): Promise<string | null> {
  const { data: existing, error: existingError } = await ctx.supabase
    .from("shared_itineraries")
    .select("share_code")
    .eq("itinerary_id", itineraryId)
    .maybeSingle();

  if (existingError) {
    logError("[trip-intake] failed to look up share link", existingError, {
      organizationId: ctx.organizationId,
      itineraryId,
    });
    return null;
  }

  if (existing?.share_code) {
    return `https://tripbuilt.com/share/${existing.share_code}`;
  }

  const shareCode = randomUUID().replace(/-/g, "").slice(0, 16);
  const { error: insertError } = await ctx.supabase
    .from("shared_itineraries")
    .insert({
      itinerary_id: itineraryId,
      share_code: shareCode,
      status: "active",
      template_id: "safari_story",
    });

  if (insertError) {
    logError("[trip-intake] failed to create share link", insertError, {
      organizationId: ctx.organizationId,
      itineraryId,
    });
    return null;
  }

  return `https://tripbuilt.com/share/${shareCode}`;
}

async function finalizeDraft(
  ctx: ActionContext,
  draft: TripRequestDraft,
): Promise<string> {
  const clientResolution = await ensureClientProfile(ctx, draft);
  if ("error" in clientResolution) {
    await clearActiveState(ctx);
    return `I saved the draft but couldn't create the trip yet: ${clientResolution.error}\n\nReply *resume* to try again.`;
  }

  if (!draft.startDate || !draft.endDate || !draft.destination || !draft.durationDays) {
    await clearActiveState(ctx);
    return "This draft is still missing the destination, duration, or travel window. Reply *resume* and I’ll continue from the missing step.";
  }

  const itinerary = buildStructuredItinerary(draft);

  const { data: itineraryRow, error: itineraryError } = await ctx.supabase
    .from("itineraries")
    .insert({
      user_id: clientResolution.clientId,
      trip_title: itinerary.trip_title,
      destination: itinerary.destination,
      summary: itinerary.summary,
      duration_days: itinerary.duration_days,
      budget: draft.budget,
      interests: draft.interests.length > 0 ? [...draft.interests] : null,
      raw_data: itinerary.raw_data as unknown as Json,
    })
    .select("id")
    .single();

  if (itineraryError || !itineraryRow?.id) {
    await clearActiveState(ctx);
    return `I saved the draft but couldn't create the itinerary: ${itineraryError?.message ?? "unknown error"}\n\nReply *resume* to try again.`;
  }

  const { data: tripRow, error: tripError } = await ctx.supabase
    .from("trips")
    .insert({
      client_id: clientResolution.clientId,
      organization_id: ctx.organizationId,
      start_date: draft.startDate,
      end_date: draft.endDate,
      status: "pending",
      itinerary_id: itineraryRow.id,
      pax_count: draft.travelerCount,
    })
    .select("id")
    .single();

  if (tripError || !tripRow?.id) {
    await clearActiveState(ctx);
    return `I created the itinerary draft but couldn't create the trip record: ${tripError?.message ?? "unknown error"}\n\nReply *resume* to try again.`;
  }

  const shareUrl = await ensureTripShareUrl(ctx, itineraryRow.id);
  const completed = await updateDraft(ctx, draft.id, {
    status: "completed",
    client_id: clientResolution.clientId,
    current_step: null,
    created_trip_id: tripRow.id,
    created_itinerary_id: itineraryRow.id,
    created_share_url: shareUrl,
    request_summary: summarizeDraft({
      destination: draft.destination,
      durationDays: draft.durationDays,
      clientName: clientResolution.clientName,
    }),
    missing_required_fields: [] as unknown as Json,
  });

  if (!completed) {
    logError("[trip-intake] draft completion update failed", null, {
      organizationId: ctx.organizationId,
      draftId: draft.id,
      tripId: tripRow.id,
      itineraryId: itineraryRow.id,
    });
  }

  await clearActiveState(ctx);

  const lines = [
    `Trip created for *${clientResolution.clientName}* in *Planner* and *Trips*.`,
    `Destination: *${draft.destination}*`,
    `Duration: *${draft.durationDays} days*`,
    draft.travelWindow ? `Travel window: *${draft.travelWindow}*` : null,
    shareUrl ? `Share link: ${shareUrl}` : "The trip is ready, but I couldn't generate the share link yet.",
    "",
    "You can send that share link to the client manually.",
  ].filter((value): value is string => Boolean(value));

  return lines.join("\n");
}

async function resumeReplyForDraft(
  ctx: ActionContext,
  draft: TripRequestDraft,
): Promise<string> {
  if (draft.status === "ready_to_create") {
    return finalizeDraft(ctx, draft);
  }

  const step = getCurrentStep(draft);
  if (!step) {
    return finalizeDraft(ctx, draft);
  }

  await setActiveState(ctx, draft.id);
  return `Continuing *${formatDraftLabel(draft)}*.\n\n${buildStepPrompt(step)}`;
}

async function applyStepAnswer(
  ctx: ActionContext,
  draft: TripRequestDraft,
  message: string,
): Promise<string> {
  const step = getCurrentStep(draft);
  if (!step) {
    return finalizeDraft(ctx, draft);
  }

  const trimmed = message.trim();

  if (isCancelCommand(trimmed)) {
    await updateDraft(ctx, draft.id, {
      status: "cancelled",
      current_step: null,
    });
    await clearActiveState(ctx);
    return `Cancelled *${formatDraftLabel(draft)}*.`;
  }

  if (isPauseCommand(trimmed)) {
    const paused = await updateDraft(ctx, draft.id, {
      status: "draft",
      current_step: step.id,
    });
    await clearActiveState(ctx);
    return paused
      ? `Saved *${formatDraftLabel(paused)}* for later. Reply *resume* whenever you want to continue.`
      : "I couldn't save that pause state. Please try again.";
  }

  if (!step.required && isFinalizeCommand(trimmed)) {
    const completedOptionalPatch: Record<string, unknown> = {
      current_step: null,
      status: "ready_to_create",
    };
    const nextCollected = {
      ...draft.collectedFields,
      [step.id]: "",
    };
    completedOptionalPatch.collected_fields = nextCollected as unknown as Json;
    switch (step.id) {
      case "budget":
        completedOptionalPatch.budget = "";
        break;
      case "hotel_preference":
        completedOptionalPatch.hotel_preference = "";
        break;
      case "interests":
        completedOptionalPatch.interests = [] as string[];
        break;
      case "origin_city":
        completedOptionalPatch.origin_city = "";
        break;
      default:
        break;
    }

    const finalizedDraft = await updateDraft(ctx, draft.id, completedOptionalPatch);
    if (!finalizedDraft) {
      return "I couldn't finalize this draft yet. Please try again.";
    }

    return finalizeDraft(ctx, finalizedDraft);
  }

  const patch: Record<string, unknown> = {
    status: "draft",
  };
  const nextCollected = { ...draft.collectedFields };

  switch (step.id) {
    case "client_identity": {
      const parsed = parseClientIdentity(trimmed);
      if (!parsed) {
        return 'I need at least the client name here. Reply with the name, and add a phone number if you have it. Or reply "skip for later".';
      }
      patch.client_name = parsed.clientName;
      patch.client_phone = parsed.clientPhone;
      nextCollected.client_name = parsed.clientName;
      if (parsed.clientPhone) {
        nextCollected.client_phone = parsed.clientPhone;
      }
      break;
    }
    case "traveler_count": {
      const parsed = parsePositiveInteger(trimmed, 50);
      if (!parsed) {
        return "Please send a valid traveler count, for example `2` or `4 travelers`.";
      }
      patch.traveler_count = parsed;
      nextCollected.traveler_count = parsed;
      break;
    }
    case "travel_window": {
      if (!draft.durationDays) {
        return "The trip duration is missing from this draft. Start a new request like `5 day trip to Bali`.";
      }
      const resolved = resolveTravelWindow(trimmed, draft.durationDays);
      if (!resolved) {
        return "I couldn't turn that into usable trip dates. Try something like `2026-06-10 to 2026-06-14`, `12/06/2026 to 16/06/2026`, `June 2026`, or `next month`.";
      }
      patch.travel_window = resolved.displayValue;
      patch.start_date = resolved.startDate;
      patch.end_date = resolved.endDate;
      nextCollected.travel_window = resolved.displayValue;
      nextCollected.start_date = resolved.startDate;
      nextCollected.end_date = resolved.endDate;
      break;
    }
    case "budget": {
      if (/^skip$/i.test(trimmed)) {
        patch.budget = "";
        nextCollected.budget = "";
      } else {
        const budget = trimOrNull(trimmed, 160);
        if (!budget) {
          return 'Reply with the budget note, or type "skip".';
        }
        patch.budget = budget;
        nextCollected.budget = budget;
      }
      break;
    }
    case "hotel_preference": {
      if (/^skip$/i.test(trimmed)) {
        patch.hotel_preference = "";
        nextCollected.hotel_preference = "";
      } else {
        const hotelPreference = trimOrNull(trimmed, 160);
        if (!hotelPreference) {
          return 'Reply with the hotel preference, or type "skip".';
        }
        patch.hotel_preference = hotelPreference;
        nextCollected.hotel_preference = hotelPreference;
      }
      break;
    }
    case "interests": {
      if (/^skip$/i.test(trimmed)) {
        patch.interests = [] as string[];
        nextCollected.interests = [];
      } else {
        const interests = parseInterests(trimmed);
        if (interests.length === 0) {
          return 'Reply with interests like `beaches, temples, nightlife`, or type "skip".';
        }
        patch.interests = [...interests];
        nextCollected.interests = [...interests];
      }
      break;
    }
    case "origin_city": {
      if (/^skip$/i.test(trimmed)) {
        patch.origin_city = "";
        nextCollected.origin_city = "";
      } else {
        const originCity = trimOrNull(trimmed, 160);
        if (!originCity) {
          return 'Reply with the origin city or airport, or type "skip".';
        }
        patch.origin_city = originCity;
        nextCollected.origin_city = originCity;
      }
      break;
    }
    default:
      return "I couldn't process that trip draft step.";
  }

  const baseDraft = {
    destination: draft.destination,
    durationDays: draft.durationDays,
    clientName: (patch.client_name as string | undefined) ?? draft.clientName,
    travelerCount: (patch.traveler_count as number | undefined) ?? draft.travelerCount,
    travelWindow: (patch.travel_window as string | undefined) ?? draft.travelWindow,
  };

  patch.collected_fields = nextCollected as unknown as Json;
  patch.request_summary = summarizeDraft(baseDraft);
  patch.missing_required_fields = computeMissingRequiredFields(baseDraft) as unknown as Json;

  const advancedDraft = mapDraft({
    id: draft.id,
    organization_id: ctx.organizationId,
    operator_user_id: ctx.userId,
    client_id: null,
    source_channel: ctx.channel,
    status: "draft",
    request_summary: patch.request_summary as string | null,
    destination: draft.destination,
    duration_days: draft.durationDays,
    client_name: (patch.client_name as string | null | undefined) ?? draft.clientName,
    client_phone: (patch.client_phone as string | null | undefined) ?? draft.clientPhone,
    traveler_count: (patch.traveler_count as number | null | undefined) ?? draft.travelerCount,
    travel_window: (patch.travel_window as string | null | undefined) ?? draft.travelWindow,
    start_date: (patch.start_date as string | null | undefined) ?? draft.startDate,
    end_date: (patch.end_date as string | null | undefined) ?? draft.endDate,
    budget: (patch.budget as string | null | undefined) ?? draft.budget,
    hotel_preference: (patch.hotel_preference as string | null | undefined) ?? draft.hotelPreference,
    interests: (patch.interests as string[] | null | undefined) ?? [...draft.interests],
    origin_city: (patch.origin_city as string | null | undefined) ?? draft.originCity,
    current_step: null,
    collected_fields: patch.collected_fields as Json,
    missing_required_fields: patch.missing_required_fields as Json,
    created_trip_id: draft.createdTripId,
    created_itinerary_id: draft.createdItineraryId,
    created_share_url: draft.createdShareUrl,
    created_at: draft.updatedAt,
    updated_at: draft.updatedAt,
  });

  const nextStepId = getNextStepId(advancedDraft);
  patch.current_step = nextStepId;
  if (!nextStepId) {
    patch.status = "ready_to_create";
  }

  const updatedDraft = await updateDraft(ctx, draft.id, patch);
  if (!updatedDraft) {
    return "I couldn't save that answer. Please try again.";
  }

  if (updatedDraft.status === "ready_to_create" || !updatedDraft.currentStep) {
    return finalizeDraft(ctx, updatedDraft);
  }

  await setActiveState(ctx, updatedDraft.id);
  const nextStep = getCurrentStep(updatedDraft);
  if (!nextStep) {
    return finalizeDraft(ctx, updatedDraft);
  }

  return `Saved.\n\n${buildStepPrompt(nextStep)}`;
}

export async function handleTripIntakeMessage(
  ctx: ActionContext,
  message: string,
): Promise<string | null> {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const tripSeed = extractTripSeed(trimmed);
  if (tripSeed) {
    const newDraft = await createDraft(ctx, tripSeed);
    if (!newDraft) {
      return "I couldn't start that trip request right now. Please try again.";
    }

    await setActiveState(ctx, newDraft.id);
    const nextStep = getCurrentStep(newDraft);
    if (!nextStep) {
      return finalizeDraft(ctx, newDraft);
    }

    return [
      `Started a new trip request for *${tripSeed.destination}* for *${tripSeed.durationDays} days*.`,
      "",
      buildStepPrompt(nextStep),
    ].join("\n");
  }

  const activeDrafts = await listActiveDrafts(ctx);
  if (activeDrafts.length === 0) {
    return null;
  }

  if (isResumeCommand(trimmed)) {
    if (activeDrafts.length === 1) {
      return resumeReplyForDraft(ctx, activeDrafts[0]);
    }
    await clearActiveState(ctx);
    return buildDraftChooserReply(activeDrafts);
  }

  const selectedDraft = await pickActiveDraft(ctx, trimmed);
  if (!selectedDraft) {
    if (activeDrafts.length > 1) {
      return buildDraftChooserReply(activeDrafts);
    }
    return resumeReplyForDraft(ctx, activeDrafts[0]);
  }

  if (activeDrafts.length > 1 && /^\d+$/.test(trimmed)) {
    return resumeReplyForDraft(ctx, selectedDraft);
  }

  return applyStepAnswer(ctx, selectedDraft, trimmed);
}
