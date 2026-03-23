"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2, Check, Settings, Save, Award, Palette,
  MessageCircle, IndianRupee, Star, Share2, MapPin, Bell,
} from "lucide-react";
import { normalizeItineraryTemplateId } from "@/components/pdf/itinerary-types";
import { createClient } from "@/lib/supabase/client";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassFormSkeleton } from "@/components/glass/GlassSkeleton";
import { GlassCard } from "@/components/glass/GlassCard";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WhatsAppConnectModal } from "@/components/whatsapp/WhatsAppConnectModal";
import { SetupGuide } from "@/components/dashboard/SetupGuide";
import { GuidedTour } from '@/components/tour/GuidedTour';
import { BrandingThemeSection } from "./_components/BrandingThemeSection";
import { OrganizationDetailsSection } from "./_components/OrganizationDetailsSection";
import { WorkflowRulesSection } from "./_components/WorkflowRulesSection";
import { MessagingTab } from "./_components/MessagingTab";
import { PaymentsTab } from "./_components/PaymentsTab";
import { ReviewsTab } from "./_components/ReviewsTab";
import { SocialTab } from "./_components/SocialTab";
import { MapsTab } from "./_components/MapsTab";
import {
  isMissingColumnError,
  normalizeBillingAddress,
  ORGANIZATION_SETTINGS_SELECT,
  type Organization,
  type OrganizationSettingsRow,
  type WhatsAppProfile,
  type WorkflowRule,
} from "./shared";
import { logError } from "@/lib/observability/logger";

type SettingsTab = "organization" | "branding" | "messaging" | "payments" | "reviews" | "social" | "maps" | "notifications";

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof Building2 }> = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "messaging", label: "Messaging", icon: MessageCircle },
  { id: "payments", label: "Payments", icon: IndianRupee },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "maps", label: "Maps & Data", icon: MapPin },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const SETUP_TO_TAB: Record<string, SettingsTab> = {
  brand: "branding",
  whatsapp: "messaging",
  gmail: "messaging",
  upi: "payments",
  tripadvisor: "reviews",
  instagram: "social",
  linkedin: "social",
  places: "maps",
};

