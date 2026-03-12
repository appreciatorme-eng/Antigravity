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
import { SettingsIntegrationsSection } from "./SettingsIntegrationsSection";
import {
    isMissingColumnError,
    normalizeBillingAddress,
    ORGANIZATION_SETTINGS_SELECT,
    type Organization,
    type OrganizationSettingsRow,
    type WhatsAppProfile,
    type WorkflowRule,
    workflowStageLabels,
} from "./shared";

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
    const [whatsAppProfile, setWhatsAppProfile] = useState<WhatsAppProfile | null>(null);

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

                <SettingsIntegrationsSection
                    handleActivatePlaces={handleActivatePlaces}
                    handleConnectTripAdvisor={handleConnectTripAdvisor}
                    handleDisconnectWhatsApp={handleDisconnectWhatsApp}
                    handleSaveUpi={handleSaveUpi}
                    isGmailConnected={isGmailConnected}
                    isInstagramConnected={isInstagramConnected}
                    isLinkedInConnected={isLinkedInConnected}
                    isPlacesActivating={isPlacesActivating}
                    isPlacesEnabled={isPlacesEnabled}
                    isTripAdvisorConnected={isTripAdvisorConnected}
                    isTripAdvisorConnecting={isTripAdvisorConnecting}
                    isUpiSaved={isUpiSaved}
                    isUpiSaving={isUpiSaving}
                    isWhatsAppConnected={isWhatsAppConnected}
                    setIsWhatsAppConnectOpen={setIsWhatsAppConnectOpen}
                    setShowTripAdvisorInput={setShowTripAdvisorInput}
                    setTripAdvisorLocationInput={setTripAdvisorLocationInput}
                    setUpiId={setUpiId}
                    showTripAdvisorInput={showTripAdvisorInput}
                    tripAdvisorLocationInput={tripAdvisorLocationInput}
                    tripAdvisorName={tripAdvisorName}
                    upiId={upiId}
                    whatsAppProfile={whatsAppProfile}
                />

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
