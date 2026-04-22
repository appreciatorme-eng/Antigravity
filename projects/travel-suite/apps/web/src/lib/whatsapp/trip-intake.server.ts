import "server-only";

import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/database.types";
import { deleteCachedByPrefix, getCachedJson, setCachedJson } from "@/lib/cache/upstash";
import { logError, logEvent } from "@/lib/observability/logger";
import type { ActionContext } from "@/lib/assistant/types";
import { parseLooseDateRange } from "@/lib/whatsapp/proposal-drafts.server";
import { guardedSendMedia, guardedSendText } from "@/lib/whatsapp-evolution.server";
import { buildFallbackItinerary, generateItineraryForActor } from "@/lib/itinerary/generate-shared";
import type { ItineraryResult } from "@/types/itinerary";

type TripRequestStatus = "draft" | "ready_to_create" | "completed" | "cancelled";

type TripRequestStepId =
  | "client_identity"
  | "traveler_count"
  | "travel_window"
  | "budget"
  | "hotel_preference"
  | "interests"
  | "origin_city"
  | "finalizing";

type TripRequestRow = {
  id: string;
  organization_id: string;
  operator_user_id: string;
  client_id: string | null;
  source_channel: string;
  status: TripRequestStatus;
  request_summary: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  submitter_role: string | null;
  destination: string | null;
  duration_days: number | null;
  client_name: string | null;
  client_email: string | null;
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
  form_token: string | null;
  created_at: string;
  updated_at: string;
};

type TripRequestInsert = Database["public"]["Tables"]["assistant_trip_requests"]["Insert"];
type InsertedDraftRow = Record<string, unknown> & {
  id: string;
  form_token?: string | null;
  client_name?: string | null;
};

type DraftInsertResult = {
  readonly row: InsertedDraftRow | null;
  readonly error: unknown | null;
  readonly legacyFormTokenFallback: boolean;
};

type TripRequestDraft = {
  id: string;
  status: TripRequestStatus;
  requestSummary: string | null;
  destination: string | null;
  durationDays: number | null;
  clientName: string | null;
  clientEmail: string | null;
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
  formToken: string;
  updatedAt: string;
};

export type TripRequestFormState = {
  readonly token: string;
  readonly statusUrl: string;
  readonly status: TripRequestStatus;
  readonly organizationName: string;
  readonly organizationLogoUrl: string | null;
  readonly organizationPrimaryColor: string | null;
  readonly organizationRegionLine: string | null;
  readonly organizationDescription: string | null;
  readonly organizationAddress: string | null;
  readonly organizationContactPhone: string | null;
  readonly organizationContactEmail: string | null;
  readonly organizationOfficeHours: string | null;
  readonly organizationServiceBullets: readonly string[];
  readonly destination: string;
  readonly durationDays: number | null;
  readonly clientName: string;
  readonly clientEmail: string;
  readonly clientPhone: string;
  readonly travelerCount: number | null;
  readonly startDate: string;
  readonly endDate: string;
  readonly budget: string;
  readonly hotelPreference: string;
  readonly interests: string;
  readonly originCity: string;
  readonly shareUrl: string | null;
  readonly pdfUrl: string | null;
};

export type OperatorTripRequestStage =
  | "draft"
  | "submitted"
  | "processing"
  | "completed"
  | "cancelled";

export type OperatorTripRequestActionHistoryEntry = {
  readonly action:
    | "saved"
    | "retry_request"
    | "regenerate_itinerary"
    | "resend_operator"
    | "resend_client"
    | "completion_delivered";
  readonly title: string;
  readonly description: string;
  readonly occurredAt: string;
  readonly tone: "success" | "info" | "error";
};

export type OperatorTripRequestListItem = {
  readonly id: string;
  readonly formToken: string;
  readonly formUrl: string;
  readonly requestSummary: string | null;
  readonly stage: OperatorTripRequestStage;
  readonly stageLabel: string;
  readonly attentionReason: string | null;
  readonly status: TripRequestStatus;
  readonly currentStep: TripRequestStepId | null;
  readonly sourceChannel: string;
  readonly submitterRole: string | null;
  readonly submittedAt: string | null;
  readonly updatedAt: string;
  readonly destination: string | null;
  readonly durationDays: number | null;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly clientName: string | null;
  readonly clientEmail: string | null;
  readonly clientPhone: string | null;
  readonly travelerCount: number | null;
  readonly travelWindow: string | null;
  readonly budget: string | null;
  readonly hotelPreference: string | null;
  readonly interests: readonly string[];
  readonly originCity: string | null;
  readonly createdTripId: string | null;
  readonly createdItineraryId: string | null;
  readonly createdShareUrl: string | null;
  readonly pdfUrl: string | null;
  readonly operatorNotified: boolean;
  readonly clientNotified: boolean;
  readonly completionDeliveredAt: string | null;
  readonly lastOperatorResentAt: string | null;
  readonly lastClientResentAt: string | null;
  readonly lastItineraryRegeneratedAt: string | null;
  readonly generationError: string | null;
  readonly operatorDeliveryError: string | null;
  readonly clientDeliveryError: string | null;
  readonly actionHistory: readonly OperatorTripRequestActionHistoryEntry[];
};

type TripRequestOrganizationRow = {
  name: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  billing_address_line1?: string | null;
  billing_address_line2?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_pincode?: string | null;
  billing_address?: unknown;
  whatsapp_welcome_config?: unknown;
};

export type TripRequestSubmitterRole = "operator" | "client" | "other";

export type FirstContactTripRequestDraft = {
  readonly id: string;
  readonly formToken: string;
  readonly formUrl: string;
};

export type OperatorShareableTripRequestDraft = {
  readonly id: string;
  readonly formToken: string;
  readonly formUrl: string;
  readonly clientName: string | null;
};

export type TripRequestCustomerDraft = Pick<
  TripRequestDraft,
  | "id"
  | "status"
  | "clientName"
  | "clientPhone"
  | "createdShareUrl"
  | "formToken"
  | "updatedAt"
>;

export type OperatorShareableTripRequestDraftFailureCode =
  | "schema_missing"
  | "invalid_operator_user"
  | "database_unavailable"
  | "unknown";

export type OperatorShareableTripRequestDraftResult =
  | {
      readonly ok: true;
      readonly draft: OperatorShareableTripRequestDraft;
    }
  | {
      readonly ok: false;
      readonly code: OperatorShareableTripRequestDraftFailureCode;
      readonly operatorMessage: string;
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

type TripRequestDeliveryArtifactId =
  | "assistant_text"
  | "assistant_pdf"
  | "client_text"
  | "client_pdf";

type TripRequestDeliveryArtifactState = {
  readonly claimedAt?: string;
  readonly deliveredAt?: string;
  readonly error?: string | null;
};

type ParsedClientIdentity = {
  clientName: string;
  clientPhone: string | null;
};

const ACTIVE_DRAFT_STATUSES = ["draft", "ready_to_create"] as const;
const ACTIVE_STATE_KEY_PREFIX = "assistant:trip-intake";
const ACTIVE_STATE_TTL_SECONDS = 60 * 60 * 24;
const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://tripbuilt.com").replace(/\/+$/, "");

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

function readCollectedFieldRecord(
  value: unknown,
): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readTripRequestDeliveryArtifacts(
  draft: TripRequestDraft,
): Readonly<Record<TripRequestDeliveryArtifactId, TripRequestDeliveryArtifactState>> {
  const system = readCollectedFieldRecord(draft.collectedFields.__system);
  const rawArtifacts = readCollectedFieldRecord(system.deliveryArtifacts);
  const readArtifact = (id: TripRequestDeliveryArtifactId): TripRequestDeliveryArtifactState => {
    const raw = readCollectedFieldRecord(rawArtifacts[id]);
    return {
      claimedAt: typeof raw.claimedAt === "string" && raw.claimedAt.trim() ? raw.claimedAt : undefined,
      deliveredAt: typeof raw.deliveredAt === "string" && raw.deliveredAt.trim() ? raw.deliveredAt : undefined,
      error: typeof raw.error === "string" && raw.error.trim() ? raw.error : null,
    };
  };

  return {
    assistant_text: readArtifact("assistant_text"),
    assistant_pdf: readArtifact("assistant_pdf"),
    client_text: readArtifact("client_text"),
    client_pdf: readArtifact("client_pdf"),
  };
}

function getCompletionDeliveryMetadata(
  draft: TripRequestDraft,
): {
  readonly completionDeliveredAt: string | null;
  readonly completionDeliveredToAssistantGroup: boolean;
  readonly completionDeliveredToClient: boolean;
  readonly lastOperatorResentAt: string | null;
  readonly lastClientResentAt: string | null;
  readonly lastItineraryRegeneratedAt: string | null;
  readonly generationError: string | null;
  readonly operatorDeliveryError: string | null;
  readonly clientDeliveryError: string | null;
  readonly deliveryArtifacts: Readonly<Record<TripRequestDeliveryArtifactId, TripRequestDeliveryArtifactState>>;
  readonly actionHistory: readonly OperatorTripRequestActionHistoryEntry[];
} {
  const system = readCollectedFieldRecord(draft.collectedFields.__system);
  const deliveryArtifacts = readTripRequestDeliveryArtifacts(draft);
  const readString = (key: string) =>
    typeof system[key] === "string" && system[key].trim().length > 0
      ? system[key] as string
      : null;
  const actionHistory = Array.isArray(system.actionHistory)
    ? system.actionHistory
      .map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          return null;
        }
        const value = entry as Record<string, unknown>;
        const action =
          typeof value.action === "string"
          && [
            "saved",
            "retry_request",
            "regenerate_itinerary",
            "resend_operator",
            "resend_client",
            "completion_delivered",
          ].includes(value.action)
            ? value.action as OperatorTripRequestActionHistoryEntry["action"]
            : null;
        const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : null;
        const description = typeof value.description === "string" && value.description.trim()
          ? value.description.trim()
          : null;
        const occurredAt = typeof value.occurredAt === "string" && value.occurredAt.trim()
          ? value.occurredAt.trim()
          : null;
        const tone = value.tone === "info"
          ? "info"
          : value.tone === "error"
            ? "error"
            : "success";

        if (!action || !title || !description || !occurredAt) {
          return null;
        }

        return {
          action,
          title,
          description,
          occurredAt,
          tone,
        } satisfies OperatorTripRequestActionHistoryEntry;
      })
      .filter((entry): entry is OperatorTripRequestActionHistoryEntry => Boolean(entry))
      .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
      .slice(0, 8)
    : [];

  return {
    completionDeliveredAt: readString("completionDeliveredAt"),
    completionDeliveredToAssistantGroup:
      system.completionDeliveredToAssistantGroup === true
      || Boolean(deliveryArtifacts.assistant_text.deliveredAt && deliveryArtifacts.assistant_pdf.deliveredAt),
    completionDeliveredToClient:
      system.completionDeliveredToClient === true
      || Boolean(deliveryArtifacts.client_text.deliveredAt && deliveryArtifacts.client_pdf.deliveredAt),
    lastOperatorResentAt: readString("lastOperatorResentAt"),
    lastClientResentAt: readString("lastClientResentAt"),
    lastItineraryRegeneratedAt: readString("lastItineraryRegeneratedAt"),
    generationError: readString("generationError"),
    operatorDeliveryError: readString("operatorDeliveryError"),
    clientDeliveryError: readString("clientDeliveryError"),
    deliveryArtifacts,
    actionHistory,
  };
}

function appendTripRequestActionHistory(
  draft: TripRequestDraft,
  entry: Omit<OperatorTripRequestActionHistoryEntry, "occurredAt"> & { occurredAt?: string },
): Readonly<Record<string, unknown>> {
  const metadata = getCompletionDeliveryMetadata(draft);
  const nextEntry: OperatorTripRequestActionHistoryEntry = {
    ...entry,
    occurredAt: entry.occurredAt ?? new Date().toISOString(),
  };

  return mergeCompletionDeliveryMetadata(draft, {
    actionHistory: [nextEntry, ...metadata.actionHistory].slice(0, 8),
  });
}

