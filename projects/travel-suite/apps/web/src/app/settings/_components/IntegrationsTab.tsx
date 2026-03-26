'use client';

import { useState, useEffect } from 'react';
import { IndianRupee, Building2, MapPin, Instagram, Linkedin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { GlassButton } from '@/components/glass/GlassButton';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { IntegrationCard } from './IntegrationCard';
import { MessagingSection, type WhatsAppProfile } from './MessagingSection';
import { MapsDataSection } from './MapsDataSection';

async function checkOAuthAndRedirect(
    provider: string,
    url: string,
    toast: ReturnType<typeof useToast>["toast"],
) {
    try {
        const res = await fetch(`/api/social/oauth/status?provider=${provider}`);
        const data = await res.json();
        if (!data.configured) {
            toast({
                title: "Not configured yet",
                description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} integration hasn't been set up. Please configure OAuth credentials first.`,
                variant: "error",
            });
            return;
        }
        window.location.href = url;
    } catch {
        toast({ title: "Connection check failed", variant: "error" });
    }
}

export interface IntegrationsTabProps {
    readonly isWhatsAppConnected: boolean;
    readonly whatsAppProfile: WhatsAppProfile | null;
    readonly onOpenWhatsAppConnect: () => void;
    readonly onDisconnectWhatsApp: () => void;
}