export default function SettingsPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Tab state
  const initialTab = (() => {
    const tabParam = searchParams.get("tab") as SettingsTab | null;
    if (tabParam && TABS.some((t) => t.id === tabParam)) return tabParam;
    const setup = searchParams.get("setup");
    if (setup && SETUP_TO_TAB[setup]) return SETUP_TO_TAB[setup];
    return "organization" as SettingsTab;
  })();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Organization state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Workflow rules
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [rulesSaving, setRulesSaving] = useState(false);

  // WhatsApp
  const [isWhatsAppConnectOpen, setIsWhatsAppConnectOpen] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [whatsAppProfile, setWhatsAppProfile] = useState<WhatsAppProfile | null>(null);

  // Social connections
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);

  // TripAdvisor
  const [isTripAdvisorConnected, setIsTripAdvisorConnected] = useState(false);
  const [tripAdvisorName, setTripAdvisorName] = useState("");
  const [tripAdvisorLocationInput, setTripAdvisorLocationInput] = useState("");
  const [showTripAdvisorInput, setShowTripAdvisorInput] = useState(false);
  const [isTripAdvisorConnecting, setIsTripAdvisorConnecting] = useState(false);

  // Google Places
  const [isPlacesEnabled, setIsPlacesEnabled] = useState(false);
  const [isPlacesActivating, setIsPlacesActivating] = useState(false);

  // UPI
  const [upiId, setUpiId] = useState("");
  const [isUpiSaved, setIsUpiSaved] = useState(false);
  const [isUpiSaving, setIsUpiSaving] = useState(false);

  // Contributor badge
  const [contributorBadgeTier, setContributorBadgeTier] = useState<string | null>(null);

  // --- Data fetching ---

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("whatsapp_connections")
        .select("status, phone_number, display_name")
        .eq("status", "connected")
        .maybeSingle();
      if (data) {
        setIsWhatsAppConnected(true);
        setWhatsAppProfile({ number: data.phone_number ?? "", name: data.display_name ?? "" });
      }
    })();
  }, [supabase]);

  useEffect(() => {
    void (async () => {
      const [{ data: connections }, upiRes, placesRes] = await Promise.all([
        supabase.from("social_connections").select("platform").in("platform", ["google", "linkedin", "instagram", "facebook"]),
        fetch("/api/settings/upi"),
        fetch("/api/integrations/places"),
      ]);

      if (connections) {
        const platforms = new Set(connections.map((c: { platform: string }) => c.platform));
        setIsGmailConnected(platforms.has("google"));
        setIsLinkedInConnected(platforms.has("linkedin"));
        setIsInstagramConnected(platforms.has("instagram") || platforms.has("facebook"));
      }

      if (upiRes.ok) {
        const upiData = (await upiRes.json()) as { upiId?: string | null };
        if (upiData.upiId) { setUpiId(upiData.upiId); setIsUpiSaved(true); }
      }

      if (placesRes.ok) {
        const placesData = (await placesRes.json()) as { enabled?: boolean };
        setIsPlacesEnabled(placesData.enabled ?? false);
      }

      const { data: orgSettings } = await supabase
        .from("organization_settings")
        .select("tripadvisor_location_id")
        .maybeSingle();
      if (orgSettings?.tripadvisor_location_id) setIsTripAdvisorConnected(true);
    })();
  }, [supabase]);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("organizations").select(ORGANIZATION_SETTINGS_SELECT).single();
      if (error) throw error;
      const organizationRow = data as unknown as OrganizationSettingsRow | null;
      if (!organizationRow) throw new Error("Organization not found");

      const orgRecord = organizationRow as unknown as Record<string, unknown>;
      setOrganization({
        ...organizationRow,
        itinerary_template: normalizeItineraryTemplateId(
          typeof orgRecord.itinerary_template === "string" ? orgRecord.itinerary_template : null
        ),
        gstin: typeof orgRecord.gstin === "string" ? orgRecord.gstin : null,
        billing_state: typeof orgRecord.billing_state === "string" ? orgRecord.billing_state : null,
        billing_address: normalizeBillingAddress(orgRecord.billing_address),
      });

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("contributor_badge_tier" as never)
          .eq("id", session.user.id)
          .maybeSingle();
        const profileRecord = profile as unknown as { contributor_badge_tier?: string } | null;
        if (profileRecord?.contributor_badge_tier && profileRecord.contributor_badge_tier !== "none") {
          setContributorBadgeTier(profileRecord.contributor_badge_tier);
        }
      }

      const rulesResponse = await fetch("/api/admin/workflow/rules", {
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
      });
      const rulesPayload = await rulesResponse.json();
      if (rulesResponse.ok) setWorkflowRules(rulesPayload.rules || []);
    } catch (error) {
      logError("Error fetching settings", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void fetchSettings(); }, [fetchSettings]);

  // --- Handlers ---

  const handleDisconnectWhatsApp = async () => {
    try {
      const response = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("Disconnect failed");
      setIsWhatsAppConnected(false);
      setWhatsAppProfile(null);
      toast({ title: "WhatsApp disconnected", variant: "success" });
    } catch {
      toast({ title: "Failed to disconnect WhatsApp", variant: "error" });
    }
  };

  const handleConnectTripAdvisor = async () => {
    if (!tripAdvisorLocationInput.trim()) return;
    setIsTripAdvisorConnecting(true);
    try {
      const response = await fetch("/api/integrations/tripadvisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId: tripAdvisorLocationInput.trim() }),
      });
      const data = (await response.json()) as { success?: boolean; locationName?: string; error?: string };
      if (!response.ok || !data.success) {
        toast({ title: "TripAdvisor connect failed", description: data.error ?? "Invalid location ID", variant: "error" });
        return;
      }
      setIsTripAdvisorConnected(true);
      setTripAdvisorName(data.locationName ?? "");
      setShowTripAdvisorInput(false);
      toast({ title: "TripAdvisor connected", description: data.locationName ?? "", variant: "success" });
    } catch {
      toast({ title: "TripAdvisor connect failed", variant: "error" });
    } finally {
      setIsTripAdvisorConnecting(false);
    }
  };

  const handleActivatePlaces = async () => {
    setIsPlacesActivating(true);
    try {
      const response = await fetch("/api/integrations/places", { method: "POST" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toast({ title: "Activation failed", description: data.error ?? "Could not activate Google Places", variant: "error" });
        return;
      }
      setIsPlacesEnabled(true);
      toast({ title: "Google Places activated", variant: "success" });
    } catch {
      toast({ title: "Activation failed", variant: "error" });
    } finally {
      setIsPlacesActivating(false);
    }
  };

  const handleSaveUpi = async () => {
    if (!upiId.trim()) return;
    setIsUpiSaving(true);
    try {
      const response = await fetch("/api/settings/upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId: upiId.trim() }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        toast({ title: "Save failed", description: data.error ?? "Invalid UPI ID", variant: "error" });
        return;
      }
      setIsUpiSaved(true);
      toast({ title: "UPI ID saved", description: `Payment links will use ${upiId}`, variant: "success" });
    } catch {
      toast({ title: "Failed to save UPI ID", variant: "error" });
    } finally {
      setIsUpiSaving(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
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
        billing_address: { ...organization.billing_address },
      };
      let { error } = await supabase.from("organizations").update(updatePayload).eq("id", organization.id);
      if (error && isMissingColumnError(error, "itinerary_template")) {
        const fallbackResult = await supabase
          .from("organizations")
          .update({ name: organization.name, logo_url: organization.logo_url, primary_color: organization.primary_color })
          .eq("id", organization.id);
        error = fallbackResult.error;
      }
      if (error) throw error;
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast({ title: "Settings saved", description: "Organization settings were updated.", variant: "success" });
    } catch (error) {
      logError("Error saving settings", error);
      toast({ title: "Save failed", description: "Failed to save settings. Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkflowRule = (stage: string) => {
    setWorkflowRules((prev) =>
      prev.map((rule) => (rule.lifecycle_stage === stage ? { ...rule, notify_client: !rule.notify_client } : rule))
    );
  };

  const updateBillingAddressField = (field: keyof Organization["billing_address"], value: string) => {
    setOrganization((prev) => prev ? { ...prev, billing_address: { ...prev.billing_address, [field]: value } } : null);
  };

  const saveWorkflowRules = async () => {
    setRulesSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      for (const rule of workflowRules) {
        const response = await fetch("/api/admin/workflow/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
          body: JSON.stringify(rule),
        });
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload?.error || "Failed to save workflow rules");
        }
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast({ title: "Workflow rules saved", description: "Lifecycle notification rules were updated.", variant: "success" });
    } catch (error) {
      logError("Error saving workflow rules", error);
      toast({ title: "Workflow save failed", description: error instanceof Error ? error.message : "Failed to save workflow rules", variant: "error" });
    } finally {
      setRulesSaving(false);
    }
  };

  // --- Loading & empty states ---

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <SettingsHeader />
        <GlassFormSkeleton />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <SettingsHeader />
        <SetupGuide />
        <GlassCard padding="lg">
          <div className="text-center py-8">
            <Settings className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No organization found</p>
            <p className="text-xs text-gray-500 mt-1">
              Complete onboarding to set up your organization, or refresh the page to try again.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- Main render ---

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <GuidedTour />
      <SettingsHeader />

      {contributorBadgeTier && (
        <GlassCard className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Template Contributor</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You&apos;re earning contributor badges by sharing quality templates with the community
            </p>
          </div>
          <Badge
            variant="outline"
            className={`text-xs font-bold uppercase ${
              contributorBadgeTier === "gold"
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                : contributorBadgeTier === "silver"
                ? "border-slate-400 bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                : "border-orange-600 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
            }`}
          >
            {contributorBadgeTier} Tier
          </Badge>
        </GlassCard>
      )}

      <SetupGuide />

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar navigation */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                      : "text-text-secondary hover:bg-white/80 hover:text-secondary hover:shadow-sm dark:hover:bg-white/10"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white/80" : "text-text-muted")} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab content */}
        <main className="flex-1 w-full min-w-0">
          <GlassCard padding="lg" className="min-h-[500px]">
            {activeTab === "organization" && (
              <form onSubmit={handleSave} className="space-y-6">
                <OrganizationDetailsSection
                  organization={organization}
                  setOrganization={setOrganization}
                  updateBillingAddressField={updateBillingAddressField}
                />
                <SaveButton saving={saving} showSuccess={showSuccess} />
              </form>
            )}

            {activeTab === "branding" && (
              <form onSubmit={handleSave} className="space-y-6">
                <BrandingThemeSection organization={organization} setOrganization={setOrganization} />
                <SaveButton saving={saving} showSuccess={showSuccess} />
              </form>
            )}

            {activeTab === "messaging" && (
              <MessagingTab
                isWhatsAppConnected={isWhatsAppConnected}
                isGmailConnected={isGmailConnected}
                whatsAppProfile={whatsAppProfile}
                setIsWhatsAppConnectOpen={setIsWhatsAppConnectOpen}
                handleDisconnectWhatsApp={handleDisconnectWhatsApp}
              />
            )}

            {activeTab === "payments" && (
              <PaymentsTab
                upiId={upiId}
                isUpiSaved={isUpiSaved}
                isUpiSaving={isUpiSaving}
                setUpiId={setUpiId}
                handleSaveUpi={handleSaveUpi}
              />
            )}

            {activeTab === "reviews" && (
              <ReviewsTab
                isTripAdvisorConnected={isTripAdvisorConnected}
                isTripAdvisorConnecting={isTripAdvisorConnecting}
                tripAdvisorName={tripAdvisorName}
                tripAdvisorLocationInput={tripAdvisorLocationInput}
                showTripAdvisorInput={showTripAdvisorInput}
                setShowTripAdvisorInput={setShowTripAdvisorInput}
                setTripAdvisorLocationInput={setTripAdvisorLocationInput}
                handleConnectTripAdvisor={handleConnectTripAdvisor}
              />
            )}

            {activeTab === "social" && (
              <SocialTab
                isInstagramConnected={isInstagramConnected}
                isLinkedInConnected={isLinkedInConnected}
              />
            )}

            {activeTab === "maps" && (
              <MapsTab
                isPlacesEnabled={isPlacesEnabled}
                isPlacesActivating={isPlacesActivating}
                handleActivatePlaces={handleActivatePlaces}
              />
            )}

            {activeTab === "notifications" && (
              <WorkflowRulesSection
                workflowRules={workflowRules}
                rulesSaving={rulesSaving}
                toggleWorkflowRule={toggleWorkflowRule}
                saveWorkflowRules={() => void saveWorkflowRules()}
              />
            )}
          </GlassCard>
        </main>
      </div>

      <WhatsAppConnectModal
        isOpen={isWhatsAppConnectOpen}
        onClose={() => setIsWhatsAppConnectOpen(false)}
        onConnected={() => setIsWhatsAppConnected(true)}
      />
    </div>
  );
}

function SettingsHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
        <Settings className="h-5 w-5 text-primary" />
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Settings</span>
        <h1 className="text-3xl font-serif text-secondary dark:text-white">Settings</h1>
        <p className="mt-1 text-text-secondary">Manage your organization details and application preferences.</p>
      </div>
    </div>
  );
}

function SaveButton({ saving, showSuccess }: { saving: boolean; showSuccess: boolean }) {
  return (
    <div className="flex items-center justify-end gap-4 pt-4">
      {showSuccess && (
        <span className="animate-in fade-in slide-in-from-right-4 flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
          <Check className="h-5 w-5" />
          Saved
        </span>
      )}
      <GlassButton type="submit" variant="primary" disabled={saving}>
        {saving ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Save className="h-5 w-5" />
        )}
        Save Changes
      </GlassButton>
    </div>
  );
}
