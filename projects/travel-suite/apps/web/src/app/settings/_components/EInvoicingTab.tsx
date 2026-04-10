'use client';

import { useState, useEffect } from 'react';
import { FileText, IndianRupee, Key, Building2, TestTube } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { authedFetch } from '@/lib/api/authed-fetch';
import { validateGSTIN } from '@/lib/tax/gst-calculator';

type EInvoiceSettingsResponse = {
    configured?: boolean;
    settings?: {
        gstin?: string;
        irp_username?: string;
        threshold_amount?: number;
        auto_generate_enabled?: boolean;
        sandbox_mode?: boolean;
    } | null;
    error?: string | null;
};

export function EInvoicingTab() {
    const { toast } = useToast();

    // E-Invoicing settings state
    const [gstin, setGstin] = useState('');
    const [irpUsername, setIrpUsername] = useState('');
    const [irpPassword, setIrpPassword] = useState('');
    const [thresholdAmount, setThresholdAmount] = useState('500000');
    const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true);
    const [sandboxMode, setSandboxMode] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingGstin, setIsSavingGstin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfigured, setIsConfigured] = useState(false);

    // Load e-invoicing settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch('/api/settings/e-invoicing');
                if (!res.ok) {
                    setIsLoading(false);
                    return;
                }
                const data = (await res.json()) as EInvoiceSettingsResponse;
                const settings = data.settings;

                if (settings?.gstin) {
                    setGstin(settings.gstin);
                    setIrpUsername(settings.irp_username ?? '');
                    setThresholdAmount(String(settings.threshold_amount ?? 500000));
                    setAutoGenerateEnabled(settings.auto_generate_enabled ?? true);
                    setSandboxMode(settings.sandbox_mode ?? true);
                    setIsConfigured(Boolean(data.configured));
                }
            } catch (error) {
                console.error('Failed to load e-invoicing settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        void loadSettings();
    }, []);

    const handleSaveGstin = async () => {
        const nextGstin = gstin.trim().toUpperCase();
        if (!nextGstin) {
            toast({
                title: 'GSTIN required',
                description: 'Enter a GSTIN before saving it to the organization.',
                variant: 'error'
            });
            return;
        }

        if (!validateGSTIN(nextGstin)) {
            toast({
                title: 'Invalid GSTIN',
                description: 'Use the 15-character GSTIN format, for example 27AABCU9603R1ZX.',
                variant: 'error'
            });
            return;
        }

        setIsSavingGstin(true);
        try {
            const res = await authedFetch('/api/admin/organization', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gstin: nextGstin }),
            });
            const data = (await res.json()) as { error?: string | null };
            if (!res.ok) {
                toast({
                    title: 'GSTIN save failed',
                    description: data.error ?? 'Could not save GSTIN to organization details.',
                    variant: 'error'
                });
                return;
            }
            setGstin(nextGstin);
            toast({
                title: 'GSTIN saved',
                description: 'Organization GSTIN was updated.',
                variant: 'success'
            });
        } catch {
            toast({
                title: 'GSTIN save failed',
                description: 'Please try again.',
                variant: 'error'
            });
        } finally {
            setIsSavingGstin(false);
        }
    };

    const handleSave = async () => {
        if (!gstin.trim()) {
            toast({
                title: 'GSTIN required',
                description: 'Please enter your GSTIN to enable e-invoicing',
                variant: 'error'
            });
            return;
        }

        if (!irpUsername.trim()) {
            toast({
                title: 'IRP Username required',
                description: 'Please enter your IRP username',
                variant: 'error'
            });
            return;
        }

        setIsSaving(true);
        try {
            const res = await authedFetch('/api/settings/e-invoicing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gstin: gstin.trim(),
                    irp_username: irpUsername.trim(),
                    irp_password: irpPassword.trim() || undefined,
                    threshold_amount: parseInt(thresholdAmount, 10),
                    auto_generate_enabled: autoGenerateEnabled,
                    sandbox_mode: sandboxMode,
                }),
            });

            const data = (await res.json()) as { success?: boolean; error?: string };

            if (!res.ok || !data.success) {
                toast({
                    title: 'Save failed',
                    description: data.error ?? 'Failed to save e-invoicing settings',
                    variant: 'error'
                });
                return;
            }

            setIsConfigured(true);
            setIrpPassword(''); // Clear password field after save
            toast({
                title: 'E-Invoicing configured',
                description: 'Your settings have been saved successfully',
                variant: 'success'
            });
        } catch {
            toast({
                title: 'Failed to save settings',
                description: 'Please try again',
                variant: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-secondary">E-Invoicing (GST)</h2>
                    <p className="text-sm text-text-secondary mt-1">Loading configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-secondary">E-Invoicing (GST)</h2>
                <p className="text-sm text-text-secondary mt-1">
                    Configure GST e-invoicing integration with government IRP (Invoice Registration Portal).
                    Auto-generate IRN and QR codes for compliant invoices.
                </p>
            </div>

            {/* Configuration Status */}
            {isConfigured && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-secondary mb-0.5">E-Invoicing Active</h4>
                        <p className="text-sm text-text-muted">
                            Your organization is configured for automated e-invoice generation.
                            Invoices above ₹{parseInt(thresholdAmount, 10).toLocaleString('en-IN')} will automatically register with IRP.
                        </p>
                    </div>
                </div>
            )}

            {/* Organization Details */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">
                    Organization Credentials
                </h3>
                <div className="space-y-4">
                    <div className="p-5 border border-gray-100 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-secondary mb-0.5">GSTIN</h4>
                                <p className="text-xs text-text-muted">
                            Your 15-character GST Identification Number
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                type="text"
                                value={gstin}
                                onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/\s/g, ''))}
                                placeholder="22AAAAA0000A1Z5"
                                aria-label="GSTIN"
                                maxLength={15}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 font-mono"
                            />
                            <GlassButton
                                variant="outline"
                                size="sm"
                                onClick={() => { void handleSaveGstin(); }}
                                disabled={isSavingGstin || !gstin.trim()}
                                className="shrink-0 px-5"
                            >
                                {isSavingGstin ? 'Saving...' : 'Save GSTIN'}
                            </GlassButton>
                        </div>
                        <p className="mt-2 text-xs text-text-muted">
                            This saves GSTIN to organization details. Use the full e-invoicing save below only after IRP credentials are ready.
                        </p>
                    </div>
                </div>
            </div>

            {/* IRP Credentials */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">
                    IRP Portal Credentials
                </h3>
                <div className="space-y-3">
                    <div className="p-5 border border-gray-100 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                <Key className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-secondary mb-0.5">IRP Username</h4>
                                <p className="text-xs text-text-muted">
                                    Your username from the e-invoice portal
                                </p>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={irpUsername}
                            onChange={(e) => setIrpUsername(e.target.value)}
                            placeholder="IRP_USERNAME"
                            aria-label="IRP Username"
                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                    </div>

                    <div className="p-5 border border-gray-100 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                <Key className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-secondary mb-0.5">IRP Password</h4>
                                <p className="text-xs text-text-muted">
                                    Leave blank to keep existing password
                                </p>
                            </div>
                        </div>
                        <input
                            type="password"
                            value={irpPassword}
                            onChange={(e) => setIrpPassword(e.target.value)}
                            placeholder={isConfigured ? '••••••••' : 'Enter IRP password'}
                            aria-label="IRP Password"
                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                    </div>
                </div>
            </div>

            {/* Configuration Options */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">
                    Automation Settings
                </h3>
                <div className="space-y-3">
                    <div className="p-5 border border-gray-100 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                <IndianRupee className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-secondary mb-0.5">Threshold Amount</h4>
                                <p className="text-xs text-text-muted">
                                    Minimum invoice amount (INR) for automatic e-invoice generation
                                </p>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={thresholdAmount}
                            onChange={(e) => setThresholdAmount(e.target.value)}
                            min="0"
                            step="10000"
                            aria-label="E-invoice threshold amount in INR"
                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-secondary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                    </div>

                    <div className="p-5 border border-gray-100 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-secondary mb-0.5">Auto-generate E-Invoices</h4>
                                    <p className="text-xs text-text-muted">
                                        Automatically register invoices with IRP when threshold is met
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAutoGenerateEnabled(!autoGenerateEnabled)}
                                aria-label="Toggle auto-generate e-invoices"
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                                    autoGenerateEnabled ? "bg-primary" : "bg-gray-300"
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                        autoGenerateEnabled ? "translate-x-6" : "translate-x-1"
                                    )}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="p-5 border border-gray-100 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                    <TestTube className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-secondary mb-0.5">Sandbox Mode</h4>
                                    <p className="text-xs text-text-muted">
                                        Use IRP sandbox environment for testing (disable for production)
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSandboxMode(!sandboxMode)}
                                aria-label="Toggle sandbox mode"
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                                    sandboxMode ? "bg-amber-500" : "bg-gray-300"
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                        sandboxMode ? "translate-x-6" : "translate-x-1"
                                    )}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-50 flex justify-end">
                <GlassButton
                    variant="primary"
                    size="md"
                    onClick={() => { void handleSave(); }}
                    disabled={isSaving || !gstin.trim() || !irpUsername.trim()}
                    className="text-sm px-8"
                >
                    {isSaving ? 'Saving...' : 'Save E-Invoicing Settings'}
                </GlassButton>
            </div>
        </div>
    );
}
