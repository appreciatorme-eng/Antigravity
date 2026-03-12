"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Settings,
    Save,
    Building2,
    Globe,
    Palette,
    Shield,
    Bell,
    Check,
    Link2,
    MessageCircle,
    Mail,
    MapPin,
    IndianRupee,
    Instagram,
    Linkedin,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassFormSkeleton } from "@/components/glass/GlassSkeleton";
import {
    ITINERARY_TEMPLATE_OPTIONS,
    normalizeItineraryTemplateId,
    type ItineraryTemplateId,
} from "@/components/pdf/itinerary-types";
import { useToast } from "@/components/ui/toast";
import { WhatsAppConnectModal } from "@/components/whatsapp/WhatsAppConnectModal";
import { cn } from "@/lib/utils";

const ORGANIZATION_SETTINGS_SELECT = [
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

interface Organization {
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

type OrganizationSettingsRow = Omit<Organization, "billing_address" | "itinerary_template"> & {
    billing_address?: unknown;
    itinerary_template?: string | null;
};

interface WorkflowRule {
    lifecycle_stage: string;
    notify_client: boolean;
}

const workflowStageLabels: Record<string, string> = {
    lead: "Lead",
    prospect: "Prospect",
    proposal: "Proposal",
    payment_pending: "Payment Pending",
    payment_confirmed: "Payment Confirmed",
    active: "Active Trip",
    review: "Review",
    past: "Closed",
};

const isMissingColumnError = (error: unknown, column: string): boolean => {
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
};

const EMPTY_BILLING_ADDRESS = {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    phone: "",
    email: "",
};

function normalizeBillingAddress(raw: unknown): Organization["billing_address"] {
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

export default function SettingsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
    const [rulesSaving, setRulesSaving] = useState(false);

    // WhatsApp Connect State
    const [isWhatsAppConnectOpen, setIsWhatsAppConnectOpen] = useState(false);
    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
    const [whatsAppProfile, setWhatsAppProfile] = useState<{
        number: string;
        name: string;
    } | null>(null);

    // Load real WhatsApp connection status on mount
    useEffect(() => {
        void (async () => {
            const { data } = await supabase
                .from("whatsapp_connections")
                .select("status, phone_number, display_name")
                .eq("status", "connected")
                .maybeSingle();
            if (data) {
                setIsWhatsAppConnected(true);
                setWhatsAppProfile({
                    number: data.phone_number ?? "",
                    name: data.display_name ?? "",
                });
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDisconnectWhatsApp = async () => {
        try {
            const res = await fetch("/api/whatsapp/disconnect", { method: "POST" });
            if (!res.ok) throw new Error("Disconnect failed");
            setIsWhatsAppConnected(false);
            setWhatsAppProfile(null);
            toast({ title: "WhatsApp disconnected", variant: "success" });
        } catch {
            toast({ title: "Failed to disconnect WhatsApp", variant: "error" });
        }
    };

    // Integration connection state
    const [isGmailConnected, setIsGmailConnected] = useState(false);
    const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
    const [isInstagramConnected, setIsInstagramConnected] = useState(false);
    const [isTripAdvisorConnected, setIsTripAdvisorConnected] = useState(false);
    const [tripAdvisorName, setTripAdvisorName] = useState('');
    const [tripAdvisorLocationInput, setTripAdvisorLocationInput] = useState('');
    const [showTripAdvisorInput, setShowTripAdvisorInput] = useState(false);
    const [isTripAdvisorConnecting, setIsTripAdvisorConnecting] = useState(false);
    const [isPlacesEnabled, setIsPlacesEnabled] = useState(false);
    const [isPlacesActivating, setIsPlacesActivating] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [isUpiSaved, setIsUpiSaved] = useState(false);
    const [isUpiSaving, setIsUpiSaving] = useState(false);

    // Load all integration statuses on mount (parallel)
    useEffect(() => {
        void (async () => {
            const [{ data: connections }, upiRes, placesRes] = await Promise.all([
                supabase
                    .from('social_connections')
                    .select('platform')
                    .in('platform', ['google', 'linkedin', 'instagram', 'facebook']),
                fetch('/api/settings/upi'),
                fetch('/api/integrations/places'),
            ]);

            if (connections) {
                const platforms = new Set(connections.map((c: { platform: string }) => c.platform));
                setIsGmailConnected(platforms.has('google'));
                setIsLinkedInConnected(platforms.has('linkedin'));
                setIsInstagramConnected(platforms.has('instagram') || platforms.has('facebook'));
            }

            if (upiRes.ok) {
                const upiData = (await upiRes.json()) as { upiId?: string | null };
                if (upiData.upiId) {
                    setUpiId(upiData.upiId);
                    setIsUpiSaved(true);
                }
            }

            if (placesRes.ok) {
                const placesData = (await placesRes.json()) as { enabled?: boolean };
                setIsPlacesEnabled(placesData.enabled ?? false);
            }

            const { data: orgSettings } = await supabase
                .from('organization_settings')
                .select('tripadvisor_location_id')
                .maybeSingle();
            if (orgSettings?.tripadvisor_location_id) {
                setIsTripAdvisorConnected(true);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConnectTripAdvisor = async () => {
        if (!tripAdvisorLocationInput.trim()) return;
        setIsTripAdvisorConnecting(true);
        try {
            const res = await fetch('/api/integrations/tripadvisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locationId: tripAdvisorLocationInput.trim() }),
            });
            const data = (await res.json()) as { success?: boolean; locationName?: string; error?: string };
            if (!res.ok || !data.success) {
                toast({ title: 'TripAdvisor connect failed', description: data.error ?? 'Invalid location ID', variant: 'error' });
                return;
            }
            setIsTripAdvisorConnected(true);
            setTripAdvisorName(data.locationName ?? '');
            setShowTripAdvisorInput(false);
            toast({ title: 'TripAdvisor connected', description: data.locationName ?? '', variant: 'success' });
        } catch {
            toast({ title: 'TripAdvisor connect failed', variant: 'error' });
        } finally {
            setIsTripAdvisorConnecting(false);
        }
    };

    const handleActivatePlaces = async () => {
        setIsPlacesActivating(true);
        try {
            const res = await fetch('/api/integrations/places', { method: 'POST' });
            if (!res.ok) {
                const data = (await res.json()) as { error?: string };
                toast({ title: 'Activation failed', description: data.error ?? 'Could not activate Google Places', variant: 'error' });
                return;
            }
            setIsPlacesEnabled(true);
            toast({ title: 'Google Places activated', variant: 'success' });
        } catch {
            toast({ title: 'Activation failed', variant: 'error' });
        } finally {
            setIsPlacesActivating(false);
        }
    };

    const handleSaveUpi = async () => {
        if (!upiId.trim()) return;
        setIsUpiSaving(true);
        try {
            const res = await fetch('/api/settings/upi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ upiId: upiId.trim() }),
            });
            const data = (await res.json()) as { success?: boolean; error?: string };
            if (!res.ok || !data.success) {
                toast({ title: 'Save failed', description: data.error ?? 'Invalid UPI ID', variant: 'error' });
                return;
            }
            setIsUpiSaved(true);
            toast({ title: 'UPI ID saved', description: `Payment links will use ${upiId}`, variant: 'success' });
        } catch {
            toast({ title: 'Failed to save UPI ID', variant: 'error' });
        } finally {
            setIsUpiSaving(false);
        }
    };

    const fetchSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("organizations")
                .select(ORGANIZATION_SETTINGS_SELECT)
                .single();

            if (error) throw error;
            const organizationRow = data as unknown as OrganizationSettingsRow | null;
            if (!organizationRow) {
                throw new Error("Organization not found");
            }
            const orgRecord = organizationRow as unknown as Record<string, unknown>;
            setOrganization({
                ...organizationRow,
                itinerary_template: normalizeItineraryTemplateId(
                    typeof orgRecord.itinerary_template === "string"
                        ? orgRecord.itinerary_template
                        : null
                ),
                gstin:
                    typeof orgRecord.gstin === "string"
                        ? orgRecord.gstin
                        : null,
                billing_state:
                    typeof orgRecord.billing_state === "string"
                        ? orgRecord.billing_state
                        : null,
                billing_address: normalizeBillingAddress(orgRecord.billing_address),
            });

            const { data: { session } } = await supabase.auth.getSession();
            const rulesResponse = await fetch("/api/admin/workflow/rules", {
                headers: {
                    Authorization: `Bearer ${session?.access_token || ""}`,
                },
            });
            const rulesPayload = await rulesResponse.json();
            if (rulesResponse.ok) {
                setWorkflowRules(rulesPayload.rules || []);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        void fetchSettings();
    }, [fetchSettings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization) return;

        setSaving(true);
        try {
            const updatePayload = {
                name: organization.name,
                logo_url: organization.logo_url,
                primary_color: organization.primary_color,
                itinerary_template: organization.itinerary_template || "safari_story",
                gstin: organization.gstin || null,
                billing_state: organization.billing_state || null,
                billing_address: {
                    line1: organization.billing_address.line1 || null,
                    line2: organization.billing_address.line2 || null,
                    city: organization.billing_address.city || null,
                    state: organization.billing_address.state || null,
                    postal_code: organization.billing_address.postal_code || null,
                    country: organization.billing_address.country || null,
                    phone: organization.billing_address.phone || null,
                    email: organization.billing_address.email || null,
                },
            };

            let { error } = await supabase
                .from("organizations")
                .update(updatePayload)
                .eq("id", organization.id);

            if (error && isMissingColumnError(error, "itinerary_template")) {
                const fallbackPayload = {
                    name: organization.name,
                    logo_url: organization.logo_url,
                    primary_color: organization.primary_color,
                };
                const fallbackResult = await supabase
                    .from("organizations")
                    .update(fallbackPayload)
                    .eq("id", organization.id);
                error = fallbackResult.error;
            }

            if (error) throw error;

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            toast({
                title: "Settings saved",
                description: "Organization settings were updated.",
                variant: "success",
            });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({
                title: "Save failed",
                description: "Failed to save settings. Please try again.",
                variant: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const toggleWorkflowRule = (stage: string) => {
        setWorkflowRules((prev) =>
            prev.map((rule) =>
                rule.lifecycle_stage === stage
                    ? { ...rule, notify_client: !rule.notify_client }
                    : rule
            )
        );
    };

    const updateBillingAddressField = (
        field: keyof Organization["billing_address"],
        value: string
    ) => {
        setOrganization((prev) =>
            prev
                ? {
                    ...prev,
                    billing_address: {
                        ...prev.billing_address,
                        [field]: value,
                    },
                }
                : null
        );
    };

    const saveWorkflowRules = async () => {
        setRulesSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            for (const rule of workflowRules) {
                const response = await fetch("/api/admin/workflow/rules", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.access_token || ""}`,
                    },
                    body: JSON.stringify(rule),
                });
                if (!response.ok) {
                    const payload = await response.json();
                    throw new Error(payload?.error || "Failed to save workflow rules");
                }
            }

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            toast({
                title: "Workflow rules saved",
                description: "Lifecycle notification rules were updated.",
                variant: "success",
            });
        } catch (error) {
            console.error("Error saving workflow rules:", error);
            toast({
                title: "Workflow save failed",
                description: error instanceof Error ? error.message : "Failed to save workflow rules",
                variant: "error",
            });
        } finally {
            setRulesSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-xs uppercase tracking-widest text-primary font-bold">Settings</span>
                        <h1 className="text-3xl font-serif text-secondary dark:text-white">Settings</h1>
                    </div>
                </div>
                <GlassFormSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <span className="text-xs uppercase tracking-widest text-primary font-bold">Settings</span>
                    <h1 className="text-3xl font-serif text-secondary dark:text-white">Settings</h1>
                    <p className="text-text-secondary mt-1">Manage your organization details and application preferences.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Organization Details */}
                <GlassCard padding="none" rounded="2xl">
                    <div className="p-6 border-b border-white/10 flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-secondary dark:text-white">Organization Details</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary dark:text-white">Company Name</label>
                                <GlassInput
                                    type="text"
                                    value={organization?.name || ""}
                                    onChange={(e) => setOrganization(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    placeholder="Enter company name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary dark:text-white">Organization Slug</label>
                                <GlassInput
                                    type="text"
                                    value={organization?.slug || ""}
                                    disabled
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-secondary dark:text-white">Logo URL</label>
                            <GlassInput
                                type="url"
                                value={organization?.logo_url || ""}
                                onChange={(e) => setOrganization(prev => prev ? { ...prev, logo_url: e.target.value } : null)}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary dark:text-white">GSTIN</label>
                                <GlassInput
                                    type="text"
                                    value={organization?.gstin || ""}
                                    onChange={(e) => setOrganization(prev => prev ? { ...prev, gstin: e.target.value.toUpperCase() } : null)}
                                    placeholder="27ABCDE1234F1Z5"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary dark:text-white">Billing State</label>
                                <GlassInput
                                    type="text"
                                    value={organization?.billing_state || ""}
                                    onChange={(e) => setOrganization(prev => prev ? { ...prev, billing_state: e.target.value } : null)}
                                    placeholder="Maharashtra"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-secondary dark:text-white">Billing Address Line 1</label>
                            <GlassInput
                                type="text"
                                value={organization?.billing_address.line1 || ""}
                                onChange={(e) => updateBillingAddressField("line1", e.target.value)}
                                placeholder="Street, Area, Building"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-secondary dark:text-white">Billing Address Line 2</label>
                            <GlassInput
                                type="text"
                                value={organization?.billing_address.line2 || ""}
                                onChange={(e) => updateBillingAddressField("line2", e.target.value)}
                                placeholder="Landmark (optional)"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-secondary dark:text-white">City</label>
                                <GlassInput
                                    type="text"
                                    value={organization?.billing_address.city || ""}
                                    onChange={(e) => updateBillingAddressField("city", e.target.value)}
                                    placeholder="Mumbai"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary dark:text-white">Postal Code</label>
                                <GlassInput
                                    type="text"
                                    value={organization?.billing_address.postal_code || ""}
                                    onChange={(e) => updateBillingAddressField("postal_code", e.target.value)}
                                    placeholder="400001"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary dark:text-white">Country</label>
                                <GlassInput
                                    type="text"
                                    value={organization?.billing_address.country || ""}
                                    onChange={(e) => updateBillingAddressField("country", e.target.value)}
                                    placeholder="India"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary dark:text-white">Billing Contact Email</label>
                                <GlassInput
                                    type="email"
                                    value={organization?.billing_address.email || ""}
                                    onChange={(e) => updateBillingAddressField("email", e.target.value)}
                                    placeholder="billing@yourcompany.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-secondary dark:text-white">Billing Contact Phone</label>
                                <GlassInput
                                    type="text"
                                    value={organization?.billing_address.phone || ""}
                                    onChange={(e) => updateBillingAddressField("phone", e.target.value)}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Branding & Theme */}
                <GlassCard padding="none" rounded="2xl">
                    <div className="p-6 border-b border-white/10 flex items-center gap-3">
                        <Palette className="w-5 h-5 text-purple-500" />
                        <h2 className="font-bold text-secondary dark:text-white">Branding & Theme</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="space-y-2 flex-1">
                                <label className="text-sm font-semibold text-secondary dark:text-white">Primary Brand Color</label>
                                <div className="flex gap-3">
                                    <input
                                        type="color"
                                        value={organization?.primary_color || "#00D084"}
                                        onChange={(e) => setOrganization(prev => prev ? { ...prev, primary_color: e.target.value } : null)}
                                        className="w-10 h-10 border-none rounded cursor-pointer"
                                    />
                                    <GlassInput
                                        type="text"
                                        value={organization?.primary_color || ""}
                                        onChange={(e) => setOrganization(prev => prev ? { ...prev, primary_color: e.target.value } : null)}
                                        placeholder="#00D084"
                                    />
                                </div>
                            </div>
                            <div className="w-32 h-32 bg-white/10 dark:bg-white/5 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 p-4">
                                <div
                                    className="w-full h-8 rounded shadow-sm"
                                    style={{ backgroundColor: organization?.primary_color || "#00D084" }}
                                ></div>
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest text-center">
                                    Primary Color Preview
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-secondary dark:text-white">Default Itinerary PDF Template</label>
                            <select
                                value={organization?.itinerary_template || "safari_story"}
                                onChange={(e) =>
                                    setOrganization((prev) =>
                                        prev
                                            ? {
                                                ...prev,
                                                itinerary_template: e.target.value as ItineraryTemplateId,
                                            }
                                            : null
                                    )
                                }
                                className="w-full rounded-xl border border-white/20 bg-white/15 dark:bg-white/5 px-3 py-2 text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {ITINERARY_TEMPLATE_OPTIONS.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label} - {option.description}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-text-secondary">
                                This template is pre-selected for itinerary PDF exports. Users can still switch templates during download.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Integrations */}
                <GlassCard padding="none" rounded="2xl">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link2 className="w-5 h-5 text-emerald-500" />
                            <div>
                                <h2 className="font-bold text-secondary dark:text-white">Service Integrations</h2>
                                <p className="text-xs text-text-muted mt-0.5">Connect your existing tools. Get the inbox working in minutes — no API approvals needed.</p>
                            </div>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold border border-primary/20">Premium Add-ons</span>
                    </div>
                    <div className="p-6 space-y-8">

                        {/* ── Messaging ─────────────────────────────────────── */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Messaging</p>
                            <div className="space-y-3">
                                {/* WhatsApp — Hero */}
                                <div className="p-5 border-2 border-[#25D366]/30 bg-[#25D366]/5 rounded-2xl flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-lg shadow-[#25D366]/30">
                                        <MessageCircle className="w-6 h-6 text-white fill-current" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-secondary dark:text-white">WhatsApp</h4>
                                            <span className="text-[9px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Recommended</span>
                                            {isWhatsAppConnected && (
                                                <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                            )}
                                        </div>
                                        {isWhatsAppConnected && whatsAppProfile ? (
                                            <p className="text-xs text-[#1da650] font-semibold leading-relaxed">
                                                {whatsAppProfile.name} · {whatsAppProfile.number}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-text-muted leading-relaxed">Use your current WhatsApp number — scan a QR code to link your device. No Meta Business API or approval required.</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <GlassButton
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setIsWhatsAppConnectOpen(true)}
                                            className={cn(
                                                'text-xs font-bold',
                                                isWhatsAppConnected
                                                    ? 'border-[#25D366]/30 text-[#1da650] bg-[#25D366]/10 border'
                                                    : 'bg-[#25D366] text-white border-transparent hover:bg-[#20bd5a]'
                                            )}
                                        >
                                            {isWhatsAppConnected ? 'Manage' : 'Scan QR Code'}
                                        </GlassButton>
                                        {isWhatsAppConnected && (
                                            <button
                                                type="button"
                                                onClick={() => { void handleDisconnectWhatsApp(); }}
                                                className="text-[10px] text-red-500 hover:text-red-700 transition-colors font-medium"
                                            >
                                                Disconnect
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Gmail */}
                                <div className="p-5 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-white/5">
                                    <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-bold text-secondary dark:text-white">Gmail</h4>
                                            {isGmailConnected && (
                                                <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-muted">Manage email enquiries and send confirmations directly from the unified inbox.</p>
                                    </div>
                                    <GlassButton
                                        type="button"
                                        variant={isGmailConnected ? 'outline' : 'secondary'}
                                        size="sm"
                                        onClick={() => { if (!isGmailConnected) window.location.href = '/api/social/oauth/google'; }}
                                        className={cn('text-xs shrink-0', isGmailConnected ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : '')}
                                    >
                                        {isGmailConnected ? 'Connected ✓' : 'Connect Google'}
                                    </GlassButton>
                                </div>
                            </div>
                        </div>

                        {/* ── Payments ──────────────────────────────────────── */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Payments</p>
                            <div className="p-5 border border-white/10 rounded-2xl bg-white/5">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <IndianRupee className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-bold text-secondary dark:text-white">UPI</h4>
                                            {isUpiSaved && (
                                                <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Saved</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-muted">Add your UPI ID to include payment links in WhatsApp messages and proposals.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        placeholder="yourname@upi or yourname@bank"
                                        className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                                    />
                                    <GlassButton
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={() => { void handleSaveUpi(); }}
                                        disabled={isUpiSaving || !upiId.trim()}
                                        className="text-xs px-5"
                                    >
                                        {isUpiSaving ? 'Saving…' : 'Save'}
                                    </GlassButton>
                                </div>
                            </div>
                        </div>

                        {/* ── Reviews & Discovery ────────────────────────────── */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Reviews & Discovery</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 border border-white/10 rounded-2xl hover:border-primary/30 transition-colors bg-white/5 flex flex-col gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Building2 className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-secondary dark:text-white text-sm">Google Business</h4>
                                        <p className="text-xs text-text-muted mt-1">Respond to reviews and manage your listing from the dashboard.</p>
                                    </div>
                                    <GlassButton
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { window.location.href = '/api/social/oauth/google'; }}
                                        className="text-xs w-full mt-auto"
                                    >
                                        Connect
                                    </GlassButton>
                                </div>
                                <div className="p-4 border border-white/10 rounded-2xl hover:border-primary/30 transition-colors bg-white/5 flex flex-col gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-secondary dark:text-white text-sm">
                                            TripAdvisor
                                            {isTripAdvisorConnected && (
                                                <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-text-muted mt-1">
                                            {isTripAdvisorConnected && tripAdvisorName ? tripAdvisorName : 'Sync your listing and pull review data into the reputation tab.'}
                                        </p>
                                    </div>
                                    {!isTripAdvisorConnected && showTripAdvisorInput ? (
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="text"
                                                value={tripAdvisorLocationInput}
                                                onChange={(e) => setTripAdvisorLocationInput(e.target.value)}
                                                placeholder="Location ID (e.g. 297606)"
                                                className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                            <GlassButton
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                onClick={() => { void handleConnectTripAdvisor(); }}
                                                disabled={isTripAdvisorConnecting || !tripAdvisorLocationInput.trim()}
                                                className="text-xs w-full"
                                            >
                                                {isTripAdvisorConnecting ? 'Connecting…' : 'Save Location ID'}
                                            </GlassButton>
                                        </div>
                                    ) : (
                                        <GlassButton
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { if (!isTripAdvisorConnected) setShowTripAdvisorInput(true); }}
                                            className={cn('text-xs w-full mt-auto', isTripAdvisorConnected ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : '')}
                                        >
                                            {isTripAdvisorConnected ? 'Connected ✓' : 'Connect'}
                                        </GlassButton>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Social Media ──────────────────────────────────── */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Social Media</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 border border-white/10 rounded-2xl hover:border-primary/30 transition-colors bg-white/5 flex flex-col gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                        <Instagram className="w-4 h-4 text-pink-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-secondary dark:text-white text-sm">
                                            Instagram
                                            {isInstagramConnected && (
                                                <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-text-muted mt-1">Import leads from DMs and comments into the CRM automatically.</p>
                                    </div>
                                    <GlassButton
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { if (!isInstagramConnected) window.location.href = '/api/social/oauth/facebook'; }}
                                        className={cn('text-xs w-full mt-auto', isInstagramConnected ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : '')}
                                    >
                                        {isInstagramConnected ? 'Connected ✓' : 'Connect'}
                                    </GlassButton>
                                </div>
                                <div className="p-4 border border-white/10 rounded-2xl hover:border-primary/30 transition-colors bg-white/5 flex flex-col gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Linkedin className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-secondary dark:text-white text-sm">
                                            LinkedIn
                                            {isLinkedInConnected && (
                                                <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Connected</span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-text-muted mt-1">Sync corporate travel enquiries and company contacts.</p>
                                    </div>
                                    <GlassButton
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { if (!isLinkedInConnected) window.location.href = '/api/social/oauth/linkedin'; }}
                                        className={cn('text-xs w-full mt-auto', isLinkedInConnected ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : '')}
                                    >
                                        {isLinkedInConnected ? 'Connected ✓' : 'Connect'}
                                    </GlassButton>
                                </div>
                            </div>
                        </div>

                        {/* ── Maps & Data ────────────────────────────────────── */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3">Maps & Data</p>
                            <div className="p-4 border border-white/10 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-colors bg-white/5">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Globe className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-secondary dark:text-white text-sm">
                                        Google Places & Maps
                                        {isPlacesEnabled && (
                                            <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">● Active</span>
                                        )}
                                    </h4>
                                    <p className="text-xs text-text-muted mt-0.5">Geospatial mapping and point-of-interest data for itinerary building.</p>
                                </div>
                                <GlassButton
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { if (!isPlacesEnabled) void handleActivatePlaces(); }}
                                    disabled={isPlacesActivating || isPlacesEnabled}
                                    className={cn('text-xs shrink-0', isPlacesEnabled ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : '')}
                                >
                                    {isPlacesActivating ? 'Activating…' : isPlacesEnabled ? 'Active ✓' : 'Activate'}
                                </GlassButton>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Lifecycle Notification Rules */}
                <GlassCard padding="none" rounded="2xl">
                    <div className="p-6 border-b border-white/10 flex items-center gap-3">
                        <Bell className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-secondary dark:text-white">Lifecycle Notification Rules</h2>
                    </div>
                    <div className="p-6 space-y-3">
                        <p className="text-sm text-text-secondary">
                            Control whether clients receive automatic WhatsApp + app notifications when moved to each lifecycle stage.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {workflowRules.map((rule) => (
                                <div key={rule.lifecycle_stage} className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 dark:bg-white/5 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-secondary dark:text-white">
                                            {workflowStageLabels[rule.lifecycle_stage] || rule.lifecycle_stage}
                                        </p>
                                        <p className="text-xs text-text-secondary">{rule.lifecycle_stage}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleWorkflowRule(rule.lifecycle_stage)}
                                        className={`w-12 h-7 rounded-full relative transition-colors ${rule.notify_client ? "bg-primary" : "bg-white/30 dark:bg-white/10"}`}
                                        aria-label={`Toggle ${rule.lifecycle_stage}`}
                                    >
                                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${rule.notify_client ? "right-1" : "left-1"}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <GlassButton
                                type="button"
                                variant="primary"
                                onClick={saveWorkflowRules}
                                disabled={rulesSaving}
                            >
                                {rulesSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Save Notification Rules
                            </GlassButton>
                        </div>
                    </div>
                </GlassCard>

                {/* Application Config (ReadOnly in this demo) */}
                <GlassCard padding="none" rounded="2xl" className="opacity-60">
                    <div className="p-6 border-b border-white/10 flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <h2 className="font-bold text-secondary dark:text-white">System Configuration</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 rounded-xl border border-white/20">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-text-secondary" />
                                <div>
                                    <p className="text-sm font-bold text-secondary dark:text-white">Push Notifications</p>
                                    <p className="text-xs text-text-secondary">Global kill switch</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 bg-primary rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 rounded-xl border border-white/20">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-text-secondary" />
                                <div>
                                    <p className="text-sm font-bold text-secondary dark:text-white">Two-Factor Auth</p>
                                    <p className="text-xs text-text-secondary">Security requirement</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 bg-white/30 dark:bg-white/10 rounded-full relative">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <div className="flex items-center justify-end gap-4 pt-4">
                    {showSuccess && (
                        <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium animate-in fade-in slide-in-from-right-4">
                            <Check className="w-5 h-5" />
                            Settings saved successfully
                        </span>
                    )}
                    <GlassButton
                        type="submit"
                        variant="primary"
                        disabled={saving}
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Save Changes
                    </GlassButton>
                </div>
            </form>

            <WhatsAppConnectModal
                isOpen={isWhatsAppConnectOpen}
                onClose={() => setIsWhatsAppConnectOpen(false)}
                onConnected={() => setIsWhatsAppConnected(true)}
            />
        </div>
    );
}