function appendTripRequestActionHistoryEntries(
  draft: TripRequestDraft,
  entries: ReadonlyArray<Omit<OperatorTripRequestActionHistoryEntry, "occurredAt"> & { occurredAt?: string }>,
): Readonly<Record<string, unknown>> {
  const metadata = getCompletionDeliveryMetadata(draft);
  const nextEntries = entries.map((entry) => ({
    ...entry,
    occurredAt: entry.occurredAt ?? new Date().toISOString(),
  })) satisfies OperatorTripRequestActionHistoryEntry[];

  return mergeCompletionDeliveryMetadata(draft, {
    actionHistory: [...nextEntries, ...metadata.actionHistory].slice(0, 8),
  });
}

function mergeCompletionDeliveryMetadata(
  draft: TripRequestDraft,
  metadata: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const current = { ...draft.collectedFields };
  const system = readCollectedFieldRecord(current.__system);
  return {
    ...current,
    __system: {
      ...system,
      ...metadata,
    },
  };
}

function mergeDeliveryArtifactState(
  draft: TripRequestDraft,
  artifactId: TripRequestDeliveryArtifactId,
  patch: TripRequestDeliveryArtifactState,
): Readonly<Record<string, unknown>> {
  const current = { ...draft.collectedFields };
  const system = readCollectedFieldRecord(current.__system);
  const deliveryArtifacts = readCollectedFieldRecord(system.deliveryArtifacts);
  const currentArtifact = readCollectedFieldRecord(deliveryArtifacts[artifactId]);

  return {
    ...current,
    __system: {
      ...system,
      deliveryArtifacts: {
        ...deliveryArtifacts,
        [artifactId]: {
          ...currentArtifact,
          ...patch,
        },
      },
    },
  };
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
    clientEmail: row.client_email,
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
    formToken: row.form_token ?? row.id,
    updatedAt: row.updated_at,
  };
}

export function buildTripRequestFormUrl(formToken: string): string {
  return `${APP_BASE_URL}/trip-request/${formToken}`;
}

export function buildTripRequestStatusUrl(formToken: string): string {
  return `${APP_BASE_URL}/trip-request/status/${formToken}`;
}

export function buildTripRequestPdfUrl(formToken: string): string {
  return `${APP_BASE_URL}/api/trip-request/${formToken}/pdf`;
}

function toTripRequestFormState(draft: TripRequestDraft): TripRequestFormState {
  return {
    token: draft.formToken,
    statusUrl: buildTripRequestStatusUrl(draft.formToken),
    status: draft.status,
    organizationName: "TripBuilt",
    organizationLogoUrl: null,
    organizationPrimaryColor: null,
    organizationRegionLine: null,
    organizationDescription: null,
    organizationAddress: null,
    organizationContactPhone: null,
    organizationContactEmail: null,
    organizationOfficeHours: null,
    organizationServiceBullets: [],
    destination: draft.destination ?? "",
    durationDays: draft.durationDays,
    clientName: draft.clientName ?? "",
    clientEmail: draft.clientEmail ?? "",
    clientPhone: draft.clientPhone ?? "",
    travelerCount: draft.travelerCount,
    startDate: draft.startDate ?? "",
    endDate: draft.endDate ?? "",
    budget: draft.budget ?? "",
    hotelPreference: draft.hotelPreference ?? "",
    interests: draft.interests.join(", "),
    originCity: draft.originCity ?? "",
    shareUrl: draft.createdShareUrl,
    pdfUrl: draft.createdItineraryId ? buildTripRequestPdfUrl(draft.formToken) : null,
  };
}

function getBillingAddressValue(input: unknown, key: string): string | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeServiceBullets(input: unknown): readonly string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => trimOrNull(typeof entry === "string" ? entry : null, 120))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 6);
}

function joinAddressParts(parts: Array<string | null | undefined>, maxLength = 240): string | null {
  const value = parts
    .map((part) => trimOrNull(part ?? null, 120))
    .filter((part): part is string => Boolean(part))
    .join(", ");
  return trimOrNull(value, maxLength);
}

function extractOrganizationBranding(row: TripRequestOrganizationRow | null): Pick<
  TripRequestFormState,
  | "organizationName"
  | "organizationLogoUrl"
  | "organizationPrimaryColor"
  | "organizationRegionLine"
  | "organizationDescription"
  | "organizationAddress"
  | "organizationContactPhone"
  | "organizationContactEmail"
  | "organizationOfficeHours"
  | "organizationServiceBullets"
> {
  const config =
    row?.whatsapp_welcome_config && typeof row.whatsapp_welcome_config === "object"
      ? (row.whatsapp_welcome_config as Record<string, unknown>)
      : null;

  const organizationName = trimOrNull(row?.name, 160) ?? "TripBuilt";
  const regionLine =
    trimOrNull(typeof config?.region_line === "string" ? config.region_line : null, 160)
    ?? trimOrNull(
      [trimOrNull(row?.billing_city, 80), trimOrNull(row?.billing_state, 80)]
        .filter((value): value is string => Boolean(value))
        .join(", "),
      160,
    );
  const contactPhone =
    trimOrNull(typeof config?.contact_phone === "string" ? config.contact_phone : null, 40)
    ?? getBillingAddressValue(row?.billing_address, "phone");
  const contactEmail =
    trimOrNull(getBillingAddressValue(row?.billing_address, "email"), 160);
  const addressLine1 =
    getBillingAddressValue(row?.billing_address, "line1") ?? trimOrNull(row?.billing_address_line1, 120);
  const addressLine2 =
    getBillingAddressValue(row?.billing_address, "line2") ?? trimOrNull(row?.billing_address_line2, 120);
  const billingCity =
    getBillingAddressValue(row?.billing_address, "city") ?? trimOrNull(row?.billing_city, 80);
  const billingState =
    getBillingAddressValue(row?.billing_address, "state") ?? trimOrNull(row?.billing_state, 80);
  const billingPostalCode =
    getBillingAddressValue(row?.billing_address, "postal_code") ?? trimOrNull(row?.billing_pincode, 40);
  const organizationAddress = joinAddressParts([
    addressLine1,
    addressLine2,
    joinAddressParts([billingCity, billingState, billingPostalCode], 160),
  ]);

  return {
    organizationName,
    organizationLogoUrl: trimOrNull(row?.logo_url, 2048),
    organizationPrimaryColor: trimOrNull(row?.primary_color, 40),
    organizationRegionLine: regionLine,
    organizationDescription:
      trimOrNull(
        typeof config?.company_description === "string" ? config.company_description : null,
        280,
      ) ?? `Share your travel preferences with ${organizationName} and receive a tailored trip link.`,
    organizationAddress,
    organizationContactPhone: contactPhone,
    organizationContactEmail: contactEmail,
    organizationOfficeHours: trimOrNull(
      typeof config?.office_hours === "string" ? config.office_hours : null,
      120,
    ),
    organizationServiceBullets: normalizeServiceBullets(config?.service_bullets),
  };
}

export async function loadTripRequestOrganizationBranding(
  organizationId: string,
): Promise<ReturnType<typeof extractOrganizationBranding>> {
  const admin = createAdminClient();
  const select = [
    "name",
    "logo_url",
    "primary_color",
    "billing_address_line1",
    "billing_address_line2",
    "billing_city",
    "billing_state",
    "billing_pincode",
    "billing_address",
    "whatsapp_welcome_config",
  ].join(", ");

  let result = await admin
    .from("organizations")
    .select(select)
    .eq("id", organizationId)
    .maybeSingle();

  if (
    result.error &&
    `${result.error.message ?? ""} ${result.error.details ?? ""}`.toLowerCase().includes("whatsapp_welcome_config")
  ) {
    result = await admin
      .from("organizations")
      .select("name, logo_url, primary_color, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_pincode, billing_address")
      .eq("id", organizationId)
      .maybeSingle();
  }

  if (result.error || !result.data) {
    return extractOrganizationBranding(null);
  }

  return extractOrganizationBranding(result.data as unknown as TripRequestOrganizationRow);
}

export async function loadTripRequestBusinessBranding(args: {
  organizationId: string;
  operatorUserId?: string | null;
}): Promise<ReturnType<typeof extractOrganizationBranding>> {
  const branding = await loadTripRequestOrganizationBranding(args.organizationId);
  if (branding.organizationContactPhone || branding.organizationContactEmail || !args.operatorUserId) {
    return branding;
  }

  const admin = createAdminClient();
  const { data: operatorProfile } = await admin
    .from("profiles")
    .select("email, phone")
    .eq("id", args.operatorUserId)
    .maybeSingle();

  return {
    ...branding,
    organizationContactPhone: branding.organizationContactPhone ?? trimOrNull(operatorProfile?.phone ?? null, 40),
    organizationContactEmail: branding.organizationContactEmail ?? trimOrNull(operatorProfile?.email ?? null, 160),
  };
}

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = trimOrNull(value, 200)?.toLowerCase() ?? null;
  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function buildFallbackClientEmail(ctx: ActionContext, draft: TripRequestDraft): string {
  const phoneDigits = normalizePhoneDigits(draft.clientPhone) ?? "guest";
  const orgFragment = ctx.organizationId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase() || "org";
  const draftFragment = draft.id.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase() || "trip";
  return `traveler-${orgFragment}-${phoneDigits}-${draftFragment}@tripbuilt.local`;
}

