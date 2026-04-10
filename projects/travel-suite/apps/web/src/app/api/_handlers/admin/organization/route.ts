import { apiError, apiSuccess } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";
import { z } from "zod";

const ORGANIZATION_SELECT = [
  "billing_address",
  "billing_address_line1",
  "billing_address_line2",
  "billing_city",
  "billing_pincode",
  "billing_state",
  "branch_offices",
  "gstin",
  "id",
  "itinerary_template",
  "legal_name",
  "logo_url",
  "name",
  "primary_color",
  "slug",
  "subscription_tier",
].join(", ");

const LEGACY_ORGANIZATION_SELECT = [
  "billing_address",
  "billing_state",
  "gstin",
  "id",
  "logo_url",
  "name",
  "primary_color",
  "slug",
  "subscription_tier",
].join(", ");

const BillingAddressSchema = z.object({
  line1: z.string().trim().max(240).optional().nullable(),
  line2: z.string().trim().max(240).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  state: z.string().trim().max(120).optional().nullable(),
  postal_code: z.string().trim().max(40).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal("")),
});

const BranchOfficeSchema = z.object({
  name: z.string().trim().max(240),
  line1: z.string().trim().max(240),
  line2: z.string().trim().max(240),
  city: z.string().trim().max(120),
  state: z.string().trim().max(120),
  postal_code: z.string().trim().max(40),
});

const OrganizationUpdateSchema = z.object({
  name: z.string().trim().min(1).max(240).optional(),
  legal_name: z.string().trim().max(240).optional().nullable(),
  logo_url: z.string().trim().url().max(2048).optional().nullable().or(z.literal("")),
  primary_color: z.string().trim().max(32).optional().nullable(),
  itinerary_template: z.string().trim().max(80).optional().nullable(),
  gstin: z.string().trim().max(32).optional().nullable(),
  billing_state: z.string().trim().max(120).optional().nullable(),
  billing_address: BillingAddressSchema.optional().nullable(),
  branch_offices: z.array(BranchOfficeSchema).optional(),
});

type AdminClient = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>["adminClient"];

function isMissingColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { message?: string; details?: string; hint?: string };
  const blob = `${record.message || ""} ${record.details || ""} ${record.hint || ""}`.toLowerCase();
  const normalizedColumn = column.toLowerCase();
  return (
    blob.includes(`could not find the '${normalizedColumn}' column`) ||
    blob.includes(`column "${normalizedColumn}" does not exist`) ||
    blob.includes(`column ${normalizedColumn} does not exist`) ||
    blob.includes(`column organizations.${normalizedColumn} does not exist`) ||
    (blob.includes("column") && blob.includes(normalizedColumn) && blob.includes("does not exist")) ||
    (blob.includes(normalizedColumn) && blob.includes("schema cache"))
  );
}

function isOptionalOrganizationColumnError(error: unknown): boolean {
  return (
    isMissingColumnError(error, "itinerary_template") ||
    isMissingColumnError(error, "legal_name") ||
    isMissingColumnError(error, "billing_address_line1") ||
    isMissingColumnError(error, "billing_address_line2") ||
    isMissingColumnError(error, "billing_city") ||
    isMissingColumnError(error, "billing_pincode")
  );
}

async function fetchOrganization(adminClient: AdminClient, organizationId: string) {
  let result = await adminClient
    .from("organizations")
    .select(ORGANIZATION_SELECT)
    .eq("id", organizationId)
    .maybeSingle();

  if (result.error && isOptionalOrganizationColumnError(result.error)) {
    result = await adminClient
      .from("organizations")
      .select(LEGACY_ORGANIZATION_SELECT)
      .eq("id", organizationId)
      .maybeSingle();
  }

  return result;
}

