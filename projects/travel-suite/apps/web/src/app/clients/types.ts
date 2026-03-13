/**
 * Client Directory — Shared types and constants
 */

export interface Client {
    id: string;
    role?: "client" | "driver" | "admin" | null;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string | null;
    preferred_destination?: string | null;
    travelers_count?: number | null;
    budget_min?: number | null;
    budget_max?: number | null;
    travel_style?: string | null;
    interests?: string[] | null;
    home_airport?: string | null;
    notes?: string | null;
    lead_status?: string | null;
    client_tag?: string | null;
    phase_notifications_enabled?: boolean | null;
    lifecycle_stage?: string | null;
    marketing_opt_in?: boolean | null;
    referral_source?: string | null;
    source_channel?: string | null;
    trips_count?: number;
    language_preference?: string | null;
}

export interface FeatureLimitSnapshot {
    allowed: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
    tier: string;
    resetAt: string | null;
}

export interface ClientFormData {
    full_name: string;
    email: string;
    phone: string;
    preferredDestination: string;
    travelersCount: string;
    budgetMin: string;
    budgetMax: string;
    travelStyle: string;
    interests: string;
    homeAirport: string;
    notes: string;
    leadStatus: string;
    clientTag: string;
    phaseNotificationsEnabled: boolean;
    lifecycleStage: string;
    marketingOptIn: boolean;
    referralSource: string;
    sourceChannel: string;
    languagePreference: string;
}

export interface StageConfig {
    label: string;
    emoji: string;
    color: string;
    headerGradient: string;
    columnBg: string;
    cardBorder: string;
    badgeBg: string;
    badgeText: string;
    avatarGradient: string;
}