function readErrorText(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const candidate = error as { message?: unknown; details?: unknown; hint?: unknown };
  return [candidate.message, candidate.details, candidate.hint]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

function isMissingFormTokenColumnError(error: unknown): boolean {
  const text = readErrorText(error);
  return text.includes("form_token") && (text.includes("column") || text.includes("schema cache"));
}

function isMissingTripRequestSchemaError(error: unknown): boolean {
  const text = readErrorText(error);
  const hasSchemaShapeError =
    text.includes("column")
    || text.includes("relation")
    || text.includes("schema cache")
    || text.includes("does not exist");

  const referencesTripRequestTable = text.includes("assistant_trip_requests");
  const referencesKnownTripRequestColumns = [
    "form_token",
    "submitted_by",
    "submitter_role",
    "submitted_at",
    "current_step",
    "collected_fields",
    "missing_required_fields",
    "client_email",
    "created_share_url",
    "created_itinerary_id",
  ].some((column) => text.includes(column));

  return hasSchemaShapeError && (referencesTripRequestTable || referencesKnownTripRequestColumns);
}

function isInvalidOperatorUserError(error: unknown): boolean {
  const text = readErrorText(error);
  return (
    text.includes("operator_user_id")
    && (text.includes("foreign key") || text.includes("violates"))
  );
}

function isDatabaseUnavailableError(error: unknown): boolean {
  const text = readErrorText(error);
  return (
    text.includes("timeout")
    || text.includes("connection")
    || text.includes("temporarily unavailable")
    || text.includes("could not connect")
    || text.includes("fetch failed")
    || text.includes("network")
  );
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function resolvePublicTripRequestToken(row: { id: string; form_token?: string | null }): string {
  return trimOrNull(row.form_token, 200) ?? row.id;
}

async function insertDraftWithPublicToken(
  admin: ReturnType<typeof createAdminClient>,
  payload: TripRequestInsert,
  selectClause: string,
  logMessage: string,
  logContext: Record<string, unknown>,
): Promise<DraftInsertResult> {
  const { data, error } = await admin
    .from("assistant_trip_requests")
    .insert(payload)
    .select(selectClause)
    .single();

  if (!error && data && typeof (data as { id?: unknown }).id === "string") {
    return {
      row: data as unknown as InsertedDraftRow,
      error: null,
      legacyFormTokenFallback: false,
    };
  }

  if (!isMissingFormTokenColumnError(error)) {
    logError(logMessage, error, logContext);
    return {
      row: null,
      error,
      legacyFormTokenFallback: false,
    };
  }

  const legacyPayload = { ...payload };
  delete legacyPayload.form_token;
  const legacySelectClause = selectClause
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment !== "form_token")
    .join(", ");

  const { data: legacyData, error: legacyError } = await admin
    .from("assistant_trip_requests")
    .insert(legacyPayload as TripRequestInsert)
    .select(legacySelectClause)
    .single();

  if (
    legacyError
    || !legacyData
    || typeof (legacyData as { id?: unknown }).id !== "string"
  ) {
    logError(logMessage, legacyError ?? error, {
      ...logContext,
      legacyFormTokenFallback: true,
    });
    return {
      row: null,
      error: legacyError ?? error,
      legacyFormTokenFallback: true,
    };
  }

  return {
    row: {
      ...(legacyData as unknown as Record<string, unknown>),
      form_token: null,
    } as InsertedDraftRow,
    error,
    legacyFormTokenFallback: true,
  };
}

function classifyOperatorShareableDraftFailure(
  error: unknown,
): OperatorShareableTripRequestDraftResult {
  if (isMissingTripRequestSchemaError(error)) {
    return {
      ok: false,
      code: "schema_missing",
      operatorMessage: "I couldn't create the trip request link because the trip intake form setup is incomplete. Apply the latest trip-intake database migrations, then try again.",
    };
  }

  if (isInvalidOperatorUserError(error)) {
    return {
      ok: false,
      code: "invalid_operator_user",
      operatorMessage: "I couldn't create the trip request link because this WhatsApp assistant is not linked to a valid TripBuilt operator yet. Reconnect WhatsApp or fix the owner user mapping, then try again.",
    };
  }

  if (isDatabaseUnavailableError(error)) {
    return {
      ok: false,
      code: "database_unavailable",
      operatorMessage: "I couldn't create the trip request link because TripBuilt couldn't reach the database right now. Try again in a minute.",
    };
  }

  return {
    ok: false,
    code: "unknown",
    operatorMessage: "I couldn't create the trip request link because the intake draft could not be saved. Check the TripBuilt logs for the exact database error, then try again.",
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

function buildDayDate(startDate: string | null, dayIndex: number): string | undefined {
  if (!startDate) return undefined;
  return addUtcDays(startDate, dayIndex);
}

function buildBudgetPositioning(budget: string | null): string {
  const lowered = (budget || "").toLowerCase();
  if (lowered.includes("luxury") || lowered.includes("premium")) {
    return "prioritize polished experiences, premium logistics, and well-timed downtime";
  }
  if (lowered.includes("budget")) {
    return "keep the plan efficient, practical, and strong on value without feeling rushed";
  }
  if (lowered.includes("ultra")) {
    return "lean into signature stays, high-touch pacing, and elevated local experiences";
  }
  return "balance local highlights, comfort, and enough breathing room through the day";
}

function buildInterestFocus(interests: readonly string[]): string {
  if (interests.length === 0) return "city highlights, local flavor, and easy-flow exploration";
  if (interests.length === 1) return interests[0]!;
  if (interests.length === 2) return `${interests[0]} and ${interests[1]}`;
  return `${interests.slice(0, -1).join(", ")}, and ${interests[interests.length - 1]}`;
}

function buildMealSuggestion(budget: string | null): string {
  const lowered = (budget || "").toLowerCase();
  if (lowered.includes("luxury") || lowered.includes("ultra")) {
    return "Reserve dinner at a polished venue with skyline or waterfront views.";
  }
  if (lowered.includes("budget")) {
    return "Keep dinner around reliable local favourites that are easy to reach and good on value.";
  }
  return "Leave room for a well-rated local dinner spot that matches the traveler’s pace.";
}

function buildDailySummary(
  dayNumber: number,
  durationDays: number,
  destination: string,
  interests: readonly string[],
  budget: string | null,
): string {
  const focus = buildInterestFocus(interests);
  if (dayNumber === 1) {
    return `Ease into ${destination} with a light arrival plan, smooth transfers, and enough room to settle before the first local experiences begin.`;
  }
  if (dayNumber === durationDays) {
    return `Wrap up ${destination} with a relaxed final stretch that protects checkout, shopping, and onward travel without making the day feel empty.`;
  }
  return `This day is shaped around ${focus} and is paced to ${buildBudgetPositioning(budget)}.`;
}

function buildStructuredDayActivities(
  draft: TripRequestDraft,
  dayIndex: number,
  durationDays: number,
  destination: string,
  interests: readonly string[],
) {
  const isArrivalDay = dayIndex === 0;
  const isDepartureDay = dayIndex === durationDays - 1;
  const focus = buildInterestFocus(interests);
  const destinationWithOrigin = draft.originCity
    ? `from ${draft.originCity} into ${destination}`
    : `into ${destination}`;

  return [
    {
      time: "Morning",
      title: isArrivalDay ? "Arrival and check-in" : isDepartureDay ? "Easy-paced morning" : `Signature morning in ${destination}`,
      description: isArrivalDay
        ? `Land ${destinationWithOrigin}, complete the hotel check-in flow, and keep the first stretch intentionally light so the traveler can refresh before stepping out. Build in buffer time for airport movement, hotel formalities, and a short orientation around the stay area.`
        : isDepartureDay
          ? `Use the morning for a relaxed breakfast, last nearby experiences, or a short café stop without overloading the final day. The idea is to keep the pace calm while still giving the traveler a worthwhile final memory of ${destination}.`
          : `Start the day with one of the strongest-fit experiences in ${destination}, shaped around ${focus}. Keep the first outing close to the core route so the traveler builds momentum without wasting time on long cross-city transfers.`,
      location: destination,
      duration: isArrivalDay ? "2-3 hrs" : "3-4 hrs",
      transport: isArrivalDay ? "Private transfer / hotel car" : "Short drive or metro hop",
      cost: draft.budget ? `${draft.budget} friendly` : "Flexible spend",
      type: isArrivalDay ? "transport" : "activity",
      tags: isArrivalDay ? ["arrival", "check-in"] : ["morning", "highlight"],
    },
    {
      time: "Afternoon",
      title: isDepartureDay ? "Last curated stop" : "Curated sightseeing",
      description: isDepartureDay
        ? `Keep the afternoon focused on one clean, high-confidence experience rather than stacking multiple stops. This gives enough time for last-minute shopping, photos, or a landmark visit while protecting packing and departure logistics.`
        : `Use the afternoon for a curated block of sightseeing and local discovery tied to ${focus}. Cluster experiences by area, allow for breaks between stops, and prefer neighborhoods that feel active and easy to navigate for a traveler seeing the city for the first time.`,
      location: destination,
      duration: "3-4 hrs",
      transport: "Clustered route with short transfers",
      cost: draft.budget ? `${draft.budget} activity mix` : "Flexible spend",
      type: "activity",
      tags: ["afternoon", "sightseeing", ...(interests.length > 0 ? interests.slice(0, 2) : ["local"])],
    },
    {
      time: "Evening",
      title: isDepartureDay ? "Departure prep" : "Dinner and downtime",
      description: isDepartureDay
        ? `Leave the evening open for packing, checkout readiness, and any final transit coordination. This buffer helps avoid avoidable stress and makes the onward journey feel organized rather than rushed.`
        : `${buildMealSuggestion(draft.budget)} After dinner, leave the rest of the evening flexible for a walk, an easy cultural stop, or time back at the hotel depending on how energetic the traveler feels.`,
      location: destination,
      duration: "2-3 hrs",
      transport: isDepartureDay ? "Hotel transfer coordination" : "Easy evening commute",
      cost: isDepartureDay ? "As per transfer plan" : draft.budget ? `${draft.budget} dining` : "Flexible spend",
      type: isDepartureDay ? "transport" : "meal",
      tags: isDepartureDay ? ["departure", "buffer"] : ["evening", "meal", "leisure"],
    },
  ];
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
    start_date: draft.startDate,
    end_date: draft.endDate,
    summary: notes.length > 0
      ? `A ${durationDays}-day trip plan for ${clientName} in ${destination}, shaped around ${buildInterestFocus(interests)} and built to ${buildBudgetPositioning(draft.budget)}. ${notes.join(" · ")}`
      : `A ${durationDays}-day trip plan for ${clientName} in ${destination}, designed to ${buildBudgetPositioning(draft.budget)}.`,
    budget: draft.budget,
    interests,
    hotel_preference: draft.hotelPreference,
    origin_city: draft.originCity,
    travel_window: draft.travelWindow,
    raw_data: {
      trip_title: `${destination} Trip for ${clientName}`,
      destination,
      duration_days: durationDays,
      start_date: draft.startDate,
      end_date: draft.endDate,
      summary: `This travel brief was prepared for ${clientName} as a structured first version of the trip. It gives the operator a usable route, better day pacing, and enough detail to review, personalize, and share confidently.`,
      budget: draft.budget,
      interests,
      hotel_preference: draft.hotelPreference,
      origin_city: draft.originCity,
      travel_window: draft.travelWindow,
      travelers: draft.travelerCount,
      created_via: "whatsapp_trip_intake",
      tips: [
        draft.originCity ? `Confirm the best arrival routing from ${draft.originCity} before sending this to the traveler.` : null,
        draft.hotelPreference ? `Keep the stay recommendation aligned with the requested hotel style: ${draft.hotelPreference}.` : null,
        interests.length > 0 ? `Prioritize these interests during revisions: ${buildInterestFocus(interests)}.` : null,
      ].filter((value): value is string => Boolean(value)),
      days: Array.from({ length: durationDays }, (_, index) => ({
        day_number: index + 1,
        date: buildDayDate(draft.startDate, index),
        theme: buildInterestAwareTheme(index + 1, interests),
        summary: buildDailySummary(index + 1, durationDays, destination, interests, draft.budget),
        activities: buildStructuredDayActivities(draft, index, durationDays, destination, interests),
      })),
    },
  };
}

function normalizeGeneratedItineraryForDraft(
  draft: TripRequestDraft,
  generated: unknown,
): ItineraryResult {
  const fallback = buildStructuredItinerary(draft);
  const raw = (generated && typeof generated === "object" ? generated : {}) as Partial<ItineraryResult>;
  const durationDays =
    (typeof raw.duration_days === "number" && Number.isFinite(raw.duration_days) ? raw.duration_days : null)
    ?? draft.durationDays
    ?? raw.days?.length
    ?? fallback.duration_days
    ?? 1;

  const daysSource = Array.isArray(raw.days) && raw.days.length > 0 ? raw.days : fallback.raw_data.days;
  const days = daysSource.map((day, index) => {
    const fallbackDay = fallback.raw_data.days[index] ?? fallback.raw_data.days[fallback.raw_data.days.length - 1];
    const value = (day && typeof day === "object" ? day : {}) as Record<string, unknown>;
    const activities = Array.isArray(value.activities) && value.activities.length > 0
      ? value.activities
      : fallbackDay.activities;

    return {
      ...fallbackDay,
      ...value,
      day_number:
        typeof value.day_number === "number" && Number.isFinite(value.day_number)
          ? value.day_number
          : index + 1,
      date: buildDayDate(draft.startDate, index) ?? fallbackDay.date,
      summary:
        typeof value.summary === "string" && value.summary.trim().length > 0
          ? value.summary
          : fallbackDay.summary,
      theme:
        typeof value.theme === "string" && value.theme.trim().length > 0
          ? value.theme
          : fallbackDay.theme,
      activities,
    };
  });

  return {
    ...fallback,
    ...(raw as ItineraryResult),
    trip_title:
      typeof raw.trip_title === "string" && raw.trip_title.trim().length > 0
        ? raw.trip_title
        : fallback.trip_title,
    destination:
      typeof raw.destination === "string" && raw.destination.trim().length > 0
        ? raw.destination
        : fallback.destination,
    duration_days: durationDays,
    start_date: draft.startDate ?? raw.start_date ?? fallback.start_date ?? undefined,
    end_date: draft.endDate ?? raw.end_date ?? fallback.end_date ?? undefined,
    summary:
      typeof raw.summary === "string" && raw.summary.trim().length > 0
        ? raw.summary
        : fallback.summary,
    budget: draft.budget ?? raw.budget ?? fallback.budget ?? undefined,
    interests: draft.interests.length > 0
      ? [...draft.interests]
      : [...(raw.interests ?? fallback.interests ?? [])],
    days,
  };
}

function buildPlannerPromptFromDraft(draft: TripRequestDraft): string {
  const parts = [
    `Create a ${draft.durationDays}-day travel itinerary for ${draft.destination}.`,
    `This trip is for ${draft.clientName}.`,
    `Traveler count: ${draft.travelerCount}.`,
    draft.travelWindow ? `Travel window: ${draft.travelWindow}.` : null,
    draft.budget ? `Budget style: ${draft.budget}.` : null,
    draft.hotelPreference ? `Hotel preference: ${draft.hotelPreference}.` : null,
    draft.originCity ? `Origin city or airport: ${draft.originCity}.` : null,
    draft.interests.length > 0
      ? `Primary interests: ${draft.interests.join(", ")}.`
      : "Primary interests: city highlights, local experiences, and well-paced sightseeing.",
    "Keep the route realistic, geographically efficient, and suitable for a client-ready shared itinerary.",
  ].filter((value): value is string => Boolean(value));

  return parts.join(" ");
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

async function getDraftByFormToken(
  formToken: string,
): Promise<TripRequestRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("assistant_trip_requests")
    .select("*")
    .eq("form_token", formToken)
    .maybeSingle();

  if (!error && data) {
    return data as TripRequestRow;
  }

  if (!isMissingFormTokenColumnError(error) && !isUuidLike(formToken)) {
    return null;
  }

  const { data: fallbackData, error: fallbackError } = await admin
    .from("assistant_trip_requests")
    .select("*")
    .eq("id", formToken)
    .maybeSingle();

  if (fallbackError || !fallbackData) {
    return null;
  }

  return fallbackData as TripRequestRow;
}

async function getDraftRowByOrganization(
  organizationId: string,
  draftId: string,
): Promise<TripRequestRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("assistant_trip_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", draftId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as TripRequestRow;
}

async function claimDraftFinalization(
  formToken: string,
): Promise<TripRequestRow | null> {
  const admin = createAdminClient();
  const tryClaimBy = async (column: "form_token" | "id", value: string) => {
    const { data, error } = await admin
      .from("assistant_trip_requests")
      .update({ current_step: "finalizing" })
      .eq(column, value)
      .eq("status", "ready_to_create")
      .is("current_step", null)
      .select("*")
      .maybeSingle();

    if (!error && data) {
      return data as TripRequestRow;
    }

    return null;
  };

  const claimed = await tryClaimBy("form_token", formToken);
  if (claimed) {
    return claimed;
  }

  if (isUuidLike(formToken)) {
    return tryClaimBy("id", formToken);
  }

  return null;
}

export async function findLatestTripRequestForPhone(
  organizationId: string,
  phone: string,
): Promise<TripRequestCustomerDraft | null> {
  const normalizedPhone = formatPhoneForStorage(phone);
  if (!normalizedPhone) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("assistant_trip_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("client_phone", normalizedPhone)
    .neq("status", "cancelled")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const draft = mapDraft(data as TripRequestRow);
  return {
    id: draft.id,
    status: draft.status,
    clientName: draft.clientName,
    clientPhone: draft.clientPhone,
    createdShareUrl: draft.createdShareUrl,
    formToken: draft.formToken,
    updatedAt: draft.updatedAt,
  };
}

export async function ensureFirstContactTripRequestDraft(args: {
  organizationId: string;
  operatorUserId: string;
  clientPhone: string;
  clientName?: string | null;
  initialMessage: string;
  sourceChannel: string;
}): Promise<FirstContactTripRequestDraft | null> {
  const admin = createAdminClient();
  const clientPhone = formatPhoneForStorage(args.clientPhone);
  if (!clientPhone) {
    return null;
  }

  const { data: existing, error: existingError } = await admin
    .from("assistant_trip_requests")
    .select("id, form_token")
    .eq("organization_id", args.organizationId)
    .eq("client_phone", clientPhone)
    .neq("status", "cancelled")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const publicToken = resolvePublicTripRequestToken(existing as { id: string; form_token?: string | null });
    return {
      id: existing.id,
      formToken: publicToken,
      formUrl: buildTripRequestFormUrl(publicToken),
    };
  }

  if (existingError && !isMissingFormTokenColumnError(existingError)) {
    logError("[trip-intake] failed to load existing first-contact draft", existingError, {
      organizationId: args.organizationId,
      operatorUserId: args.operatorUserId,
      clientPhone,
    });
  }

  const initialClientName = trimOrNull(args.clientName, 160);
  const missingRequiredFields = computeMissingRequiredFields({
    destination: null,
    durationDays: null,
    clientName: initialClientName,
    travelerCount: null,
    travelWindow: null,
  });
  const formToken = randomUUID().replace(/-/g, "");
  const created = await insertDraftWithPublicToken(
    admin,
    {
      organization_id: args.organizationId,
      operator_user_id: args.operatorUserId,
      source_channel: args.sourceChannel,
      status: "draft",
      form_token: formToken,
      request_summary: trimOrNull(args.initialMessage, 240),
      client_name: initialClientName,
      client_phone: clientPhone,
      current_step: null,
      collected_fields: {
        client_name: initialClientName ?? "",
        client_phone: clientPhone,
        initial_message: trimOrNull(args.initialMessage, 500) ?? "",
      } as unknown as Json,
      missing_required_fields: missingRequiredFields as unknown as Json,
    },
    "id, form_token",
    "[trip-intake] failed to create first-contact draft",
    {
      organizationId: args.organizationId,
      operatorUserId: args.operatorUserId,
      clientPhone,
    },
  );

  if (!created.row?.id) {
    return null;
  }

  const publicToken = resolvePublicTripRequestToken(created.row);

  return {
    id: created.row.id,
    formToken: publicToken,
    formUrl: buildTripRequestFormUrl(publicToken),
  };
}

export async function createOperatorShareableTripRequestDraft(args: {
  organizationId: string;
  operatorUserId: string;
  requestSummary?: string | null;
  clientName?: string | null;
}): Promise<OperatorShareableTripRequestDraftResult> {
  const admin = createAdminClient();
  const requestSummary = trimOrNull(args.requestSummary, 240);
  const clientName = trimOrNull(args.clientName, 160);
  const missingRequiredFields = computeMissingRequiredFields({
    destination: null,
    durationDays: null,
    clientName,
    travelerCount: null,
    travelWindow: null,
  });
  const formToken = randomUUID().replace(/-/g, "");

  const created = await insertDraftWithPublicToken(
    admin,
    {
      organization_id: args.organizationId,
      operator_user_id: args.operatorUserId,
      source_channel: "whatsapp_operator_shared_link",
      status: "draft",
      form_token: formToken,
      request_summary: requestSummary,
      client_name: clientName,
      current_step: null,
      collected_fields: {
        client_name: clientName ?? "",
        request_summary: requestSummary ?? "",
        created_from: "whatsapp_operator_shared_link",
      } as unknown as Json,
      missing_required_fields: missingRequiredFields as unknown as Json,
    },
    "id, form_token, client_name",
    "[trip-intake] failed to create operator shareable draft",
    {
      organizationId: args.organizationId,
      operatorUserId: args.operatorUserId,
    },
  );

  if (!created.row?.id) {
    return classifyOperatorShareableDraftFailure(created.error);
  }

  const publicToken = resolvePublicTripRequestToken(created.row);

  return {
    ok: true,
    draft: {
      id: created.row.id,
      formToken: publicToken,
      formUrl: buildTripRequestFormUrl(publicToken),
      clientName: typeof created.row.client_name === "string" ? created.row.client_name : null,
    },
  };
}

function getOperatorTripRequestStage(
  draft: TripRequestDraft,
  submittedAt: string | null,
): { stage: OperatorTripRequestStage; label: string; attentionReason: string | null } {
  if (draft.status === "completed") {
    return { stage: "completed", label: "Completed", attentionReason: null };
  }

  if (draft.status === "cancelled") {
    return { stage: "cancelled", label: "Cancelled", attentionReason: null };
  }

  if (draft.currentStep === "finalizing") {
    return { stage: "processing", label: "Generating", attentionReason: null };
  }

  if (draft.status === "ready_to_create") {
    return {
      stage: "submitted",
      label: "Submitted",
      attentionReason: submittedAt ? "Trip generation can be retried or resent from here." : null,
    };
  }

  if (submittedAt) {
    return {
      stage: "submitted",
      label: "Submitted",
      attentionReason: "The request was submitted but is still waiting for completion.",
    };
  }

  return {
    stage: "draft",
    label: "Draft",
    attentionReason: draft.missingRequiredFields.length > 0
      ? `Missing: ${draft.missingRequiredFields.join(", ")}`
      : null,
  };
}

function toOperatorTripRequestListItem(row: TripRequestRow): OperatorTripRequestListItem {
  const draft = mapDraft(row);
  const metadata = getCompletionDeliveryMetadata(draft);
  const stage = getOperatorTripRequestStage(draft, row.submitted_at);

  return {
    id: draft.id,
    formToken: draft.formToken,
    formUrl: buildTripRequestFormUrl(draft.formToken),
    requestSummary: draft.requestSummary,
    stage: stage.stage,
    stageLabel: stage.label,
    attentionReason: stage.attentionReason,
    status: draft.status,
    currentStep: draft.currentStep,
    sourceChannel: row.source_channel,
    submitterRole: row.submitter_role,
    submittedAt: row.submitted_at,
    updatedAt: draft.updatedAt,
    destination: draft.destination,
    durationDays: draft.durationDays,
    startDate: draft.startDate,
    endDate: draft.endDate,
    clientName: draft.clientName,
    clientEmail: draft.clientEmail,
    clientPhone: draft.clientPhone,
    travelerCount: draft.travelerCount,
    travelWindow: draft.travelWindow,
    budget: draft.budget,
    hotelPreference: draft.hotelPreference,
    interests: draft.interests,
    originCity: draft.originCity,
    createdTripId: draft.createdTripId,
    createdItineraryId: draft.createdItineraryId,
    createdShareUrl: draft.createdShareUrl,
    pdfUrl: draft.createdItineraryId ? buildTripRequestPdfUrl(draft.formToken) : null,
    operatorNotified: metadata.completionDeliveredToAssistantGroup,
    clientNotified: metadata.completionDeliveredToClient,
    completionDeliveredAt: metadata.completionDeliveredAt,
    lastOperatorResentAt: metadata.lastOperatorResentAt,
    lastClientResentAt: metadata.lastClientResentAt,
    lastItineraryRegeneratedAt: metadata.lastItineraryRegeneratedAt,
    generationError: metadata.generationError,
    operatorDeliveryError: metadata.operatorDeliveryError,
    clientDeliveryError: metadata.clientDeliveryError,
    actionHistory: metadata.actionHistory,
  };
}

export async function listOperatorTripRequestsForOrganization(
  organizationId: string,
  limit = 50,
): Promise<readonly OperatorTripRequestListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("assistant_trip_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .neq("status", "cancelled")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    logError("[trip-intake] failed to list operator trip requests", error, {
      organizationId,
      limit,
    });
    return [];
  }

  return ((data ?? []) as TripRequestRow[]).map(toOperatorTripRequestListItem);
}

