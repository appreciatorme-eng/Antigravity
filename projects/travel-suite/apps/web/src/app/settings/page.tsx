'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { normalizeItineraryTemplateId } from '@/components/pdf/itinerary-types';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassFormSkeleton } from '@/components/glass/GlassSkeleton';
import {
    User, Globe, CreditCard, Shield, Users, FileText,
    PlayCircle, Palette, MessageCircle, IndianRupee, Star,
    Share2, MapPin, Settings, Save, Check, Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { WhatsAppConnectModal } from '@/components/whatsapp/WhatsAppConnectModal';
import { DEFAULT_APP_TIMEZONE, getTimezoneDisplayName } from '@/lib/date/tz';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { Badge } from '@/components/ui/badge';
import { SetupGuide } from '@/components/dashboard/SetupGuide';
import { GuidedTour } from '@/components/tour/GuidedTour';
import { resetAllTours } from '@/lib/tour/tour-toggle-context';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { logError } from '@/lib/observability/logger';
import { OrganizationTab } from './_components/OrganizationTab';
import { ProfileTab } from './_components/ProfileTab';
import { SecurityTab } from './_components/SecurityTab';
import { TeamTab } from './_components/TeamTab';
import { EInvoicingTab } from './_components/EInvoicingTab';
import { BillingOverviewTab } from './_components/BillingOverviewTab';
import { MessagingSection } from './_components/MessagingSection';
import { MapsDataSection } from './_components/MapsDataSection';
import { BrandingThemeSection } from './_components/BrandingThemeSection';
import { PaymentsTab } from './_components/PaymentsTab';
import { ReviewsTab } from './_components/ReviewsTab';
import { SocialTab } from './_components/SocialTab';
import { WorkflowRulesSection } from './_components/WorkflowRulesSection';
import {
    isMissingColumnError,
    normalizeBillingAddress,
    ORGANIZATION_SETTINGS_SELECT,
    type Organization,
    type OrganizationSettingsRow,
    type WorkflowRule,
} from './shared';

type SettingsTab =
    | 'organization' | 'profile' | 'branding' | 'messaging' | 'payments'
    | 'e-invoicing' | 'reviews' | 'social' | 'maps' | 'billing' | 'security'
    | 'team' | 'notifications';

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof Globe }> = [
    { id: 'organization', label: 'Organization', icon: Globe },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'messaging', label: 'Messaging', icon: MessageCircle },
    { id: 'payments', label: 'Payments', icon: IndianRupee },
    { id: 'e-invoicing', label: 'E-Invoicing', icon: FileText },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'maps', label: 'Maps & Data', icon: MapPin },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users },
];

