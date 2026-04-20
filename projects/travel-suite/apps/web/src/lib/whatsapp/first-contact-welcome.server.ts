import "server-only";

import { z } from "zod";

import { recordSent, hasAlreadySent } from "@/lib/automation/dedup";
import { logError } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardedSendText } from "@/lib/whatsapp-evolution.server";
import {
  buildTripRequestFormUrl,
  ensureFirstContactTripRequestDraft,
} from "@/lib/whatsapp/trip-intake.server";

const DEFAULT_SERVICE_BULLETS = [
  "✈️ Flights and holiday packages",
  "🏨 Hotels, transport, and sightseeing",
  "🛂 Visa and travel assistance",
] as const;

export const FIRST_CONTACT_WELCOME_RULE_TYPE = "new_lead_welcome_link";

export const WhatsAppWelcomeConfigSchema = z.object({
  intro_headline: z.string().trim().max(160).optional().nullable(),
  company_description: z.string().trim().max(280).optional().nullable(),
  region_line: z.string().trim().max(160).optional().nullable(),
  service_bullets: z.array(z.string().trim().max(120)).max(8).optional(),
  contact_phone: z.string().trim().max(40).optional().nullable(),
  office_hours: z.string().trim().max(120).optional().nullable(),
  cta_line: z.string().trim().max(240).optional().nullable(),
  footer: z.string().trim().max(240).optional().nullable(),
});

export type WhatsAppWelcomeConfig = z.infer<typeof WhatsAppWelcomeConfigSchema>;

type OrganizationWelcomeRow = {
  id: string;
  name: string;
  owner_id: string | null;
  billing_state?: string | null;
  billing_address?: unknown;
  whatsapp_welcome_config?: unknown;
};

const ORGANIZATION_WELCOME_SELECT = [
  "id",
  "name",
  "owner_id",
  "billing_state",
  "billing_address",
  "whatsapp_welcome_config",
].join(", ");

const LEGACY_ORGANIZATION_WELCOME_SELECT = [
  "id",
  "name",
  "owner_id",
  "billing_state",
  "billing_address",
].join(", ");

function trimOrNull(value: string | null | undefined, maxLength = 240): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizePhoneDigits(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length > 6 ? digits : null;
}

function formatPhoneForStorage(value: string | null | undefined): string | null {
  const digits = normalizePhoneDigits(value);
  return digits ? `+${digits}` : null;
}

function getBillingAddressValue(input: unknown, key: string): string | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isMissingColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { message?: string; details?: string; hint?: string };
  const blob = `${record.message || ""} ${record.details || ""} ${record.hint || ""}`.toLowerCase();
  const normalizedColumn = column.toLowerCase();
  return (
    blob.includes(`could not find the '${normalizedColumn}' column`) ||
    blob.includes(`column "${normalizedColumn}" does not exist`) ||
    blob.includes(`column ${normalizedColumn} does not exist`) ||
    (blob.includes(normalizedColumn) && blob.includes("schema cache"))
  );
}

async function fetchOrganizationWelcomeRow(
  organizationId: string,
): Promise<OrganizationWelcomeRow | null> {
  const admin = createAdminClient();
  let result = await admin
    .from("organizations")
    .select(ORGANIZATION_WELCOME_SELECT)
    .eq("id", organizationId)
    .maybeSingle();

  if (result.error && isMissingColumnError(result.error, "whatsapp_welcome_config")) {
    result = await admin
      .from("organizations")
      .select(LEGACY_ORGANIZATION_WELCOME_SELECT)
      .eq("id", organizationId)
      .maybeSingle();
  }

  if (result.error || !result.data) {
    logError("[first-contact-welcome] failed to load organization", result.error, {
      organizationId,
    });
    return null;
  }

  return result.data as unknown as OrganizationWelcomeRow;
}

export function normalizeWhatsAppWelcomeConfig(input: unknown): WhatsAppWelcomeConfig {
  const parsed = WhatsAppWelcomeConfigSchema.safeParse(input);
  if (!parsed.success) {
    return {};
  }

  return {
    intro_headline: trimOrNull(parsed.data.intro_headline, 160),
    company_description: trimOrNull(parsed.data.company_description, 280),
    region_line: trimOrNull(parsed.data.region_line, 160),
    service_bullets: (parsed.data.service_bullets ?? [])
      .map((entry) => trimOrNull(entry, 120))
      .filter((entry): entry is string => Boolean(entry)),
    contact_phone: trimOrNull(parsed.data.contact_phone, 40),
    office_hours: trimOrNull(parsed.data.office_hours, 120),
    cta_line: trimOrNull(parsed.data.cta_line, 240),
    footer: trimOrNull(parsed.data.footer, 240),
  };
}