export async function getOperatorTripRequestForOrganization(
  organizationId: string,
  draftId: string,
): Promise<OperatorTripRequestListItem | null> {
  const row = await getDraftRowByOrganization(organizationId, draftId);
  return row ? toOperatorTripRequestListItem(row) : null;
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

  const data = await insertDraftWithPublicToken(
    ctx.supabase,
    {
      organization_id: ctx.organizationId,
      operator_user_id: ctx.userId,
      source_channel: ctx.channel,
      status: "draft",
      form_token: randomUUID().replace(/-/g, ""),
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
    },
    "*",
    "[trip-intake] failed to create draft",
    {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
    },
  );

  if (!data.row) {
    return null;
  }

  return mapDraft(data.row as unknown as TripRequestRow);
}

async function updateDraft(
  ctx: ActionContext,
  draftId: string,
  patch: Record<string, unknown>,
): Promise<TripRequestDraft | null> {
  const nextPatch = {
    ...patch,
    updated_at: typeof patch.updated_at === "string" ? patch.updated_at : new Date().toISOString(),
  };
  const { data, error } = await ctx.supabase
    .from("assistant_trip_requests")
    .update(nextPatch)
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

async function updateDraftByVersion(
  ctx: ActionContext,
  draftId: string,
  expectedUpdatedAt: string,
  patch: Record<string, unknown>,
): Promise<TripRequestDraft | null> {
  const nextPatch = {
    ...patch,
    updated_at: typeof patch.updated_at === "string" ? patch.updated_at : new Date().toISOString(),
  };
  const { data, error } = await ctx.supabase
    .from("assistant_trip_requests")
    .update(nextPatch)
    .eq("id", draftId)
    .eq("organization_id", ctx.organizationId)
    .eq("operator_user_id", ctx.userId)
    .eq("updated_at", expectedUpdatedAt)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapDraft(data as TripRequestRow);
}

const DELIVERY_CLAIM_STALE_MS = 5 * 60 * 1000;

function isArtifactClaimStale(claimedAt?: string): boolean {
  if (!claimedAt) return false;
  const claimedTime = new Date(claimedAt).getTime();
  return Number.isFinite(claimedTime) && Date.now() - claimedTime > DELIVERY_CLAIM_STALE_MS;
}

async function claimTripRequestDeliveryArtifact(
  ctx: ActionContext,
  draft: TripRequestDraft,
  artifactId: TripRequestDeliveryArtifactId,
): Promise<TripRequestDraft | null> {
  const artifact = getCompletionDeliveryMetadata(draft).deliveryArtifacts[artifactId];
  if (artifact?.deliveredAt) {
    return draft;
  }
  if (artifact?.claimedAt && !isArtifactClaimStale(artifact.claimedAt)) {
    return null;
  }

  return updateDraftByVersion(ctx, draft.id, draft.updatedAt, {
    collected_fields: mergeDeliveryArtifactState(draft, artifactId, {
      claimedAt: new Date().toISOString(),
      deliveredAt: artifact?.deliveredAt,
      error: null,
    }) as unknown as Json,
  });
}

async function markTripRequestDeliveryArtifactDelivered(
  ctx: ActionContext,
  draft: TripRequestDraft,
  artifactId: TripRequestDeliveryArtifactId,
): Promise<TripRequestDraft | null> {
  return updateDraftByVersion(ctx, draft.id, draft.updatedAt, {
    collected_fields: mergeDeliveryArtifactState(draft, artifactId, {
      claimedAt: undefined,
      deliveredAt: new Date().toISOString(),
      error: null,
    }) as unknown as Json,
  });
}

async function markTripRequestDeliveryArtifactFailed(
  ctx: ActionContext,
  draft: TripRequestDraft,
  artifactId: TripRequestDeliveryArtifactId,
  errorMessage: string,
): Promise<TripRequestDraft | null> {
  return updateDraftByVersion(ctx, draft.id, draft.updatedAt, {
    collected_fields: mergeDeliveryArtifactState(draft, artifactId, {
      claimedAt: undefined,
      deliveredAt: undefined,
      error: trimOrNull(errorMessage, 500),
    }) as unknown as Json,
  });
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
  const normalizedEmail = normalizeEmail(draft.clientEmail);

  if (normalizedEmail) {
    const { data: existingByEmail, error } = await ctx.supabase
      .from("profiles")
      .select("id, full_name")
      .eq("organization_id", ctx.organizationId)
      .eq("role", "client")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      return { error: `Failed to look up client email: ${error.message}` };
    }

    if (existingByEmail?.id) {
      const { error: updateProfileError } = await ctx.supabase
        .from("profiles")
        .update({
          full_name: clientName,
          phone: draft.clientPhone ? formatPhoneForStorage(draft.clientPhone) : null,
          phone_whatsapp: draft.clientPhone ? formatPhoneForStorage(draft.clientPhone) : null,
          phone_normalized: normalizedPhone,
          travelers_count: draft.travelerCount,
        })
        .eq("id", existingByEmail.id);

      if (updateProfileError) {
        return { error: `Failed to update existing client profile: ${updateProfileError.message}` };
      }

      const { error: clientUpsertError } = await ctx.supabase
        .from("clients")
        .upsert(
          {
            id: existingByEmail.id,
            organization_id: ctx.organizationId,
            user_id: existingByEmail.id,
          },
          { onConflict: "id" },
        );

      if (clientUpsertError) {
        return { error: `Failed to link client record: ${clientUpsertError.message}` };
      }

      return { clientId: existingByEmail.id, clientName };
    }
  }

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
            user_id: existingByPhone.id,
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
          user_id: existing.id,
        },
        { onConflict: "id" },
      );

    if (clientUpsertError) {
      return { error: `Failed to link client record: ${clientUpsertError.message}` };
    }

    return { clientId: existing.id, clientName };
  }

  const createEmail = normalizedEmail ?? buildFallbackClientEmail(ctx, draft);
  const formattedPhone = draft.clientPhone ? formatPhoneForStorage(draft.clientPhone) : null;
  const phoneDigits = draft.clientPhone ? normalizePhoneDigits(draft.clientPhone) : null;

  const { data: newUser, error: createUserError } = await ctx.supabase.auth.admin.createUser({
    email: createEmail,
    email_confirm: true,
    user_metadata: {
      full_name: clientName,
      source: "trip_request_form",
      organization_id: ctx.organizationId,
    },
  });

  if (createUserError || !newUser?.user?.id) {
    return {
      error: `Failed to create client auth record: ${createUserError?.message ?? "unknown error"}`,
    };
  }

  const profileId = newUser.user.id;

  const { error: profileUpsertError } = await ctx.supabase
    .from("profiles")
    .upsert(
      {
        id: profileId,
        organization_id: ctx.organizationId,
        role: "client",
        full_name: clientName,
        email: normalizedEmail,
        phone: formattedPhone,
        phone_whatsapp: formattedPhone,
        phone_normalized: phoneDigits,
        lifecycle_stage: "inquiry",
        lead_status: "new",
        source_channel: "trip_request_form",
        travelers_count: draft.travelerCount,
      },
      { onConflict: "id" },
    );

  if (profileUpsertError) {
    return { error: `Failed to create client profile: ${profileUpsertError.message}` };
  }

  const { error: clientInsertError } = await ctx.supabase
    .from("clients")
    .upsert(
      {
        id: profileId,
        organization_id: ctx.organizationId,
        user_id: profileId,
      },
      { onConflict: "id" },
    );

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