function normalizeAddress(input: z.infer<typeof BillingAddressSchema> | null | undefined) {
  return {
    line1: input?.line1?.trim() || "",
    line2: input?.line2?.trim() || "",
    city: input?.city?.trim() || "",
    state: input?.state?.trim() || "",
    postal_code: input?.postal_code?.trim() || "",
    country: input?.country?.trim() || "",
    phone: input?.phone?.trim() || "",
    email: input?.email?.trim() || "",
  };
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mergeAddressFromOrganization(
  organization: Record<string, unknown>,
  input: z.infer<typeof BillingAddressSchema> | null | undefined,
) {
  const currentRaw = organization.billing_address;
  const currentAddress = currentRaw && typeof currentRaw === "object" && !Array.isArray(currentRaw)
    ? currentRaw as Record<string, unknown>
    : {};

  if (input !== undefined) {
    return normalizeAddress(input);
  }

  return {
    line1: stringValue(currentAddress.line1) || stringValue(organization.billing_address_line1) || "",
    line2: stringValue(currentAddress.line2) || stringValue(organization.billing_address_line2) || "",
    city: stringValue(currentAddress.city) || stringValue(organization.billing_city) || "",
    state: stringValue(currentAddress.state) || stringValue(organization.billing_state) || "",
    postal_code: stringValue(currentAddress.postal_code) || stringValue(organization.billing_pincode) || "",
    country: stringValue(currentAddress.country) || "",
    phone: stringValue(currentAddress.phone) || "",
    email: stringValue(currentAddress.email) || "",
  };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;
    if (!auth.organizationId) return apiError("Organization not configured", 400);

    const { data, error } = await fetchOrganization(auth.adminClient, auth.organizationId);
    if (error) {
      logError("[admin/organization:GET] Failed to load organization", error);
      return apiError("Failed to load organization", 500);
    }
    if (!data) return apiError("Organization not found", 404);

    return apiSuccess({ organization: data });
  } catch (error) {
    logError("[admin/organization:GET] Unhandled error", error);
    return apiError("An unexpected error occurred", 500);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;
    if (!auth.organizationId) return apiError("Organization not configured", 400);

    const body = await request.json().catch(() => null);
    const parsed = OrganizationUpdateSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid organization details", 400);

    const { data: currentOrganization, error: currentError } = await fetchOrganization(auth.adminClient, auth.organizationId);
    if (currentError) {
      logError("[admin/organization:PATCH] Failed to load current organization", currentError);
      return apiError("Failed to load organization details", 500);
    }
    if (!currentOrganization) return apiError("Organization not found", 404);

    const currentRecord = currentOrganization as unknown as Record<string, unknown>;
    const address = mergeAddressFromOrganization(currentRecord, parsed.data.billing_address);
    const currentName = stringValue(currentRecord.name) || "Organization";
    const currentLegalName = stringValue(currentRecord.legal_name);
    const billingState = address.state || parsed.data.billing_state?.trim() || stringValue(currentRecord.billing_state);
    const currentBranchOffices = Array.isArray(currentRecord.branch_offices) ? currentRecord.branch_offices : [];
    const basePayload = {
      name: parsed.data.name?.trim() || currentName,
      legal_name: parsed.data.legal_name !== undefined
        ? parsed.data.legal_name?.trim() || parsed.data.name?.trim() || currentName
        : currentLegalName,
      logo_url: parsed.data.logo_url !== undefined ? parsed.data.logo_url || null : stringValue(currentRecord.logo_url),
      primary_color: parsed.data.primary_color !== undefined
        ? parsed.data.primary_color || null
        : stringValue(currentRecord.primary_color),
      gstin: parsed.data.gstin !== undefined ? parsed.data.gstin?.toUpperCase() || null : stringValue(currentRecord.gstin),
      billing_state: billingState,
      billing_address: { ...address, state: billingState || "" },
      billing_address_line1: address.line1 || null,
      billing_address_line2: address.line2 || null,
      billing_city: address.city || null,
      billing_pincode: address.postal_code || null,
      branch_offices: parsed.data.branch_offices ?? currentBranchOffices,
    };
    const updatePayload = {
      ...basePayload,
      itinerary_template: parsed.data.itinerary_template || stringValue(currentRecord.itinerary_template) || "safari_story",
    };

    let { error } = await auth.adminClient
      .from("organizations")
      .update(updatePayload as never)
      .eq("id", auth.organizationId);

    if (error && isMissingColumnError(error, "itinerary_template")) {
      const fallback = await auth.adminClient
        .from("organizations")
        .update(basePayload as never)
        .eq("id", auth.organizationId);
      error = fallback.error;
    }

    if (error && isOptionalOrganizationColumnError(error)) {
      const legacyPayload = {
        name: basePayload.name,
        logo_url: basePayload.logo_url,
        primary_color: basePayload.primary_color,
        gstin: basePayload.gstin,
        billing_state: basePayload.billing_state,
        billing_address: basePayload.billing_address,
      };
      const fallback = await auth.adminClient
        .from("organizations")
        .update(legacyPayload as never)
        .eq("id", auth.organizationId);
      error = fallback.error;
    }

    if (error) {
      logError("[admin/organization:PATCH] Failed to save organization", error);
      return apiError("Failed to save organization details", 500);
    }

    const { data, error: fetchError } = await fetchOrganization(auth.adminClient, auth.organizationId);
    if (fetchError || !data) {
      logError("[admin/organization:PATCH] Saved but failed to reload organization", fetchError);
      return apiError("Organization saved, but could not reload updated details", 500);
    }

    return apiSuccess({ organization: data });
  } catch (error) {
    logError("[admin/organization:PATCH] Unhandled error", error);
    return apiError("An unexpected error occurred", 500);
  }
}
