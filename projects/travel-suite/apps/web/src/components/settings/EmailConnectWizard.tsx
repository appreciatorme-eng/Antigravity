'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { cn } from '@/lib/utils';
import { authedFetch } from '@/lib/api/authed-fetch';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Provider = 'gmail' | 'yahoo' | 'outlook' | 'other';
type Step = 'select' | 'guide' | 'credentials' | 'testing' | 'done';

interface EmailConnectWizardProps {
    readonly onConnected: (email: string) => void;
    readonly onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Provider info
// ---------------------------------------------------------------------------

const PROVIDERS: readonly {
    readonly id: Provider;
    readonly name: string;
    readonly color: string;
    readonly bg: string;
    readonly guide: string;
    readonly guideUrl: string;
}[] = [
    {
        id: 'gmail',
        name: 'Gmail',
        color: 'text-red-600',
        bg: 'bg-red-50',
        guide: 'Go to myaccount.google.com → Security → 2-Step Verification → App Passwords → Select "Mail" → Generate. Copy the 16-character password.',
        guideUrl: 'https://myaccount.google.com/apppasswords',
    },
    {
        id: 'yahoo',
        name: 'Yahoo Mail',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        guide: 'Go to Yahoo Account Security → Generate App Password → Select "Other App" → Name it "TripBuilt" → Generate. Copy the password.',
        guideUrl: 'https://login.yahoo.com/account/security',
    },
    {
        id: 'outlook',
        name: 'Outlook / Hotmail',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        guide: 'Go to Microsoft Account → Security → Advanced Security → App Passwords → Create a new app password. Copy the generated password.',
        guideUrl: 'https://account.live.com/proofs/AppPassword',
    },
    {
        id: 'other',
        name: 'Other Email',
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        guide: 'You will need your IMAP and SMTP server details from your email provider. Check their help docs for server addresses and ports.',
        guideUrl: '',
    },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmailConnectWizard({ onConnected, onCancel }: EmailConnectWizardProps) {
    const [step, setStep] = useState<Step>('select');
    const [provider, setProvider] = useState<Provider | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [imapHost, setImapHost] = useState('');
    const [imapPort, setImapPort] = useState('993');
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('465');
    const [error, setError] = useState('');

    const selectedProvider = PROVIDERS.find((p) => p.id === provider);

    const handleSelectProvider = (id: Provider) => {
        setProvider(id);
        setStep('guide');
        setError('');
    };

    const handleTestAndConnect = async () => {
        if (!email || !password) {
            setError('Email and app password are required.');
            return;
        }

        setError('');
        setStep('testing');

        try {
            const body: Record<string, string | number> = {
                email,
                password,
                provider: provider ?? 'other',
            };

            if (provider === 'other') {
                if (!imapHost || !smtpHost) {
                    setError('IMAP and SMTP server addresses are required.');
                    setStep('credentials');
                    return;
                }
                body.imapHost = imapHost;
                body.imapPort = parseInt(imapPort) || 993;
                body.smtpHost = smtpHost;
                body.smtpPort = parseInt(smtpPort) || 465;
            }

            const res = await authedFetch('/api/admin/email/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = (await res.json()) as { data?: { connected?: boolean; email?: string }; error?: string };

            if (!res.ok || !data.data?.connected) {
                setError(data.error ?? 'Connection failed. Check your email and app password.');
                setStep('credentials');
                return;
            }

            setStep('done');
            onConnected(data.data.email ?? email);
        } catch {
            setError('Connection failed. Please try again.');
            setStep('credentials');
        }
    };

    // Step: Select provider
    if (step === 'select') {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-secondary">Connect Your Email</h4>
                    <button onClick={onCancel} className="text-xs text-text-muted hover:text-text-secondary">
                        Cancel
                    </button>
                </div>
                <p className="text-xs text-text-muted">
                    Works with any email. Select your provider to get started.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {PROVIDERS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleSelectProvider(p.id)}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                        >
                            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', p.bg)}>
                                <Mail className={cn('w-4 h-4', p.color)} />
                            </div>
                            <span className="text-sm font-semibold text-secondary">{p.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Step: Guide
    if (step === 'guide' && selectedProvider) {
        return (
            <div className="space-y-4">
                <button onClick={() => setStep('select')} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary">
                    <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', selectedProvider.bg)}>
                        <Mail className={cn('w-4 h-4', selectedProvider.color)} />
                    </div>
                    <h4 className="font-bold text-secondary">Connect {selectedProvider.name}</h4>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/50">
                    <h5 className="text-xs font-bold text-amber-800 mb-2">Step 1: Generate App Password</h5>
                    <p className="text-xs text-amber-700 leading-relaxed">{selectedProvider.guide}</p>
                    {selectedProvider.guideUrl && (
                        <a
                            href={selectedProvider.guideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-amber-700 font-semibold hover:text-amber-900"
                        >
                            Open Settings <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
                <GlassButton
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => setStep('credentials')}
                >
                    I have my App Password
                </GlassButton>
            </div>
        );
    }

    // Step: Credentials
    if (step === 'credentials') {
        return (
            <div className="space-y-4">
                <button onClick={() => setStep('guide')} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary">
                    <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <h4 className="font-bold text-secondary">Enter Credentials</h4>

                {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200/50">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">{error}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="App Password"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                    />

                    {provider === 'other' && (
                        <>
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    value={imapHost}
                                    onChange={(e) => setImapHost(e.target.value)}
                                    placeholder="IMAP Host"
                                    className="col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    type="text"
                                    value={imapPort}
                                    onChange={(e) => setImapPort(e.target.value)}
                                    placeholder="993"
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    value={smtpHost}
                                    onChange={(e) => setSmtpHost(e.target.value)}
                                    placeholder="SMTP Host"
                                    className="col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    type="text"
                                    value={smtpPort}
                                    onChange={(e) => setSmtpPort(e.target.value)}
                                    placeholder="465"
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </>
                    )}
                </div>

                <GlassButton
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={handleTestAndConnect}
                    disabled={!email || !password}
                >
                    Test & Connect
                </GlassButton>
            </div>
        );
    }

    // Step: Testing
    if (step === 'testing') {
        return (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div className="text-center">
                    <h4 className="font-bold text-secondary">Testing Connection</h4>
                    <p className="text-xs text-text-muted mt-1">
                        Verifying IMAP (read) and SMTP (send)...
                    </p>
                </div>
            </div>
        );
    }

    // Step: Done
    return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <div className="text-center">
                <h4 className="font-bold text-secondary">Email Connected!</h4>
                <p className="text-xs text-text-muted mt-1">
                    {email} is now linked. You can send and receive emails from the unified inbox.
                </p>
            </div>
        </div>
    );
}
