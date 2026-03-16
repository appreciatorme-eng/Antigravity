'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { GlassCard } from '@/components/glass/GlassCard';
import { User, Bell, Link2, CreditCard, Shield, Globe, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { WhatsAppConnectModal } from '@/components/whatsapp/WhatsAppConnectModal';
import { DEFAULT_APP_TIMEZONE, getTimezoneDisplayName } from '@/lib/date/tz';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { OrganizationTab } from './_components/OrganizationTab';
import { ProfileTab } from './_components/ProfileTab';
import { IntegrationsTab } from './_components/IntegrationsTab';
import { SecurityTab } from './_components/SecurityTab';
import { TeamTab } from './_components/TeamTab';
import { PlaceholderTab } from './_components/PlaceholderTab';

export default function SettingsPage() {
    const t = useTranslations('settings');
    const { toast } = useToast();
    const { timezone, saveTimezone, saving: savingTimezone, timezoneOptions } = useUserTimezone();
    const [activeTab, setActiveTab] = useState('organization');
    const [loading, setLoading] = useState(false);
    const [draftTimezone, setDraftTimezone] = useState(DEFAULT_APP_TIMEZONE);

    const TABS = [
        { id: 'organization', label: t('tabs.organization'), icon: Globe },
        { id: 'profile', label: t('tabs.profile'), icon: User },
        { id: 'notifications', label: t('tabs.notifications'), icon: Bell },
        { id: 'integrations', label: t('tabs.integrations'), icon: Link2 },
        { id: 'billing', label: t('tabs.billing'), icon: CreditCard },
        { id: 'security', label: t('tabs.security'), icon: Shield },
        { id: 'team', label: t('tabs.team'), icon: Users },
    ];

    // WhatsApp Connect State
    const [isWhatsAppConnectOpen, setIsWhatsAppConnectOpen] = useState(false);
    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
    const [whatsAppProfile, setWhatsAppProfile] = useState<{
        number: string;
        name: string;
    } | null>(null);

    // Load real WhatsApp connection status on mount
    useEffect(() => {
        const supabase = createClient();
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
    }, []);

    useEffect(() => {
        setDraftTimezone(timezone);
    }, [timezone]);

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

    const handleSave = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast({ title: t('messages.settingsSaved'), description: t('messages.settingsSavedDescription'), variant: 'success' });
        }, 800);
    }, [toast, t]);

    const handleOpenWhatsAppConnect = useCallback(() => {
        setIsWhatsAppConnectOpen(true);
    }, []);

    const handleCloseWhatsAppConnect = useCallback(() => {
        setIsWhatsAppConnectOpen(false);
    }, []);

    const handleWhatsAppConnected = useCallback(() => {
        setIsWhatsAppConnected(true);
    }, []);

    const handleDraftTimezoneChange = useCallback((value: string) => {
        setDraftTimezone(value);
    }, []);

    const handleSaveTimezoneClick = useCallback(() => {
        void handleSaveTimezone();
    }, [handleSaveTimezone]);

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-serif text-secondary tracking-tight">{t('title')}</h1>
                    <p className="text-text-secondary mt-2 text-lg">
                        {t('description')}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Sidebar Nav */}
                    <aside className="w-full md:w-64 shrink-0 space-y-1">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left",
                                        isActive
                                            ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                                            : "text-text-secondary hover:bg-white hover:text-secondary hover:shadow-sm"
                                    )}
                                >
                                    <tab.icon className={cn("w-5 h-5", isActive ? "text-white/80" : "text-text-muted")} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1 w-full min-w-0">
                        <GlassCard padding="lg" className="border-gray-100 shadow-xl overflow-hidden min-h-[500px]">
                            {activeTab === 'organization' && (
                                <OrganizationTab
                                    draftTimezone={draftTimezone}
                                    loading={loading}
                                    onSave={handleSave}
                                />
                            )}

                            {activeTab === 'profile' && (
                                <ProfileTab
                                    draftTimezone={draftTimezone}
                                    timezone={timezone}
                                    timezoneOptions={timezoneOptions}
                                    savingTimezone={savingTimezone}
                                    loading={loading}
                                    onDraftTimezoneChange={handleDraftTimezoneChange}
                                    onSaveTimezone={handleSaveTimezoneClick}
                                    onSave={handleSave}
                                />
                            )}

                            {activeTab === 'integrations' && (
                                <IntegrationsTab
                                    isWhatsAppConnected={isWhatsAppConnected}
                                    whatsAppProfile={whatsAppProfile}
                                    onOpenWhatsAppConnect={handleOpenWhatsAppConnect}
                                    onDisconnectWhatsApp={() => { void handleDisconnectWhatsApp(); }}
                                />
                            )}

                            {activeTab === 'security' && <SecurityTab />}

                            {activeTab === 'team' && <TeamTab />}

                            {['billing', 'notifications'].includes(activeTab) && <PlaceholderTab />}

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