export function buildFirstContactWelcomeMessage(
  organization: OrganizationWelcomeRow,
  intakeUrl: string,
): string {
  const config = normalizeWhatsAppWelcomeConfig(organization.whatsapp_welcome_config);
  const introHeadline = config.intro_headline || "Hey Buddy 🌍✈️";
  const companyDescription =
    config.company_description || `${organization.name} is your one-stop travel solution.`;
  const regionLine =
    config.region_line ||
    (organization.billing_state
      ? `🏪 DMC for ${organization.billing_state.toUpperCase()}`
      : null);
  const serviceBullets =
    config.service_bullets && config.service_bullets.length > 0
      ? config.service_bullets
      : [...DEFAULT_SERVICE_BULLETS];
  const contactPhone =
    config.contact_phone || getBillingAddressValue(organization.billing_address, "phone");
  const officeHours = config.office_hours;
  const ctaLine =
    config.cta_line ||
    "Share your travel details here and we will build your trip and send the final trip link back on WhatsApp:";
  const footer = config.footer || "Let’s make your next trip easy.";

  const lines = [
    introHeadline,
    companyDescription,
    regionLine,
    "",
    ...serviceBullets.map((entry) =>
      entry.startsWith("•") || /^[\p{Emoji}\u2600-\u27BF]/u.test(entry) ? entry : `• ${entry}`,
    ),
    contactPhone ? `📞 Contact: ${contactPhone}` : null,
    officeHours ? `🕐 Office hours: ${officeHours}` : null,
    "",
    ctaLine,
    intakeUrl,
    "",
    footer,
  ].filter((value): value is string => Boolean(value));

  return lines.join("\n");
}

async function resolveOperatorUserId(
  organizationId: string,
  ownerId: string | null,
): Promise<string | null> {
  const admin = createAdminClient();

  if (ownerId) {
    const { data: owner } = await admin
      .from("profiles")
      .select("id")
      .eq("id", ownerId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (owner?.id) {
      return owner.id;
    }
  }

  const { data: adminProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("organization_id", organizationId)
    .in("role", ["admin", "super_admin"])
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return adminProfile?.id ?? null;
}

export async function hasPriorChatbotLeadSession(
  organizationId: string,
  phone: string,
): Promise<boolean> {
  const normalizedPhone = formatPhoneForStorage(phone);
  if (!normalizedPhone) {
    return false;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("whatsapp_chatbot_sessions")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("phone", normalizedPhone)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function maybeSendFirstContactWelcome(args: {
  organizationId: string;
  sessionName: string;
  phone: string;
  pushName: string | null;
  initialMessage: string;
}): Promise<boolean> {
  const normalizedPhone = formatPhoneForStorage(args.phone);
  if (!normalizedPhone) {
    return false;
  }

  if (await hasAlreadySent(args.organizationId, FIRST_CONTACT_WELCOME_RULE_TYPE, normalizedPhone)) {
    return false;
  }

  if (await hasPriorChatbotLeadSession(args.organizationId, normalizedPhone)) {
    return false;
  }

  const organization = await fetchOrganizationWelcomeRow(args.organizationId);
  if (!organization) {
    return false;
  }

  const operatorUserId = await resolveOperatorUserId(args.organizationId, organization.owner_id ?? null);
  if (!operatorUserId) {
    logError("[first-contact-welcome] could not resolve operator user for org", null, {
      organizationId: args.organizationId,
    });
    return false;
  }

  const draft = await ensureFirstContactTripRequestDraft({
    organizationId: args.organizationId,
    operatorUserId,
    clientPhone: normalizedPhone,
    clientName: trimOrNull(args.pushName, 160),
    initialMessage: args.initialMessage,
    sourceChannel: "whatsapp_first_contact_welcome",
  });

  if (!draft) {
    return false;
  }

  const intakeUrl = buildTripRequestFormUrl(draft.formToken);
  const welcomeMessage = buildFirstContactWelcomeMessage(
    organization as OrganizationWelcomeRow,
    intakeUrl,
  );

  try {
    await guardedSendText(args.sessionName, args.phone, welcomeMessage);
    await recordSent(
      args.organizationId,
      FIRST_CONTACT_WELCOME_RULE_TYPE,
      normalizedPhone,
      welcomeMessage,
    );
    return true;
  } catch (error) {
    logError("[first-contact-welcome] failed to send welcome message", error, {
      organizationId: args.organizationId,
      phone: normalizedPhone,
      draftId: draft.id,
    });
    return false;
  }
}