export function IntegrationsTab({
    isWhatsAppConnected,
    whatsAppProfile,
    onOpenWhatsAppConnect,
    onDisconnectWhatsApp,
}: IntegrationsTabProps) {
    const { toast } = useToast();

    // Integration connection state (co-located -- only used here)
    const [isGmailConnected, setIsGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState('');
    const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
    const [isInstagramConnected, setIsInstagramConnected] = useState(false);
    const [isTripAdvisorConnected, setIsTripAdvisorConnected] = useState(false);
    const [tripAdvisorName, setTripAdvisorName] = useState('');
    const [tripAdvisorLocationInput, setTripAdvisorLocationInput] = useState('');
    const [showTripAdvisorInput, setShowTripAdvisorInput] = useState(false);
    const [isTripAdvisorConnecting, setIsTripAdvisorConnecting] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [isUpiSaved, setIsUpiSaved] = useState(false);
    const [isUpiSaving, setIsUpiSaving] = useState(false);

    // Maps & Data initial values loaded from API
    const [placesInitial, setPlacesInitial] = useState<{ enabled: boolean; googlePlaceId: string } | null>(null);

    // Load all integration statuses on mount (parallel)
    useEffect(() => {
        const supabase = createClient();
        void (async () => {
            const [{ data: connections }, upiRes, placesRes] = await Promise.all([
                supabase
                    .from('social_connections')
                    .select('platform, platform_page_id')
                    .in('platform', ['google', 'linkedin', 'instagram', 'facebook']),
                fetch('/api/settings/upi'),
                fetch('/api/integrations/places'),
            ]);

            if (connections) {
                const platforms = new Set(connections.map((c: { platform: string }) => c.platform));
                setIsGmailConnected(platforms.has('google'));
                const googleConn = connections.find((c: { platform: string; platform_page_id?: string }) => c.platform === 'google') as { platform_page_id?: string } | undefined;
                if (googleConn?.platform_page_id) setGmailEmail(googleConn.platform_page_id);
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
                const placesData = (await placesRes.json()) as { enabled?: boolean; googlePlaceId?: string };
                setPlacesInitial({
                    enabled: placesData.enabled ?? false,
                    googlePlaceId: placesData.googlePlaceId ?? '',
                });
            } else {
                setPlacesInitial({ enabled: false, googlePlaceId: '' });
            }

            // TripAdvisor status from org settings
            const { data: orgSettings } = await supabase
                .from('organization_settings')
                .select('tripadvisor_location_id, tripadvisor_connected_at')
                .maybeSingle();
            if (orgSettings?.tripadvisor_location_id) {
                setIsTripAdvisorConnected(true);
            }
        })();
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-secondary">Service Integrations</h2>
                <p className="text-sm text-text-secondary mt-1">Connect your existing tools. Get the inbox working in minutes -- no API approvals needed.</p>
            </div>

            {/* Messaging */}
            <MessagingSection
                isWhatsAppConnected={isWhatsAppConnected}
                whatsAppProfile={whatsAppProfile}
                isGmailConnected={isGmailConnected}
                gmailEmail={gmailEmail}
                onOpenWhatsAppConnect={onOpenWhatsAppConnect}
                onDisconnectWhatsApp={onDisconnectWhatsApp}
                onDisconnectGmail={async () => {
                    const res = await fetch('/api/admin/email/disconnect', { method: 'POST' });
                    if (res.ok) {
                        setIsGmailConnected(false);
                        toast({ title: 'Gmail disconnected', description: 'You can reconnect anytime.' });
                    } else {
                        toast({ title: 'Failed to disconnect', description: 'Please try again.', variant: 'error' });
                    }
                }}
            />

            {/* Payments */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Payments</h3>
                <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <IndianRupee className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-secondary">UPI</h4>
                                {isUpiSaved && (
                                    <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">&#x25CF; Saved</span>
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
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                        <GlassButton
                            variant="primary"
                            size="sm"
                            onClick={() => { void handleSaveUpi(); }}
                            disabled={isUpiSaving || !upiId.trim()}
                            className="text-xs px-5"
                        >
                            {isUpiSaving ? 'Saving...' : 'Save'}
                        </GlassButton>
                    </div>
                </div>
            </div>

            {/* Reviews & Discovery */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Reviews & Discovery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <IntegrationCard
                        icon={<Building2 className="w-4 h-4 text-blue-600" />}
                        iconBg="bg-blue-50"
                        title="Google Business"
                        description="Respond to reviews and manage your listing from the dashboard."
                        isConnected={false}
                        buttonLabel="Connect"
                        onConnect={() => { checkOAuthAndRedirect('google', '/api/social/oauth/google', toast); }}
                    />
                    <div className="p-4 border border-gray-100 rounded-2xl hover:border-primary/30 transition-colors bg-gray-50/50 flex flex-col gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-secondary text-sm">
                                TripAdvisor
                                {isTripAdvisorConnected && (
                                    <span className="ml-2 text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">&#x25CF; Connected</span>
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
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <GlassButton
                                    variant="primary"
                                    size="sm"
                                    onClick={() => { void handleConnectTripAdvisor(); }}
                                    disabled={isTripAdvisorConnecting || !tripAdvisorLocationInput.trim()}
                                    className="text-xs w-full"
                                >
                                    {isTripAdvisorConnecting ? 'Connecting...' : 'Save Location ID'}
                                </GlassButton>
                            </div>
                        ) : (
                            <GlassButton
                                variant="outline"
                                size="sm"
                                onClick={() => { if (!isTripAdvisorConnected) setShowTripAdvisorInput(true); }}
                                className={cn('text-xs w-full mt-auto', isTripAdvisorConnected ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : '')}
                            >
                                {isTripAdvisorConnected ? 'Connected' : 'Connect'}
                            </GlassButton>
                        )}
                    </div>
                </div>
            </div>

            {/* Social Media */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <IntegrationCard
                        icon={<Instagram className="w-4 h-4 text-pink-600" />}
                        iconBg="bg-pink-50"
                        title="Instagram"
                        description="Import leads from DMs and comments into the CRM automatically."
                        isConnected={isInstagramConnected}
                        connectedLabel="Connected"
                        buttonLabel={isInstagramConnected ? 'Connected' : 'Connect'}
                        onConnect={() => { if (!isInstagramConnected) checkOAuthAndRedirect('facebook', '/api/social/oauth/facebook', toast); }}
                    />
                    <IntegrationCard
                        icon={<Linkedin className="w-4 h-4 text-blue-700" />}
                        iconBg="bg-blue-50"
                        title="LinkedIn"
                        description="Sync corporate travel enquiries and company contacts."
                        isConnected={isLinkedInConnected}
                        connectedLabel="Connected"
                        buttonLabel={isLinkedInConnected ? 'Connected' : 'Connect'}
                        onConnect={() => { if (!isLinkedInConnected) checkOAuthAndRedirect('linkedin', '/api/social/oauth/linkedin', toast); }}
                    />
                </div>
            </div>

            {/* Maps & Data */}
            {placesInitial && (
                <MapsDataSection
                    initialPlacesEnabled={placesInitial.enabled}
                    initialGooglePlaceId={placesInitial.googlePlaceId}
                />
            )}
        </div>
    );
}
