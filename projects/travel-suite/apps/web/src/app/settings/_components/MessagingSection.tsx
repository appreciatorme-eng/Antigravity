'use client';

import { useMemo, useState } from 'react';
import { BellRing, Clock3, MessageCircle, Mail } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { cn } from '@/lib/utils';
import { EmailConnectWizard } from '@/components/settings/EmailConnectWizard';

export interface WhatsAppProfile {
    readonly number: string;
    readonly name: string;
}

export interface MessagingSectionProps {
    readonly isWhatsAppConnected: boolean;
    readonly whatsAppProfile: WhatsAppProfile | null;
    readonly isMorningBriefingEnabled: boolean;
    readonly isMorningBriefingReady: boolean;
    readonly lastMorningBriefingAt: string | null;
    readonly morningBriefingBusy?: boolean;
    readonly isGmailConnected: boolean;
    readonly gmailEmail?: string;
    readonly onOpenWhatsAppConnect: () => void;
    readonly onDisconnectWhatsApp: () => void;
    readonly onToggleMorningBriefing: () => void;
    readonly onDisconnectGmail?: () => void;
    readonly onEmailConnected?: (email: string) => void;
}

export function MessagingSection({
    isWhatsAppConnected,
    whatsAppProfile,
    isMorningBriefingEnabled,
    isMorningBriefingReady,
    lastMorningBriefingAt,
    morningBriefingBusy,
    isGmailConnected,
    gmailEmail,
    onOpenWhatsAppConnect,
    onDisconnectWhatsApp,
    onToggleMorningBriefing,
    onDisconnectGmail,
    onEmailConnected,
}: MessagingSectionProps) {
    const [showWizard, setShowWizard] = useState(false);
    const lastBriefingLabel = useMemo(() => {
        if (!lastMorningBriefingAt) return 'No morning brief sent yet';
        const date = new Date(lastMorningBriefingAt);
        if (Number.isNaN(date.getTime())) return 'No morning brief sent yet';
        return `Last scheduled ${date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`;
    }, [lastMorningBriefingAt]);

    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Messaging</h3>
            <div className="space-y-3">
                {/* WhatsApp -- Hero */}
                <div className="p-5 border-2 border-[#25D366]/30 bg-[#25D366]/5 rounded-2xl flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-lg shadow-[#25D366]/30">
                        <MessageCircle className="w-6 h-6 text-white fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-secondary">WhatsApp</h4>
                            <span className="text-[9px] bg-[#25D366]/20 text-[#25D366] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Recommended</span>
                            {isWhatsAppConnected && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">&#x25CF; Connected</span>
                            )}
                        </div>
                        {isWhatsAppConnected && whatsAppProfile ? (
                            <p className="text-xs text-[#1da650] font-semibold leading-relaxed">
                                {whatsAppProfile.name} &middot; {whatsAppProfile.number}
                            </p>
                        ) : (
                            <p className="text-xs text-text-muted leading-relaxed">Use your current WhatsApp number -- scan a QR code to link your device. No Meta Business API or approval required.</p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <GlassButton
                            variant="primary"
                            size="sm"
                            onClick={onOpenWhatsAppConnect}
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
                                onClick={onDisconnectWhatsApp}
                                className="text-[10px] text-red-500 hover:text-red-700 transition-colors font-medium"
                            >
                                Disconnect
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-5 border border-amber-200/70 rounded-2xl bg-gradient-to-br from-amber-50 to-white">
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <BellRing className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-secondary">Morning briefing</h4>
                                {isMorningBriefingEnabled ? (
                                    <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">&#x25CF; Enabled</span>
                                ) : (
                                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Off</span>
                                )}
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Send your daily TripBuilt Assistant agenda automatically each morning.
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold',
                                    isMorningBriefingReady
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-amber-100 text-amber-800'
                                )}>
                                    <Clock3 className="w-3.5 h-3.5" />
                                    {isMorningBriefingReady ? 'Assistant group ready' : 'Connect assistant group first'}
                                </span>
                                <span className="text-text-secondary">{lastBriefingLabel}</span>
                            </div>
                            <p className="mt-2 text-[11px] text-text-muted">
                                You can still send one manually any time from WhatsApp with <span className="font-semibold text-secondary">brief now</span>.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                            <GlassButton
                                variant={isMorningBriefingEnabled ? 'secondary' : 'primary'}
                                size="sm"
                                loading={morningBriefingBusy}
                                disabled={!isMorningBriefingReady && !isMorningBriefingEnabled}
                                onClick={onToggleMorningBriefing}
                                className="text-xs font-bold"
                            >
                                {isMorningBriefingEnabled ? 'Turn off' : 'Turn on'}
                            </GlassButton>
                        </div>
                    </div>
                </div>

                {/* Email */}
                <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50/50">
                    {showWizard && !isGmailConnected ? (
                        <EmailConnectWizard
                            onConnected={(connectedEmail) => {
                                setShowWizard(false);
                                onEmailConnected?.(connectedEmail);
                            }}
                            onCancel={() => setShowWizard(false)}
                        />
                    ) : (
                        <>
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-bold text-secondary">Email</h4>
                                        {isGmailConnected && (
                                            <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">&#x25CF; Connected</span>
                                        )}
                                    </div>
                                    {isGmailConnected && gmailEmail ? (
                                        <p className="text-xs text-emerald-600 font-semibold">{gmailEmail}</p>
                                    ) : (
                                        <p className="text-xs text-text-muted">Connect your Gmail, Yahoo, Outlook, or any email. See your full inbox and reply to clients from here.</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    {isGmailConnected ? (
                                        <GlassButton
                                            variant="primary"
                                            size="sm"
                                            className="text-xs font-bold border-emerald-200 text-emerald-700 bg-emerald-50 border cursor-default"
                                        >
                                            Connected
                                        </GlassButton>
                                    ) : (
                                        <GlassButton
                                            variant="primary"
                                            size="sm"
                                            className="text-xs font-bold"
                                            onClick={() => setShowWizard(true)}
                                        >
                                            Connect Email
                                        </GlassButton>
                                    )}
                                </div>
                            </div>
                            {isGmailConnected && onDisconnectGmail && (
                                <div className="flex justify-end mt-2 mr-1">
                                    <button
                                        onClick={onDisconnectGmail}
                                        className="text-[10px] text-red-500 hover:text-red-700 transition-colors font-medium"
                                    >
                                        Disconnect Email
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