async function getLatestTripRequestDeliveryConnection(
  organizationId: string,
): Promise<{ sessionName: string | null; groupJid: string | null; operatorPhone: string | null }> {
  const admin = createAdminClient();
  const { data: connection } = await admin
    .from("whatsapp_connections")
    .select("session_name, assistant_group_jid, phone_number, status")
    .eq("organization_id", organizationId)
    .eq("status", "connected")
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    sessionName: (connection as { session_name?: string | null } | null)?.session_name ?? null,
    groupJid: (connection as { assistant_group_jid?: string | null } | null)?.assistant_group_jid ?? null,
    operatorPhone: formatPhoneForStorage(
      (connection as { phone_number?: string | null } | null)?.phone_number ?? "",
    ),
  };
}

function buildCompletionDeliveryMessage(
  draft: TripRequestDraft,
): string {
  return [
    `Trip form submitted for *${draft.clientName ?? "the traveller"}*.`,
    draft.destination ? `Destination: *${draft.destination}*` : null,
    draft.durationDays ? `Duration: *${draft.durationDays} days*` : null,
    draft.createdShareUrl ? `Share link: ${draft.createdShareUrl}` : "Share link is not ready yet.",
    `PDF: ${buildTripRequestPdfUrl(draft.formToken)}`,
  ].filter((value): value is string => Boolean(value)).join("\n");
}

async function sendTripRequestCompletionText(
  sessionName: string,
  jid: string,
  message: string,
): Promise<void> {
  await guardedSendText(sessionName, jid, message);
}

async function sendTripRequestCompletionPdf(
  sessionName: string,
  jid: string,
  formToken: string,
  caption: string,
): Promise<void> {
  await guardedSendMedia(
    sessionName,
    jid,
    buildTripRequestPdfUrl(formToken),
    "document",
    {
      fileName: `trip-itinerary-${formToken.slice(0, 8)}.pdf`,
      mimetype: "application/pdf",
      caption,
    },
  );
}

async function notifyAssistantGroupAboutCompletedDraft(
  organizationId: string,
  formToken: string,
  message: string,
): Promise<{
  sessionName: string | null;
  groupJid: string | null;
  operatorPhone: string | null;
  delivered: boolean;
  error: string | null;
}> {
  const { sessionName, groupJid, operatorPhone } = await getLatestTripRequestDeliveryConnection(organizationId);

  if (!sessionName || !groupJid) {
    return {
      sessionName,
      groupJid,
      operatorPhone,
      delivered: false,
      error: "No connected assistant group found.",
    };
  }

  let operatorError: string | null = null;
  let textDelivered = false;
  let pdfDelivered = false;

  await sendTripRequestCompletionText(sessionName, groupJid, message)
    .then(() => {
      textDelivered = true;
    })
    .catch((error) => {
      operatorError = error instanceof Error ? error.message : "Failed to send completion text";
    logError("[trip-intake] failed to send trip form completion message", error, {
      organizationId,
      formToken,
    });
  });

  await sendTripRequestCompletionPdf(sessionName, groupJid, formToken, "Trip itinerary PDF")
    .then(() => {
      pdfDelivered = true;
    })
    .catch((error) => {
      operatorError = operatorError ?? (error instanceof Error ? error.message : "Failed to send completion PDF");
      logError("[trip-intake] failed to send trip form completion PDF", error, {
        organizationId,
        formToken,
      });
    });

  return {
    sessionName,
    groupJid,
    operatorPhone,
    delivered: textDelivered && pdfDelivered,
    error: operatorError,
  };
}