export const LIFECYCLE_STAGES = [
    "lead",
    "prospect",
    "proposal",
    "payment_pending",
    "payment_confirmed",
    "active",
    "review",
    "past",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const STAGE_CONFIG: Record<LifecycleStage, StageConfig> = {
    lead: {
        label: "Lead",
        emoji: "\u{1F331}",
        color: "text-slate-600",
        headerGradient: "from-slate-400 to-slate-600",
        columnBg: "bg-slate-50/60 dark:bg-slate-900/20 border-slate-200/60 dark:border-slate-800",
        cardBorder: "border-slate-200 dark:border-slate-700",
        badgeBg: "bg-slate-100 dark:bg-slate-800",
        badgeText: "text-slate-600 dark:text-slate-300",
        avatarGradient: "from-slate-400 to-slate-600",
    },
    prospect: {
        label: "Prospect",
        emoji: "\u{1F440}",
        color: "text-violet-600",
        headerGradient: "from-violet-400 to-violet-700",
        columnBg: "bg-violet-50/40 dark:bg-violet-950/20 border-violet-200/60 dark:border-violet-900/50",
        cardBorder: "border-violet-100 dark:border-violet-900/50",
        badgeBg: "bg-violet-100 dark:bg-violet-900/30",
        badgeText: "text-violet-700 dark:text-violet-300",
        avatarGradient: "from-violet-400 to-violet-700",
    },
    proposal: {
        label: "Proposal",
        emoji: "\u{1F4CB}",
        color: "text-blue-600",
        headerGradient: "from-blue-400 to-blue-700",
        columnBg: "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/50",
        cardBorder: "border-blue-100 dark:border-blue-900/50",
        badgeBg: "bg-blue-100 dark:bg-blue-900/30",
        badgeText: "text-blue-700 dark:text-blue-300",
        avatarGradient: "from-blue-400 to-blue-700",
    },
    payment_pending: {
        label: "Payment Pending",
        emoji: "\u{231B}",
        color: "text-amber-600",
        headerGradient: "from-amber-400 to-amber-600",
        columnBg: "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/50",
        cardBorder: "border-amber-100 dark:border-amber-900/50",
        badgeBg: "bg-amber-100 dark:bg-amber-900/30",
        badgeText: "text-amber-700 dark:text-amber-300",
        avatarGradient: "from-amber-400 to-amber-600",
    },
    payment_confirmed: {
        label: "Confirmed",
        emoji: "\u{2705}",
        color: "text-emerald-600",
        headerGradient: "from-emerald-400 to-emerald-700",
        columnBg: "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/50",
        cardBorder: "border-emerald-100 dark:border-emerald-900/50",
        badgeBg: "bg-emerald-100 dark:bg-emerald-900/30",
        badgeText: "text-emerald-700 dark:text-emerald-300",
        avatarGradient: "from-emerald-400 to-emerald-700",
    },
    active: {
        label: "Active Trip",
        emoji: "\u{2708}\u{FE0F}",
        color: "text-green-600",
        headerGradient: "from-green-400 to-green-700",
        columnBg: "bg-green-50/40 dark:bg-green-950/20 border-green-200/60 dark:border-green-900/50",
        cardBorder: "border-green-100 dark:border-green-900/50",
        badgeBg: "bg-green-100 dark:bg-green-900/30",
        badgeText: "text-green-700 dark:text-green-300",
        avatarGradient: "from-green-400 to-green-700",
    },
    review: {
        label: "Review",
        emoji: "\u{2B50}",
        color: "text-orange-600",
        headerGradient: "from-orange-400 to-orange-600",
        columnBg: "bg-orange-50/40 dark:bg-orange-950/20 border-orange-200/60 dark:border-orange-900/50",
        cardBorder: "border-orange-100 dark:border-orange-900/50",
        badgeBg: "bg-orange-100 dark:bg-orange-900/30",
        badgeText: "text-orange-700 dark:text-orange-300",
        avatarGradient: "from-orange-400 to-orange-600",
    },
    past: {
        label: "Closed",
        emoji: "\u{1F3C1}",
        color: "text-rose-600",
        headerGradient: "from-rose-400 to-rose-700",
        columnBg: "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/50",
        cardBorder: "border-rose-100 dark:border-rose-900/50",
        badgeBg: "bg-rose-100 dark:bg-rose-900/30",
        badgeText: "text-rose-700 dark:text-rose-300",
        avatarGradient: "from-rose-400 to-rose-700",
    },
};

export const LANGUAGES = [
    "English", "\u0939\u093F\u0902\u0926\u0940 (Hindi)", "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD (Tamil)", "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41 (Telugu)",
    "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1 (Kannada)", "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02 (Malayalam)", "\u09AC\u09BE\u0982\u09B2\u09BE (Bengali)",
    "\u092E\u0930\u093E\u0920\u0940 (Marathi)", "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0 (Gujarati)", "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40 (Punjabi)",
    "\u0B13\u0B21\u0B3C\u0B3F\u0B06 (Odia)", "\u0627\u0631\u062F\u0648 (Urdu)", "\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE (Assamese)",
];

export const DEFAULT_FORM_DATA: ClientFormData = {
    full_name: "",
    email: "",
    phone: "",
    preferredDestination: "",
    travelersCount: "",
    budgetMin: "",
    budgetMax: "",
    travelStyle: "",
    interests: "",
    homeAirport: "",
    notes: "",
    leadStatus: "new",
    clientTag: "standard",
    phaseNotificationsEnabled: true,
    lifecycleStage: "lead",
    marketingOptIn: false,
    referralSource: "",
    sourceChannel: "",
    languagePreference: "English",
};

export function formatFeatureLimitError(payload: Record<string, unknown> | null | undefined, fallback: string): string {
    if (payload?.code !== "FEATURE_LIMIT_EXCEEDED") return fallback;
    const limit = Number(payload?.limit || 0);
    const used = Number(payload?.used || 0);
    const feature = String(payload?.feature || "usage");
    if (limit > 0) return `Limit reached for ${feature}: ${used}/${limit}. Upgrade in Billing to continue.`;
    return typeof payload?.error === "string" ? payload.error : fallback;
}

export const formatINR = (n: number): string => "\u20B9" + Math.round(n).toLocaleString("en-IN");

export function getInitials(name: string | null): string {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

export function getNextStage(stage?: string | null): LifecycleStage | null {
    const current = LIFECYCLE_STAGES.indexOf((stage || "lead") as LifecycleStage);
    if (current < 0 || current >= LIFECYCLE_STAGES.length - 1) return null;
    return LIFECYCLE_STAGES[current + 1];
}

export function getPrevStage(stage?: string | null): LifecycleStage | null {
    const current = LIFECYCLE_STAGES.indexOf((stage || "lead") as LifecycleStage);
    if (current <= 0) return null;
    return LIFECYCLE_STAGES[current - 1];
}