const SETUP_TO_TAB: Record<string, SettingsTab> = {
    brand: 'branding',
    whatsapp: 'messaging',
    gmail: 'messaging',
    upi: 'payments',
    tripadvisor: 'reviews',
    instagram: 'social',
    linkedin: 'social',
    places: 'maps',
};

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('settings');
    const { toast } = useToast();
    const supabase = createClient();
    const { timezone, saveTimezone, saving: savingTimezone, timezoneOptions } = useUserTimezone();

    // Tab state — support ?tab= and ?setup= query params
    const initialTab = (() => {
        const tabParam = searchParams.get('tab') as SettingsTab | null;
        if (tabParam && TABS.some((tab) => tab.id === tabParam)) return tabParam;
        const setup = searchParams.get('setup');
        if (setup && SETUP_TO_TAB[setup]) return SETUP_TO_TAB[setup];
        return 'organization' as SettingsTab;
    })();
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

    const [loading, setLoading] = useState(true);
    const [draftTimezone, setDraftTimezone] = useState(DEFAULT_APP_TIMEZONE);

    // Onboarding state
    const [isOnboardingIncomplete, setIsOnboardingIncomplete] = useState(false);

    // Organization state (for Branding tab)
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Workflow rules (Notifications tab)
    const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
    const [rulesSaving, setRulesSaving] = useState(false);

    // WhatsApp state
    const [isWhatsAppConnectOpen, setIsWhatsAppConnectOpen] = useState(false);
    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
    const [whatsAppProfile, setWhatsAppProfile] = useState<{
        number: string;
        name: string;
    } | null>(null);

    // Email state
    const [isGmailConnected, setIsGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState('');

    // Social connections
    const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
    const [isInstagramConnected, setIsInstagramConnected] = useState(false);

    // TripAdvisor
    const [isTripAdvisorConnected, setIsTripAdvisorConnected] = useState(false);
    const [tripAdvisorName, setTripAdvisorName] = useState('');
    const [tripAdvisorLocationInput, setTripAdvisorLocationInput] = useState('');
    const [showTripAdvisorInput, setShowTripAdvisorInput] = useState(false);
    const [isTripAdvisorConnecting, setIsTripAdvisorConnecting] = useState(false);

    // Google Places
    const [placesInitial, setPlacesInitial] = useState<{ enabled: boolean; googlePlaceId: string } | null>(null);

    // UPI
    const [upiId, setUpiId] = useState('');
    const [isUpiSaved, setIsUpiSaved] = useState(false);
    const [isUpiSaving, setIsUpiSaving] = useState(false);

    // Contributor badge
    const [contributorBadgeTier, setContributorBadgeTier] = useState<string | null>(null);

    // --- Data fetching ---

    // Onboarding status
    useEffect(() => {
        void (async () => {
            try {
                const response = await fetch('/api/onboarding/setup', { cache: 'no-store' });
                if (response.ok) {
                    const data = await response.json() as { onboardingComplete: boolean };
                    setIsOnboardingIncomplete(!data.onboardingComplete);
                }
            } catch {
                // Silently fail -- onboarding status is not critical
            }
        })();
    }, []);

    // WhatsApp connection status
    useEffect(() => {
        void (async () => {
            const { data } = await supabase
                .from('whatsapp_connections')
                .select('status, phone_number, display_name')
                .eq('status', 'connected')
                .maybeSingle();
            if (data) {
                setIsWhatsAppConnected(true);
                setWhatsAppProfile({
                    number: data.phone_number ?? '',
                    name: data.display_name ?? '',
                });
            }
        })();
    }, [supabase]);

    // Social connections, UPI, Places, TripAdvisor
    useEffect(() => {
        void (async () => {
            const [{ data: connections }, upiRes, placesRes] = await Promise.all([
                supabase
                    .from('social_connections')
                    .select('platform, platform_page_id')
                    .in('platform', ['google', 'imap', 'linkedin', 'instagram', 'facebook']),
                fetch('/api/settings/upi'),
                fetch('/api/integrations/places'),
            ]);

            if (connections) {
                const platforms = new Set(connections.map((c: { platform: string }) => c.platform));
                const hasEmail = platforms.has('google') || platforms.has('imap');
                setIsGmailConnected(hasEmail);
                const emailConn = connections.find(
                    (c: { platform: string; platform_page_id?: string }) => c.platform === 'google' || c.platform === 'imap'
                ) as { platform_page_id?: string } | undefined;
                if (emailConn?.platform_page_id) setGmailEmail(emailConn.platform_page_id);
                setIsLinkedInConnected(platforms.has('linkedin'));
                setIsInstagramConnected(platforms.has('instagram') || platforms.has('facebook'));
            }

            if (upiRes.ok) {
                const upiData = (await upiRes.json()) as { upiId?: string | null };
                if (upiData.upiId) { setUpiId(upiData.upiId); setIsUpiSaved(true); }
            }

            if (placesRes.ok) {
                const placesData = (await placesRes.json()) as { enabled?: boolean; googlePlaceId?: string };
                setPlacesInitial({
                    enabled: placesData.enabled ?? false,
                    googlePlaceId: placesData.googlePlaceId ?? '',
                });
            } else {
                setPlacesInitial({ enabled: false, googlePlaceId: '' });
            }

            // TripAdvisor status
            const { data: orgSettings } = await supabase
                .from('organization_settings')
                .select('tripadvisor_location_id')
                .maybeSingle();
            if (orgSettings?.tripadvisor_location_id) setIsTripAdvisorConnected(true);
        })();
    }, [supabase]);

    // Organization settings (for Branding tab & org details)
    const fetchSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('organizations').select(ORGANIZATION_SETTINGS_SELECT).single();
            if (error) throw error;
            const organizationRow = data as unknown as OrganizationSettingsRow | null;
            if (!organizationRow) throw new Error('Organization not found');

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

            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('contributor_badge_tier' as never)
                    .eq('id', session.user.id)
                    .maybeSingle();
                const profileRecord = profile as unknown as { contributor_badge_tier?: string } | null;
                if (profileRecord?.contributor_badge_tier && profileRecord.contributor_badge_tier !== 'none') {
                    setContributorBadgeTier(profileRecord.contributor_badge_tier);
                }
            }

            const rulesResponse = await fetch('/api/admin/workflow/rules', {
                headers: { Authorization: `Bearer ${session?.access_token || ''}` },
            });
            const rulesPayload = await rulesResponse.json();
            if (rulesResponse.ok) setWorkflowRules(rulesPayload.rules || []);
        } catch (error) {
            logError('Error fetching settings', error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => { void fetchSettings(); }, [fetchSettings]);

    useEffect(() => {
        setDraftTimezone(timezone);
    }, [timezone]);

    // --- Handlers ---

    const handleDisconnectWhatsApp = useCallback(async () => {
        try {
            const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
            if (!res.ok) throw new Error('Disconnect failed');
            setIsWhatsAppConnected(false);
            setWhatsAppProfile(null);
            toast({ title: t('messages.whatsappDisconnected'), variant: 'success' });
        } catch {
            toast({ title: t('messages.whatsappDisconnectFailed'), variant: 'error' });
        }
    }, [toast, t]);

    const handleSaveTimezone = useCallback(async () => {
        try {
            await saveTimezone(draftTimezone);
            toast({
                title: t('messages.timezoneSaved'),
                description: t('messages.timezoneSavedDescription', { timezone: getTimezoneDisplayName(draftTimezone) }),
                variant: 'success',
            });
        } catch {
            toast({
                title: t('messages.timezoneSaveFailed'),
                description: t('messages.timezoneSaveFailedDescription'),
                variant: 'error',
            });
        }
    }, [draftTimezone, saveTimezone, toast, t]);

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

    const handleSaveOrg = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!organization) return;
        setSaving(true);
        try {
            const updatePayload = {
                name: organization.name,
                logo_url: organization.logo_url,
                primary_color: organization.primary_color,
                itinerary_template: organization.itinerary_template || 'safari_story',
                gstin: organization.gstin || null,
                billing_state: organization.billing_state || null,
                billing_address: { ...organization.billing_address },
            };
            let { error } = await supabase.from('organizations').update(updatePayload).eq('id', organization.id);
            if (error && isMissingColumnError(error, 'itinerary_template')) {
                const fallbackResult = await supabase
                    .from('organizations')
                    .update({ name: organization.name, logo_url: organization.logo_url, primary_color: organization.primary_color })
                    .eq('id', organization.id);
                error = fallbackResult.error;
            }
            if (error) throw error;
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            toast({ title: 'Settings saved', description: 'Organization settings were updated.', variant: 'success' });
        } catch (error) {
            logError('Error saving settings', error);
            toast({ title: 'Save failed', description: 'Failed to save settings. Please try again.', variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSave = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast({ title: t('messages.settingsSaved'), description: t('messages.settingsSavedDescription'), variant: 'success' });
        }, 800);
    }, [toast, t]);

    const toggleWorkflowRule = (stage: string) => {
        setWorkflowRules((prev) =>
            prev.map((rule) => (rule.lifecycle_stage === stage ? { ...rule, notify_client: !rule.notify_client } : rule))
        );
    };

    const saveWorkflowRules = async () => {
        setRulesSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            for (const rule of workflowRules) {
                const response = await fetch('/api/admin/workflow/rules', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
                    body: JSON.stringify(rule),
                });
                if (!response.ok) {
                    const payload = await response.json();
                    throw new Error(payload?.error || 'Failed to save workflow rules');
                }
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            toast({ title: 'Workflow rules saved', description: 'Lifecycle notification rules were updated.', variant: 'success' });
        } catch (error) {
            logError('Error saving workflow rules', error);
            toast({ title: 'Workflow save failed', description: error instanceof Error ? error.message : 'Failed to save workflow rules', variant: 'error' });
        } finally {
            setRulesSaving(false);
        }
    };

    const handleDraftTimezoneChange = useCallback((value: string) => {
        setDraftTimezone(value);
    }, []);

    const handleSaveTimezoneClick = useCallback(() => {
        void handleSaveTimezone();
    }, [handleSaveTimezone]);

    const handleResumeOnboarding = useCallback(() => {
        router.push('/onboarding');
    }, [router]);

    const handleOpenWhatsAppConnect = useCallback(() => {
        setIsWhatsAppConnectOpen(true);
    }, []);

    const handleCloseWhatsAppConnect = useCallback(() => {
        setIsWhatsAppConnectOpen(false);
    }, []);

    const handleWhatsAppConnected = useCallback(() => {
        setIsWhatsAppConnected(true);
    }, []);

    // --- Loading state ---

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <SettingsHeader />
                <GlassFormSkeleton />
            </div>
        );
    }

    // --- Main render ---

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <GuidedTour />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-serif text-secondary tracking-tight">{t('title')}</h1>
                        <p className="text-text-secondary mt-2 text-lg">
                            {t('description')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {isOnboardingIncomplete && (
                            <GlassButton
                                variant="primary"
                                size="sm"
                                onClick={handleResumeOnboarding}
                                className="flex items-center gap-2"
                            >
                                <PlayCircle className="w-4 h-4" />
                                Resume Onboarding
                            </GlassButton>
                        )}
                        <LanguageSwitcher />
                    </div>
                </div>

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
                                contributorBadgeTier === 'gold'
                                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                    : contributorBadgeTier === 'silver'
                                    ? 'border-slate-400 bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
                                    : 'border-orange-600 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                            }`}
                        >
                            {contributorBadgeTier} Tier
                        </Badge>
                    </GlassCard>
                )}

                <SetupGuide />

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Sidebar Nav */}
                    <aside className="w-full md:w-64 shrink-0">
                        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                            {TABS.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap text-left",
                                            isActive
                                                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                                                : "text-text-secondary hover:bg-white hover:text-secondary hover:shadow-sm"
                                        )}
                                    >
                                        <tab.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white/80" : "text-text-muted")} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1 w-full min-w-0">
                        <GlassCard padding="lg" className="border-gray-100 shadow-xl overflow-hidden min-h-[500px]">
                            {activeTab === 'organization' && (
                                <OrganizationTab
                                    draftTimezone={draftTimezone}
                                    loading={false}
                                    onSave={handleSave}
                                />
                            )}

                            {activeTab === 'profile' && (
                                <ProfileTab
                                    draftTimezone={draftTimezone}
                                    timezone={timezone}
                                    timezoneOptions={timezoneOptions}
                                    savingTimezone={savingTimezone}
                                    loading={false}
                                    onDraftTimezoneChange={handleDraftTimezoneChange}
                                    onSaveTimezone={handleSaveTimezoneClick}
                                    onSave={handleSave}
                                />
                            )}

                            {activeTab === 'branding' && organization && (
                                <form onSubmit={handleSaveOrg} className="space-y-6">
                                    <BrandingThemeSection organization={organization} setOrganization={setOrganization} />
                                    <SaveButton saving={saving} showSuccess={showSuccess} />
                                </form>
                            )}

                            {activeTab === 'messaging' && (
                                <MessagingSection
                                    isWhatsAppConnected={isWhatsAppConnected}
                                    whatsAppProfile={whatsAppProfile}
                                    isGmailConnected={isGmailConnected}
                                    gmailEmail={gmailEmail}
                                    onOpenWhatsAppConnect={handleOpenWhatsAppConnect}
                                    onDisconnectWhatsApp={() => { void handleDisconnectWhatsApp(); }}
                                    onDisconnectGmail={async () => {
                                        const res = await fetch('/api/admin/email/disconnect', { method: 'POST' });
                                        if (res.ok) {
                                            setIsGmailConnected(false);
                                            setGmailEmail('');
                                            toast({ title: 'Email disconnected', description: 'You can reconnect anytime.' });
                                        } else {
                                            toast({ title: 'Failed to disconnect', description: 'Please try again.', variant: 'error' });
                                        }
                                    }}
                                    onEmailConnected={(connectedEmail) => {
                                        setIsGmailConnected(true);
                                        setGmailEmail(connectedEmail);
                                        toast({ title: 'Email connected!', description: `${connectedEmail} is now linked.`, variant: 'success' });
                                    }}
                                />
                            )}

                            {activeTab === 'payments' && (
                                <PaymentsTab
                                    upiId={upiId}
                                    isUpiSaved={isUpiSaved}
                                    isUpiSaving={isUpiSaving}
                                    setUpiId={setUpiId}
                                    handleSaveUpi={handleSaveUpi}
                                />
                            )}

                            {activeTab === 'e-invoicing' && <EInvoicingTab />}

                            {activeTab === 'reviews' && (
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

                            {activeTab === 'social' && (
                                <SocialTab
                                    isInstagramConnected={isInstagramConnected}
                                    isLinkedInConnected={isLinkedInConnected}
                                />
                            )}

                            {activeTab === 'maps' && placesInitial && (
                                <MapsDataSection
                                    initialPlacesEnabled={placesInitial.enabled}
                                    initialGooglePlaceId={placesInitial.googlePlaceId}
                                />
                            )}

                            {activeTab === 'billing' && <BillingOverviewTab />}

                            {activeTab === 'security' && <SecurityTab />}

                            {activeTab === 'team' && <TeamTab />}

                            {activeTab === 'notifications' && (
                                <WorkflowRulesSection
                                    workflowRules={workflowRules}
                                    rulesSaving={rulesSaving}
                                    toggleWorkflowRule={toggleWorkflowRule}
                                    saveWorkflowRules={() => void saveWorkflowRules()}
                                />
                            )}
                        </GlassCard>

                        {/* Guided Tours — Reset */}
                        <GlassCard className="mt-6 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <PlayCircle className="w-4 h-4 text-primary" />
                                        Guided Tours
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Reset all page tours to experience them again from scratch.
                                    </p>
                                </div>
                                <GlassButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        resetAllTours();
                                        toast({ title: 'Tours reset', description: 'All guided tours have been reset. Visit any page to see them again.', variant: 'success' });
                                    }}
                                >
                                    Reset Tours
                                </GlassButton>
                            </div>
                        </GlassCard>
                    </main>
                </div>
            </div>

            <WhatsAppConnectModal
                isOpen={isWhatsAppConnectOpen}
                onClose={handleCloseWhatsAppConnect}
                onConnected={handleWhatsAppConnected}
            />
        </>
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