async function notifyClientAboutCompletedDraft(
  organizationId: string,
  sessionName: string | null,
  draft: TripRequestDraft,
  operatorPhone: string | null,
): Promise<{ delivered: boolean; skipped: boolean; error: string | null }> {
  const phone = formatPhoneForStorage(draft.clientPhone ?? "");
  if (!sessionName || !phone || phone === operatorPhone) {
    return {
      delivered: false,
      skipped: true,
      error: !sessionName
        ? "No connected WhatsApp session found."
        : !phone
          ? "Traveller phone number is missing."
          : "Traveller number matches the operator phone.",
    };
  }

  const lines = [
    `Your TripBuilt trip for *${draft.destination ?? "your destination"}* is ready.`,
    draft.durationDays ? `Duration: *${draft.durationDays} days*` : null,
    draft.travelWindow ? `Travel window: *${draft.travelWindow}*` : null,
    draft.createdShareUrl ? `Trip link: ${draft.createdShareUrl}` : "Trip link is being prepared.",
    `PDF: ${buildTripRequestPdfUrl(draft.formToken)}`,
  ].filter((value): value is string => Boolean(value));

  let clientError: string | null = null;
  let textDelivered = false;
  let pdfDelivered = false;

  await sendTripRequestCompletionText(sessionName, phone, lines.join("\n"))
    .then(() => {
      textDelivered = true;
    })
    .catch((error) => {
      clientError = error instanceof Error ? error.message : "Failed to send client completion text";
    logError("[trip-intake] failed to send trip form completion text to client", error, {
      organizationId,
      draftId: draft.id,
      clientPhone: phone,
    });
  });

  await sendTripRequestCompletionPdf(sessionName, phone, draft.formToken, "Your trip itinerary PDF")
    .then(() => {
      pdfDelivered = true;
    })
    .catch((error) => {
      clientError = clientError ?? (error instanceof Error ? error.message : "Failed to send client completion PDF");
      logError("[trip-intake] failed to send trip form completion PDF to client", error, {
        organizationId,
        draftId: draft.id,
        clientPhone: phone,
      });
    });

  return {
    delivered: textDelivered && pdfDelivered,
    skipped: false,
    error: clientError,
  };
}

