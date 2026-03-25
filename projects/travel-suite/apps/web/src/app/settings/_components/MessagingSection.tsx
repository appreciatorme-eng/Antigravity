'use client';

import { useState } from 'react';
import { MessageCircle, Mail, Download, Loader2 } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { cn } from '@/lib/utils';
import { IntegrationCard } from './IntegrationCard';

export interface WhatsAppProfile {
    readonly number: string;
    readonly name: string;
}

export interface MessagingSectionProps {
    readonly isWhatsAppConnected: boolean;
    readonly whatsAppProfile: WhatsAppProfile | null;
    readonly isGmailConnected: boolean;
    readonly onOpenWhatsAppConnect: () => void;
    readonly onDisconnectWhatsApp: () => void;
}

export function MessagingSection({
    isWhatsAppConnected,
    whatsAppProfile,
    isGmailConnected,
    onOpenWhatsAppConnect,
    onDisconnectWhatsApp,
}: MessagingSectionProps) {
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    async function handleRelinkForImport() {
        setImporting(true);
        setImportError(null);
        try {
            const res = await fetch('/api/admin/whatsapp/relink', { method: 'POST' });
            const data = await res.json() as { success?: boolean; error?: string };
            if (!res.ok) throw new Error(data.error ?? 'Re-link failed');
            // Open the QR connect modal so user can scan
            onOpenWhatsAppConnect();
        } catch (err) {
            setImportError(err instanceof Error ? err.message : 'Re-link failed');
        } finally {
            setImporting(false);
        }
    }

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
                            <>
                                <GlassButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { void handleRelinkForImport(); }}
                                    disabled={importing}
                                    className="text-xs font-bold border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                                >
                                    {importing ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <Download className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    {importing
                                        ? 'Re-linking...'
                                        : 'Re-link to Import History'}
                                </GlassButton>
                                <button
                                    onClick={onDisconnectWhatsApp}
                                    className="text-[10px] text-red-500 hover:text-red-700 transition-colors font-medium"
                                >
                                    Disconnect
                                </button>
                            </>
                        )}
                        {importError && (
                            <p className="text-[10px] text-red-500 font-medium">{importError}</p>
                        )}
                    </div>
                </div>

                {/* Gmail */}
                <IntegrationCard
                    icon={<Mail className="w-5 h-5 text-red-500" />}
                    iconBg="bg-red-50"
                    title="Gmail"
                    description="Manage email enquiries and send confirmations directly from the unified inbox."
                    isConnected={isGmailConnected}
                    connectedLabel="Connected"
                    buttonLabel={isGmailConnected ? 'Connected' : 'Connect Google'}
                    onConnect={() => { if (!isGmailConnected) window.location.href = '/api/social/oauth/google'; }}
                    large
                />
            </div>
        </div>
    );
}
