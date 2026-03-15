"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Settings, Save } from "lucide-react";
import { normalizeItineraryTemplateId } from "@/components/pdf/itinerary-types";
import { createClient } from "@/lib/supabase/client";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassFormSkeleton } from "@/components/glass/GlassSkeleton";
import { useToast } from "@/components/ui/toast";
import { WhatsAppConnectModal } from "@/components/whatsapp/WhatsAppConnectModal";
import { BrandingThemeSection } from "./_components/BrandingThemeSection";
import { OrganizationDetailsSection } from "./_components/OrganizationDetailsSection";
import { SettingsIntegrationsSection } from "./_components/SettingsIntegrationsSection";
import { WorkflowRulesSection } from "./_components/WorkflowRulesSection";
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

export default function SettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [isWhatsAppConnectOpen, setIsWhatsAppConnectOpen] = useState(false);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [whatsAppProfile, setWhatsAppProfile] = useState<WhatsAppProfile | null>(null);
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
        supabase.from('social_connections').select('platform').in('platform', ['google', 'linkedin', 'instagram', 'facebook']),
        fetch('/api/settings/upi'),
        fetch('/api/integrations/places'),
      ]);

      if (connections) {
        const platforms = new Set(connections.map((connection: { platform: string }) => connection.platform));
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
  }, [supabase]);

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
      const response = await fetch('/api/integrations/tripadvisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: tripAdvisorLocationInput.trim() }),
      });
      const data = (await response.json()) as { success?: boolean; locationName?: string; error?: string };
      if (!response.ok || !data.success) {
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
      const response = await fetch('/api/integrations/places', { method: 'POST' });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
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
      const response = await fetch('/api/settings/upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upiId: upiId.trim() }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
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
      const { data, error } = await supabase.from("organizations").select(ORGANIZATION_SETTINGS_SELECT).single();
      if (error) throw error;
      const organizationRow = data as unknown as OrganizationSettingsRow | null;
      if (!organizationRow) throw new Error("Organization not found");

      const orgRecord = organizationRow as unknown as Record<string, unknown>;
      setOrganization({
        ...organizationRow,
        itinerary_template: normalizeItineraryTemplateId(
          typeof orgRecord.itinerary_template === 'string' ? orgRecord.itinerary_template : null
        ),
        gstin: typeof orgRecord.gstin === 'string' ? orgRecord.gstin : null,
        billing_state: typeof orgRecord.billing_state === 'string' ? orgRecord.billing_state : null,
        billing_address: normalizeBillingAddress(orgRecord.billing_address),
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const rulesResponse = await fetch("/api/admin/workflow/rules", {
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
      });
      const rulesPayload = await rulesResponse.json();
      if (rulesResponse.ok) {
        setWorkflowRules(rulesPayload.rules || []);
      }
    } catch (error) {
      logError("Error fetching settings", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

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
    setWorkflowRules((previous) =>
      previous.map((rule) =>
        rule.lifecycle_stage === stage ? { ...rule, notify_client: !rule.notify_client } : rule
      )
    );
  };

  const updateBillingAddressField = (field: keyof Organization["billing_address"], value: string) => {
    setOrganization((previous) =>
      previous
        ? {
            ...previous,
            billing_address: {
              ...previous.billing_address,
              [field]: value,
            },
          }
        : null
    );
  };

  const saveWorkflowRules = async () => {
    setRulesSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      toast({ title: "Workflow rules saved", description: "Lifecycle notification rules were updated.", variant: "success" });
    } catch (error) {
      logError("Error saving workflow rules", error);
      toast({ title: "Workflow save failed", description: error instanceof Error ? error.message : "Failed to save workflow rules", variant: "error" });
    } finally {
      setRulesSaving(false);
    }
  };

  if (loading || !organization) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/20">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Settings</span>
            <h1 className="text-3xl font-serif text-secondary dark:text-white">Settings</h1>
          </div>
        </div>
        <GlassFormSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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

      <form onSubmit={handleSave} className="space-y-6">
        <OrganizationDetailsSection organization={organization} setOrganization={setOrganization} updateBillingAddressField={updateBillingAddressField} />
        <BrandingThemeSection organization={organization} setOrganization={setOrganization} />
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
        <WorkflowRulesSection
          workflowRules={workflowRules}
          rulesSaving={rulesSaving}
          toggleWorkflowRule={toggleWorkflowRule}
          saveWorkflowRules={() => void saveWorkflowRules()}
        />

        <div className="flex items-center justify-end gap-4 pt-4">
          {showSuccess ? (
            <span className="animate-in fade-in slide-in-from-right-4 flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
              <Check className="h-5 w-5" />
              Settings saved successfully
            </span>
          ) : null}
          <GlassButton type="submit" variant="primary" disabled={saving}>
            {saving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="h-5 w-5" />
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
