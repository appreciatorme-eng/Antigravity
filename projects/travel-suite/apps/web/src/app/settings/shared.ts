import type { ItineraryTemplateId } from "@/components/pdf/itinerary-types";

export const ORGANIZATION_SETTINGS_SELECT = [
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

export interface BranchOffice {
    name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
}

export const EMPTY_BRANCH_OFFICE: BranchOffice = {
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
};

export interface Organization {
    id: string;
    name: string;
    slug: string;
    legal_name: string | null;
    logo_url: string | null;
    primary_color: string | null;
    itinerary_template: ItineraryTemplateId | null;
    subscription_tier: string | null;
    gstin: string | null;
    billing_state: string | null;
    branch_offices: BranchOffice[];
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

export type OrganizationSettingsRow = Omit<Organization, "billing_address" | "itinerary_template" | "branch_offices"> & {
    billing_address?: unknown;
    billing_address_line1?: string | null;
    billing_address_line2?: string | null;
    billing_city?: string | null;
    billing_pincode?: string | null;
    branch_offices?: unknown;
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

export function mergeBillingAddressFields(
    raw: unknown,
    row?: {
        billing_address_line1?: string | null;
        billing_address_line2?: string | null;
        billing_city?: string | null;
        billing_state?: string | null;
        billing_pincode?: string | null;
    }
): Organization["billing_address"] {
    const address = normalizeBillingAddress(raw);

    return {
        ...address,
        line1: address.line1 || row?.billing_address_line1 || "",
        line2: address.line2 || row?.billing_address_line2 || "",
        city: address.city || row?.billing_city || "",
        state: address.state || row?.billing_state || "",
        postal_code: address.postal_code || row?.billing_pincode || "",
    };
}

export function normalizeBranchOffices(raw: unknown): BranchOffice[] {
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is Record<string, unknown> => !!item && typeof item === "object").map((item) => ({
        name: typeof item.name === "string" ? item.name : "",
        line1: typeof item.line1 === "string" ? item.line1 : "",
        line2: typeof item.line2 === "string" ? item.line2 : "",
        city: typeof item.city === "string" ? item.city : "",
        state: typeof item.state === "string" ? item.state : "",
        postal_code: typeof item.postal_code === "string" ? item.postal_code : "",
    }));
}