async function deliverTripRequestArtifact(args: {
  ctx: ActionContext;
  draft: TripRequestDraft;
  artifactId: TripRequestDeliveryArtifactId;
  send: () => Promise<void>;
}): Promise<{
  draft: TripRequestDraft;
  delivered: boolean;
  attempted: boolean;
  error: string | null;
}> {
  const existing = getCompletionDeliveryMetadata(args.draft).deliveryArtifacts[args.artifactId];
  if (existing.deliveredAt) {
    return {
      draft: args.draft,
      delivered: true,
      attempted: false,
      error: null,
    };
  }

  const claimed = await claimTripRequestDeliveryArtifact(args.ctx, args.draft, args.artifactId);
  if (!claimed) {
    return {
      draft: args.draft,
      delivered: false,
      attempted: false,
      error: null,
    };
  }

  try {
    await args.send();
    const deliveredDraft = await markTripRequestDeliveryArtifactDelivered(args.ctx, claimed, args.artifactId);
    return {
      draft: deliveredDraft ?? claimed,
      delivered: true,
      attempted: true,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Delivery failed";
    const failedDraft = await markTripRequestDeliveryArtifactFailed(args.ctx, claimed, args.artifactId, errorMessage);
    return {
      draft: failedDraft ?? claimed,
      delivered: false,
      attempted: true,
      error: errorMessage,
    };
  }
}

async function markCustomerSessionCompleted(
  organizationId: string,
  phone: string | null,
  draft: TripRequestDraft,
): Promise<void> {
  const normalizedPhone = formatPhoneForStorage(phone ?? "");
  if (!normalizedPhone) {
    return;
  }

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("whatsapp_chatbot_sessions")
    .select("id, ai_reply_count")
    .eq("organization_id", organizationId)
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (!session?.id) {
    return;
  }

  const now = new Date().toISOString();
  await admin
    .from("whatsapp_chatbot_sessions")
    .update({
      state: "form_submitted",
      context: {
        draftId: draft.id,
        formToken: draft.formToken,
        formUrl: buildTripRequestFormUrl(draft.formToken),
        lastAutoReplyType: "completion",
        operatorNotifiedAt: null,
      } as Json,
      ai_reply_count: session.ai_reply_count,
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", session.id);
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

  const generationPrompt = buildPlannerPromptFromDraft(draft);
  let itinerary;
  try {
    itinerary = await generateItineraryForActor({
      prompt: generationPrompt,
      days: draft.durationDays,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      source: "magic_link_trip_request",
    });
  } catch (error) {
    logError("[trip-intake] planner generation failed, falling back to structured seed", error, {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      draftId: draft.id,
    });
    try {
      itinerary = await buildFallbackItinerary(generationPrompt, draft.durationDays);
      itinerary.trip_title = `${draft.destination} Trip for ${draft.clientName}`;
      itinerary.destination = draft.destination;
      itinerary.duration_days = draft.durationDays;
    } catch {
      itinerary = buildStructuredItinerary(draft);
    }
  }

  const normalizedItinerary = normalizeGeneratedItineraryForDraft(draft, itinerary);

  const { data: itineraryRow, error: itineraryError } = await ctx.supabase
    .from("itineraries")
    .insert({
      user_id: ctx.userId,
      client_id: clientResolution.clientId,
      trip_title: typeof normalizedItinerary.trip_title === "string" && normalizedItinerary.trip_title.trim().length > 0
        ? normalizedItinerary.trip_title
        : `${draft.destination} Trip for ${draft.clientName}`,
      destination: typeof normalizedItinerary.destination === "string" && normalizedItinerary.destination.trim().length > 0
        ? normalizedItinerary.destination
        : draft.destination,
      summary: typeof normalizedItinerary.summary === "string" && normalizedItinerary.summary.trim().length > 0
        ? normalizedItinerary.summary
        : `Trip plan for ${draft.clientName} in ${draft.destination}.`,
      duration_days: typeof normalizedItinerary.duration_days === "number" && Number.isFinite(normalizedItinerary.duration_days)
        ? normalizedItinerary.duration_days
        : draft.durationDays,
      budget: draft.budget,
      interests: draft.interests.length > 0 ? [...draft.interests] : null,
      raw_data: normalizedItinerary as unknown as Json,
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

type TripRequestFormSubmitInput = {
  destination: string;
  durationDays: number;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  travelerCount: number;
  startDate: string;
  endDate: string;
  budget: string | null;
  hotelPreference: string | null;
  interests: readonly string[];
  originCity: string | null;
  submittedBy: string | null;
  submitterRole: TripRequestSubmitterRole | null;
};

export type OperatorTripRequestUpdateInput = {
  destination: string;
  durationDays: number;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  travelerCount: number;
  startDate: string;
  endDate: string;
  budget: string | null;
  hotelPreference: string | null;
  interests: readonly string[];
  originCity: string | null;
};

type SubmitTripRequestFormOptions = {
  deferFinalization?: boolean;
};

export async function loadTripRequestFormState(
  formToken: string,
): Promise<TripRequestFormState | null> {
  const row = await getDraftByFormToken(formToken);
  if (!row) return null;
  const branding = await loadTripRequestBusinessBranding({
    organizationId: row.organization_id,
    operatorUserId: row.operator_user_id,
  });
  return {
    ...toTripRequestFormState(mapDraft(row)),
    ...branding,
  };
}

export async function submitTripRequestForm(
  formToken: string,
  input: TripRequestFormSubmitInput,
  options: SubmitTripRequestFormOptions = {},
): Promise<{ readonly success: boolean; readonly message: string; readonly state?: TripRequestFormState }> {
  const row = await getDraftByFormToken(formToken);
  if (!row) {
    return { success: false, message: "Trip request form not found." };
  }

  if (row.status === "completed") {
    return {
      success: true,
      message: "This trip request has already been completed.",
      state: toTripRequestFormState(mapDraft(row)),
    };
  }

  if (row.status === "ready_to_create" || row.current_step === "finalizing") {
    return {
      success: true,
      message: "This trip request has already been received and is being prepared now.",
      state: toTripRequestFormState(mapDraft(row)),
    };
  }

  const admin = createAdminClient();
  const ctx: ActionContext = {
    organizationId: row.organization_id,
    userId: row.operator_user_id,
    channel: "whatsapp_group",
    supabase: admin,
  };

  const startDate = trimOrNull(input.startDate, 20);
  const endDate = trimOrNull(input.endDate, 20);
  const destination = trimOrNull(input.destination, 160);
  const clientName = trimOrNull(input.clientName, 160);

  if (!destination || !clientName || !startDate || !endDate || !Number.isFinite(input.durationDays) || input.durationDays < 1 || !Number.isFinite(input.travelerCount) || input.travelerCount < 1) {
    return { success: false, message: "Destination, duration, client, travelers, and travel dates are required." };
  }

  if (startDate > endDate) {
    return { success: false, message: "End date must be on or after the start date." };
  }

  const travelWindow = `${startDate} to ${endDate}`;
  const requestSummary = summarizeDraft({
    destination,
    durationDays: input.durationDays,
    clientName,
  });
  const submittedBy = trimOrNull(input.submittedBy, 160);
  const submitterRole = input.submitterRole ?? "other";

  const collectedFields = {
    destination,
    duration_days: input.durationDays,
    client_name: clientName,
    client_email: input.clientEmail ?? "",
    client_phone: input.clientPhone ?? "",
    traveler_count: input.travelerCount,
    travel_window: travelWindow,
    start_date: startDate,
    end_date: endDate,
    budget: input.budget ?? "",
    hotel_preference: input.hotelPreference ?? "",
    interests: [...input.interests],
    origin_city: input.originCity ?? "",
    submitted_by: submittedBy ?? "",
    submitter_role: submitterRole,
  };

  const updatedDraft = await updateDraft(ctx, row.id, {
    status: "ready_to_create",
    destination,
    duration_days: input.durationDays,
    client_name: clientName,
    client_email: input.clientEmail,
    client_phone: input.clientPhone,
    traveler_count: input.travelerCount,
    travel_window: travelWindow,
    start_date: startDate,
    end_date: endDate,
    budget: input.budget ?? "",
    hotel_preference: input.hotelPreference ?? "",
    interests: [...input.interests],
    origin_city: input.originCity ?? "",
    submitted_at: new Date().toISOString(),
    submitted_by: submittedBy,
    submitter_role: submitterRole,
    current_step: null,
    request_summary: requestSummary,
    collected_fields: collectedFields as unknown as Json,
    missing_required_fields: [] as unknown as Json,
  });

  if (!updatedDraft) {
    return { success: false, message: "I couldn't save that trip request form." };
  }

  if (options.deferFinalization) {
    return {
      success: true,
      message: "Thanks — your trip request is in progress. We’re preparing the itinerary now and will share it here shortly.",
      state: toTripRequestFormState(updatedDraft),
    };
  }

  return completeSubmittedTripRequestForm(formToken);
}

export async function updateTripRequestDraftForOperator(args: {
  organizationId: string;
  draftId: string;
  operatorUserId?: string | null;
  input: OperatorTripRequestUpdateInput;
}): Promise<{ readonly success: boolean; readonly message: string; readonly request?: OperatorTripRequestListItem }> {
  const row = await getDraftRowByOrganization(args.organizationId, args.draftId);
  if (!row) {
    return { success: false, message: "Trip request not found." };
  }

  if (args.operatorUserId && row.operator_user_id !== args.operatorUserId) {
    return { success: false, message: "You do not have access to update this trip request." };
  }

  const destination = trimOrNull(args.input.destination, 160);
  const clientName = trimOrNull(args.input.clientName, 160);
  const startDate = trimOrNull(args.input.startDate, 20);
  const endDate = trimOrNull(args.input.endDate, 20);
  const clientEmail = normalizeEmail(args.input.clientEmail);
  const clientPhone = formatPhoneForStorage(args.input.clientPhone ?? "");
  const budget = trimOrNull(args.input.budget, 120);
  const hotelPreference = trimOrNull(args.input.hotelPreference, 120);
  const originCity = trimOrNull(args.input.originCity, 120);
  const interests = args.input.interests
    .map((entry) => trimOrNull(entry, 60))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 10);

  if (
    !destination
    || !clientName
    || !startDate
    || !endDate
    || !Number.isFinite(args.input.durationDays)
    || args.input.durationDays < 1
    || !Number.isFinite(args.input.travelerCount)
    || args.input.travelerCount < 1
  ) {
    return {
      success: false,
      message: "Destination, duration, traveller name, travel dates, and traveller count are required.",
    };
  }

  if (startDate > endDate) {
    return { success: false, message: "Return date must be on or after the departure date." };
  }

  const travelWindow = `${startDate} to ${endDate}`;
  const requestSummary = summarizeDraft({
    destination,
    durationDays: args.input.durationDays,
    clientName,
  });

  const missingRequiredFields = computeMissingRequiredFields({
    destination,
    durationDays: args.input.durationDays,
    clientName,
    travelerCount: args.input.travelerCount,
    travelWindow,
  });

  const updatedCollectedFields = {
    ...toCollectedFields(row.collected_fields),
    destination,
    duration_days: args.input.durationDays,
    client_name: clientName,
    client_email: clientEmail ?? "",
    client_phone: clientPhone ?? "",
    traveler_count: args.input.travelerCount,
    travel_window: travelWindow,
    start_date: startDate,
    end_date: endDate,
    budget: budget ?? "",
    hotel_preference: hotelPreference ?? "",
    interests,
    origin_city: originCity ?? "",
  };
  const nextStatus: TripRequestStatus =
    row.status === "completed"
      ? "completed"
      : missingRequiredFields.length === 0
        ? "ready_to_create"
        : "draft";
  const draftForHistory = mapDraft({
    ...row,
    destination,
    duration_days: args.input.durationDays,
    client_name: clientName,
    client_email: clientEmail,
    client_phone: clientPhone,
    traveler_count: args.input.travelerCount,
    travel_window: travelWindow,
    start_date: startDate,
    end_date: endDate,
    budget,
    hotel_preference: hotelPreference,
    interests,
    origin_city: originCity,
    request_summary: requestSummary,
    status: nextStatus,
    current_step: nextStatus === "draft" ? row.current_step : null,
    missing_required_fields: missingRequiredFields as unknown as Json,
    collected_fields: updatedCollectedFields as unknown as Json,
  } as TripRequestRow);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("assistant_trip_requests")
    .update({
      destination,
      duration_days: args.input.durationDays,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      traveler_count: args.input.travelerCount,
      travel_window: travelWindow,
      start_date: startDate,
      end_date: endDate,
      budget,
      hotel_preference: hotelPreference,
      interests,
      origin_city: originCity,
      request_summary: requestSummary,
      status: nextStatus,
      current_step: nextStatus === "draft" ? row.current_step : null,
      missing_required_fields: missingRequiredFields as unknown as Json,
      collected_fields: appendTripRequestActionHistory(
        draftForHistory,
        {
          action: "saved",
          title: "Brief saved",
          description: "Updated the traveller brief from the operator workspace.",
          tone: "success",
        },
      ) as unknown as Json,
    })
    .eq("id", row.id)
    .eq("organization_id", args.organizationId)
    .select("*")
    .single();

  if (error || !data) {
    logError("[trip-intake] failed to update trip request draft from operator inbox", error, {
      organizationId: args.organizationId,
      draftId: args.draftId,
    });
    return { success: false, message: `Failed to update trip request: ${error?.message ?? "unknown error"}` };
  }

  return {
    success: true,
    message: "Trip request updated. Regenerate the itinerary to apply these changes to the final trip.",
    request: toOperatorTripRequestListItem(data as TripRequestRow),
  };
}

export async function cancelTripRequestForOperator(args: {
  organizationId: string;
  draftId: string;
  operatorUserId?: string | null;
}): Promise<{ readonly success: boolean; readonly message: string }> {
  const row = await getDraftRowByOrganization(args.organizationId, args.draftId);
  if (!row) {
    return { success: false, message: "Trip request not found." };
  }

  if (args.operatorUserId && row.operator_user_id !== args.operatorUserId) {
    return { success: false, message: "You do not have access to delete this trip request." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("assistant_trip_requests")
    .update({
      status: "cancelled",
      current_step: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("organization_id", args.organizationId);

  if (error) {
    logError("[trip-intake] failed to cancel trip request from operator inbox", error, {
      organizationId: args.organizationId,
      draftId: args.draftId,
    });
    return { success: false, message: `Failed to delete trip request: ${error.message}` };
  }

  return {
    success: true,
    message: row.created_trip_id
      ? "Removed the request from the inbox. The linked trip remains available."
      : "Removed the request from the inbox.",
  };
}

export async function completeSubmittedTripRequestForm(
  formToken: string,
): Promise<{ readonly success: boolean; readonly message: string; readonly state?: TripRequestFormState }> {
  const claimedRow = await claimDraftFinalization(formToken);
  const row = claimedRow ?? (await getDraftByFormToken(formToken));
  if (!row) {
    return { success: false, message: "Trip request form not found." };
  }

  const admin = createAdminClient();
  const ctx: ActionContext = {
    organizationId: row.organization_id,
    userId: row.operator_user_id,
    channel: "whatsapp_group",
    supabase: admin,
  };

  let message = "This trip request has already been completed.";
  let finalDraft = mapDraft(row);

  if (claimedRow) {
    message = await finalizeDraft(ctx, finalDraft);
    const finalRow = await getDraftByFormToken(formToken);
    finalDraft = finalRow ? mapDraft(finalRow) : finalDraft;
  } else if (row.status === "completed") {
    finalDraft = mapDraft(row);
  } else {
    return {
      success: true,
      message: "This trip request is already being completed.",
      state: toTripRequestFormState(mapDraft(row)),
    };
  }

  const finalState = toTripRequestFormState(finalDraft);
  if (finalDraft.status !== "completed") {
    await updateDraft(ctx, finalDraft.id, {
      collected_fields: appendTripRequestActionHistory(
        {
          ...finalDraft,
          collectedFields: mergeCompletionDeliveryMetadata(finalDraft, {
            generationError: message,
          }),
        },
        {
          action: "retry_request",
          title: "Completion failed",
          description: message,
          tone: "error",
        },
      ) as unknown as Json,
    });
    if (claimedRow) {
      await updateDraft(ctx, finalDraft.id, { current_step: null });
    }
    return {
      success: false,
      message,
      state: finalState,
    };
  }

  const whatsappMessage = buildCompletionDeliveryMessage(finalDraft);
  const deliveryConnection = await getLatestTripRequestDeliveryConnection(row.organization_id);

  let latestDraft = finalDraft;
  let operatorError: string | null = null;
  let clientError: string | null = null;

  if (deliveryConnection.sessionName && deliveryConnection.groupJid) {
    const assistantText = await deliverTripRequestArtifact({
      ctx,
      draft: latestDraft,
      artifactId: "assistant_text",
      send: () => sendTripRequestCompletionText(deliveryConnection.sessionName!, deliveryConnection.groupJid!, whatsappMessage),
    });
    latestDraft = assistantText.draft;
    operatorError = assistantText.error;

    const assistantPdf = await deliverTripRequestArtifact({
      ctx,
      draft: latestDraft,
      artifactId: "assistant_pdf",
      send: () => sendTripRequestCompletionPdf(deliveryConnection.sessionName!, deliveryConnection.groupJid!, formToken, "Trip itinerary PDF"),
    });
    latestDraft = assistantPdf.draft;
    operatorError = operatorError ?? assistantPdf.error;
  } else {
    operatorError = "No connected assistant group found.";
  }

  const normalizedClientPhone = formatPhoneForStorage(latestDraft.clientPhone ?? "");
  const canDeliverToClient = Boolean(
    deliveryConnection.sessionName
    && normalizedClientPhone
    && normalizedClientPhone !== deliveryConnection.operatorPhone,
  );

  if (canDeliverToClient) {
    const clientText = await deliverTripRequestArtifact({
      ctx,
      draft: latestDraft,
      artifactId: "client_text",
      send: () => sendTripRequestCompletionText(deliveryConnection.sessionName!, normalizedClientPhone!, [
        `Your TripBuilt trip for *${latestDraft.destination ?? "your destination"}* is ready.`,
        latestDraft.durationDays ? `Duration: *${latestDraft.durationDays} days*` : null,
        latestDraft.travelWindow ? `Travel window: *${latestDraft.travelWindow}*` : null,
        latestDraft.createdShareUrl ? `Trip link: ${latestDraft.createdShareUrl}` : "Trip link is being prepared.",
        `PDF: ${buildTripRequestPdfUrl(latestDraft.formToken)}`,
      ].filter((value): value is string => Boolean(value)).join("\n")),
    });
    latestDraft = clientText.draft;
    clientError = clientText.error;

    const clientPdf = await deliverTripRequestArtifact({
      ctx,
      draft: latestDraft,
      artifactId: "client_pdf",
      send: () => sendTripRequestCompletionPdf(
        deliveryConnection.sessionName!,
        normalizedClientPhone!,
        latestDraft.formToken,
        "Your trip itinerary PDF",
      ),
    });
    latestDraft = clientPdf.draft;
    clientError = clientError ?? clientPdf.error;
  }

  const latestMetadata = getCompletionDeliveryMetadata(latestDraft);
  const assistantDelivered =
    Boolean(latestMetadata.deliveryArtifacts.assistant_text.deliveredAt)
    && Boolean(latestMetadata.deliveryArtifacts.assistant_pdf.deliveredAt);
  const clientDelivered =
    Boolean(latestMetadata.deliveryArtifacts.client_text.deliveredAt)
    && Boolean(latestMetadata.deliveryArtifacts.client_pdf.deliveredAt);
  const deliveredAt =
    latestMetadata.completionDeliveredAt
    ?? (assistantDelivered || clientDelivered ? new Date().toISOString() : null);

  const historyEntries: Array<
    Omit<OperatorTripRequestActionHistoryEntry, "occurredAt"> & { occurredAt?: string }
  > = [];
  if (!latestMetadata.completionDeliveredAt && deliveredAt) {
    historyEntries.push({
      action: "completion_delivered",
      title: "Trip package delivered",
      description: clientDelivered
        ? "The itinerary package was shared with the operator and traveller."
        : "The itinerary package was shared with the operator.",
      tone: "success",
      occurredAt: deliveredAt,
    });
  }
  if (operatorError) {
    historyEntries.push({
      action: "resend_operator",
      title: "Operator delivery failed",
      description: operatorError,
      tone: "error",
    });
  }
  if (clientError) {
    historyEntries.push({
      action: "resend_client",
      title: "Traveller delivery failed",
      description: clientError,
      tone: "error",
    });
  }

  const updated = await updateDraft(ctx, latestDraft.id, {
    collected_fields: appendTripRequestActionHistoryEntries(
      {
        ...latestDraft,
        collectedFields: mergeCompletionDeliveryMetadata(latestDraft, {
          completionDeliveredAt: deliveredAt,
          completionDeliveredToClient: clientDelivered,
          completionDeliveredToAssistantGroup: assistantDelivered,
          operatorDeliveryError: operatorError,
          clientDeliveryError: clientError,
          generationError: null,
        }),
      },
      historyEntries,
    ) as unknown as Json,
  });
  if (updated) {
    finalDraft = updated;
  } else {
    finalDraft = latestDraft;
  }

  if (assistantDelivered || clientDelivered) {
    logEvent("info", "[trip-intake] completion delivered", {
      organizationId: row.organization_id,
      draftId: finalDraft.id,
      tripId: finalDraft.createdTripId,
      itineraryId: finalDraft.createdItineraryId,
      notifiedAssistantGroup: assistantDelivered,
      notifiedClient: clientDelivered,
    });
  }
  await markCustomerSessionCompleted(row.organization_id, finalDraft.clientPhone, finalDraft).catch((error) => {
    logError("[trip-intake] failed to mark customer flow completed", error, {
      organizationId: row.organization_id,
      draftId: finalDraft.id,
    });
  });

  return {
    success: true,
    message,
    state: toTripRequestFormState(finalDraft),
  };
}

export async function resendTripRequestCompletionToOperator(args: {
  organizationId: string;
  draftId: string;
}): Promise<{ readonly success: boolean; readonly message: string }> {
  const row = await getDraftRowByOrganization(args.organizationId, args.draftId);
  if (!row) {
    return { success: false, message: "Trip request not found." };
  }

  const draft = mapDraft(row);
  if (draft.status !== "completed") {
    return { success: false, message: "This request is not completed yet." };
  }

  const connection = await notifyAssistantGroupAboutCompletedDraft(
    args.organizationId,
    draft.formToken,
    buildCompletionDeliveryMessage(draft),
  );

  if (!connection.groupJid || !connection.delivered) {
    const admin = createAdminClient();
    await admin
      .from("assistant_trip_requests")
      .update({
        collected_fields: appendTripRequestActionHistory(
          {
            ...draft,
            collectedFields: mergeCompletionDeliveryMetadata(draft, {
              operatorDeliveryError: connection.error ?? "Assistant group delivery failed.",
            }),
          },
          {
            action: "resend_operator",
            title: "Operator resend failed",
            description: connection.error ?? "Assistant group delivery failed.",
            tone: "error",
          },
        ) as unknown as Json,
      })
      .eq("id", draft.id)
      .eq("organization_id", args.organizationId);

    return {
      success: false,
      message: connection.error ?? "No connected assistant group found for this organization.",
    };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("assistant_trip_requests")
    .update({
      collected_fields: appendTripRequestActionHistory(
        {
          ...draft,
          collectedFields: mergeCompletionDeliveryMetadata(draft, {
            lastOperatorResentAt: now,
            completionDeliveredToAssistantGroup: true,
            operatorDeliveryError: null,
          }),
        },
        {
          action: "resend_operator",
          title: "Resent to operator",
          description: "Sent the latest trip package to the assistant group.",
          tone: "success",
          occurredAt: now,
        },
      ) as unknown as Json,
    })
    .eq("id", draft.id)
    .eq("organization_id", args.organizationId);

  return { success: true, message: "Sent the latest trip package to the assistant group." };
}

export async function resendTripRequestCompletionToClient(args: {
  organizationId: string;
  draftId: string;
}): Promise<{ readonly success: boolean; readonly message: string }> {
  const row = await getDraftRowByOrganization(args.organizationId, args.draftId);
  if (!row) {
    return { success: false, message: "Trip request not found." };
  }

  const draft = mapDraft(row);
  if (draft.status !== "completed") {
    return { success: false, message: "This request is not completed yet." };
  }

  if (!draft.clientPhone) {
    return { success: false, message: "The traveller phone number is missing on this request." };
  }

  const connection = await getLatestTripRequestDeliveryConnection(args.organizationId);
  const delivery = await notifyClientAboutCompletedDraft(
    args.organizationId,
    connection.sessionName,
    draft,
    connection.operatorPhone,
  );

  if (!connection.sessionName) {
    return { success: false, message: "No connected WhatsApp session found for this organization." };
  }

  const phone = formatPhoneForStorage(draft.clientPhone);
  if (!phone || phone === connection.operatorPhone) {
    return { success: false, message: "Client resend skipped because the traveller number matches the operator phone." };
  }

  if (!delivery.delivered) {
    const admin = createAdminClient();
    await admin
      .from("assistant_trip_requests")
      .update({
        collected_fields: appendTripRequestActionHistory(
          {
            ...draft,
            collectedFields: mergeCompletionDeliveryMetadata(draft, {
              clientDeliveryError: delivery.error ?? "Traveller delivery failed.",
            }),
          },
          {
            action: "resend_client",
            title: "Traveller resend failed",
            description: delivery.error ?? "Traveller delivery failed.",
            tone: "error",
          },
        ) as unknown as Json,
      })
      .eq("id", draft.id)
      .eq("organization_id", args.organizationId);

    return {
      success: false,
      message: delivery.error ?? "Failed to send the trip package to the traveller.",
    };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("assistant_trip_requests")
    .update({
      collected_fields: appendTripRequestActionHistory(
        {
          ...draft,
          collectedFields: mergeCompletionDeliveryMetadata(draft, {
            lastClientResentAt: now,
            completionDeliveredToClient: true,
            clientDeliveryError: null,
          }),
        },
        {
          action: "resend_client",
          title: "Resent to traveller",
          description: "Sent the latest trip package to the traveller on WhatsApp.",
          tone: "success",
          occurredAt: now,
        },
      ) as unknown as Json,
    })
    .eq("id", draft.id)
    .eq("organization_id", args.organizationId);

  return { success: true, message: "Sent the latest trip package to the traveller on WhatsApp." };
}

export async function regenerateTripRequestItinerary(args: {
  organizationId: string;
  draftId: string;
}): Promise<{ readonly success: boolean; readonly message: string }> {
  const row = await getDraftRowByOrganization(args.organizationId, args.draftId);
  if (!row) {
    return { success: false, message: "Trip request not found." };
  }

  const draft = mapDraft(row);
  if (draft.status !== "completed") {
    const completion = await completeSubmittedTripRequestForm(draft.formToken);
    return {
      success: completion.success,
      message: completion.success
        ? "This request was completed and is now ready."
        : completion.message,
    };
  }

  if (!draft.createdItineraryId || !draft.destination || !draft.durationDays) {
    return { success: false, message: "This request does not have a completed itinerary to regenerate yet." };
  }

  const admin = createAdminClient();
  const ctx: ActionContext = {
    organizationId: row.organization_id,
    userId: row.operator_user_id,
    channel: "whatsapp_group",
    supabase: admin,
  };

  const generationPrompt = buildPlannerPromptFromDraft(draft);
  let itinerary;
  try {
    itinerary = await generateItineraryForActor({
      prompt: generationPrompt,
      days: draft.durationDays,
      userId: row.operator_user_id,
      organizationId: row.organization_id,
      source: "magic_link_trip_request",
    });
  } catch (error) {
    logError("[trip-intake] itinerary regeneration failed, falling back", error, {
      organizationId: row.organization_id,
      draftId: draft.id,
      itineraryId: draft.createdItineraryId,
    });
    try {
      itinerary = await buildFallbackItinerary(generationPrompt, draft.durationDays);
      itinerary.trip_title = `${draft.destination} Trip for ${draft.clientName}`;
      itinerary.destination = draft.destination;
      itinerary.duration_days = draft.durationDays;
    } catch {
      itinerary = buildStructuredItinerary(draft);
    }
  }

  const normalizedItinerary = normalizeGeneratedItineraryForDraft(draft, itinerary);

  const { error: updateItineraryError } = await admin
    .from("itineraries")
    .update({
      user_id: row.operator_user_id,
      client_id: row.client_id,
      trip_title: typeof normalizedItinerary.trip_title === "string" && normalizedItinerary.trip_title.trim().length > 0
        ? normalizedItinerary.trip_title
        : `${draft.destination} Trip for ${draft.clientName}`,
      destination: typeof normalizedItinerary.destination === "string" && normalizedItinerary.destination.trim().length > 0
        ? normalizedItinerary.destination
        : draft.destination,
      summary: typeof normalizedItinerary.summary === "string" && normalizedItinerary.summary.trim().length > 0
        ? normalizedItinerary.summary
        : `Trip plan for ${draft.clientName} in ${draft.destination}.`,
      duration_days: typeof normalizedItinerary.duration_days === "number" && Number.isFinite(normalizedItinerary.duration_days)
        ? normalizedItinerary.duration_days
        : draft.durationDays,
      budget: draft.budget,
      interests: draft.interests.length > 0 ? [...draft.interests] : null,
      raw_data: normalizedItinerary as unknown as Json,
    })
    .eq("id", draft.createdItineraryId);

  if (updateItineraryError) {
    await admin
      .from("assistant_trip_requests")
      .update({
        collected_fields: appendTripRequestActionHistory(
          {
            ...draft,
            collectedFields: mergeCompletionDeliveryMetadata(draft, {
              generationError: updateItineraryError.message,
            }),
          },
          {
            action: "regenerate_itinerary",
            title: "Regeneration failed",
            description: updateItineraryError.message,
            tone: "error",
          },
        ) as unknown as Json,
      })
      .eq("id", draft.id)
      .eq("organization_id", args.organizationId);
    return { success: false, message: `Failed to regenerate the itinerary: ${updateItineraryError.message}` };
  }

  if (draft.createdTripId) {
    const { error: updateTripError } = await admin
      .from("trips")
      .update({
        start_date: draft.startDate,
        end_date: draft.endDate,
        pax_count: draft.travelerCount,
      })
      .eq("id", draft.createdTripId)
      .eq("organization_id", args.organizationId);

    if (updateTripError) {
      await admin
        .from("assistant_trip_requests")
        .update({
          collected_fields: appendTripRequestActionHistory(
            {
              ...draft,
              collectedFields: mergeCompletionDeliveryMetadata(draft, {
                generationError: updateTripError.message,
              }),
            },
            {
              action: "regenerate_itinerary",
              title: "Trip sync failed",
              description: updateTripError.message,
              tone: "error",
            },
          ) as unknown as Json,
        })
        .eq("id", draft.id)
        .eq("organization_id", args.organizationId);
      return { success: false, message: `Itinerary regenerated, but trip dates could not be synced: ${updateTripError.message}` };
    }
  }

  const shareUrl = draft.createdShareUrl ?? await ensureTripShareUrl(ctx, draft.createdItineraryId);
  const now = new Date().toISOString();
  await admin
    .from("assistant_trip_requests")
    .update({
      created_share_url: shareUrl,
      collected_fields: appendTripRequestActionHistory(
        {
          ...draft,
          collectedFields: mergeCompletionDeliveryMetadata(draft, {
            lastItineraryRegeneratedAt: now,
            generationError: null,
          }),
        },
        {
          action: "regenerate_itinerary",
          title: "Itinerary regenerated",
          description: "Regenerated the itinerary with the current trip brief.",
          tone: "info",
          occurredAt: now,
        },
      ) as unknown as Json,
      updated_at: now,
    })
    .eq("id", draft.id)
    .eq("organization_id", args.organizationId);

  return { success: true, message: "Regenerated the itinerary with the current trip brief." };
}

export async function retryTripRequestFromOperator(args: {
  organizationId: string;
  draftId: string;
}): Promise<{ readonly success: boolean; readonly message: string }> {
  const row = await getDraftRowByOrganization(args.organizationId, args.draftId);
  if (!row) {
    return { success: false, message: "Trip request not found." };
  }

  const draft = mapDraft(row);
  const admin = createAdminClient();
  const metadata = getCompletionDeliveryMetadata(draft);

  if (draft.status === "completed") {
    if (metadata.operatorDeliveryError) {
      return resendTripRequestCompletionToOperator(args);
    }
    if (metadata.clientDeliveryError) {
      return resendTripRequestCompletionToClient(args);
    }
    return regenerateTripRequestItinerary(args);
  }

  if (draft.currentStep === "finalizing") {
    await admin
      .from("assistant_trip_requests")
      .update({ current_step: null })
      .eq("id", draft.id)
      .eq("organization_id", args.organizationId);
  }

  const completion = await completeSubmittedTripRequestForm(draft.formToken);
  return {
    success: completion.success,
    message: completion.success
      ? "Retried the trip request successfully."
      : completion.message,
  };
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
  return [
    `Continuing *${formatDraftLabel(draft)}*.`,
    `Open form: ${buildTripRequestFormUrl(draft.formToken)}`,
    "",
    buildStepPrompt(step),
  ].join("\n");
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
    submitted_at: null,
    submitted_by: null,
    submitter_role: null,
    destination: draft.destination,
    duration_days: draft.durationDays,
    client_name: (patch.client_name as string | null | undefined) ?? draft.clientName,
    client_email: draft.clientEmail,
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
    form_token: draft.formToken,
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
      `Open form: ${buildTripRequestFormUrl(newDraft.formToken)}`,
      "You can fill the full trip form there, or keep replying here.",
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
