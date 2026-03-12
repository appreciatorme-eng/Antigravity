import type { ItineraryTemplateId } from "@/components/pdf/itinerary-types";

export const ORGANIZATION_SETTINGS_SELECT = [
    "billing_address",
    "billing_state",
    "gstin",
    "id",
    "itinerary_template",
    "logo_url",
    "name",
    "primary_color",
    "slug",
    "subscription_tier",
].join(", ");

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    itinerary_template: ItineraryTemplateId | null;
    subscription_tier: string | null;
    gstin: string | null;
    billing_state: string | null;
    billing_address: {
        line1: string;
        line2: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
        phone: string;
        email: string;
    };
}

export type OrganizationSettingsRow = Omit<Organization, "billing_address" | "itinerary_template"> & {
    billing_address?: unknown;
    itinerary_template?: string | null;
};

export interface WorkflowRule {
    lifecycle_stage: string;
    notify_client: boolean;
}

export interface WhatsAppProfile {
    number: string;
    name: string;
}

export const workflowStageLabels: Record<string, string> = {
    lead: "Lead",
    prospect: "Prospect",
    proposal: "Proposal",
    payment_pending: "Payment Pending",
    payment_confirmed: "Payment Confirmed",
    active: "Active Trip",
    review: "Review",
    past: "Closed",
};

export const EMPTY_BILLING_ADDRESS: Organization["billing_address"] = {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    phone: "",
    email: "",
};

export function isMissingColumnError(error: unknown, column: string): boolean {
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

export function normalizeBillingAddress(raw: unknown): Organization["billing_address"] {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return { ...EMPTY_BILLING_ADDRESS };
    }

    const value = raw as Record<string, unknown>;
    return {
        line1: typeof value.line1 === "string" ? value.line1 : "",
        line2: typeof value.line2 === "string" ? value.line2 : "",
        city: typeof value.city === "string" ? value.city : "",
        state: typeof value.state === "string" ? value.state : "",
        postal_code: typeof value.postal_code === "string" ? value.postal_code : "",
        country: typeof value.country === "string" ? value.country : "",
        phone: typeof value.phone === "string" ? value.phone : "",
        email: typeof value.email === "string" ? value.email : "",
    };
}
