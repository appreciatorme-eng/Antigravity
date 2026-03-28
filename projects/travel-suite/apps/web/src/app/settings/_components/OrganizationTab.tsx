'use client';

import { useState } from 'react';
import { GlassButton } from '@/components/glass/GlassButton';
import { getTimezoneDisplayName } from '@/lib/date/tz';
import { validateGSTIN } from '@/lib/tax/gst-calculator';

export interface OrganizationTabProps {
    readonly draftTimezone: string;
    readonly loading: boolean;
    readonly onSave: () => void;
}

export function OrganizationTab({ draftTimezone, loading, onSave }: OrganizationTabProps) {
    const [gstin, setGstin] = useState('');
    const [gstinError, setGstinError] = useState<string | null>(null);

    const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/\s/g, '');
        setGstin(value);

        // Validate GSTIN format if value is not empty
        if (value && !validateGSTIN(value)) {
            setGstinError('Invalid GSTIN format (e.g., 27AABCU9603R1ZX)');
        } else {
            setGstinError(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-secondary">Organization Profile</h2>
                <p className="text-sm text-text-secondary mt-1">Manage global brand identity and account settings.</p>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-slate-300">Official Name</label>
                    <input type="text" defaultValue="TripBuilt Elite" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary dark:text-white" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-slate-300">Website Domain</label>
                    <input type="text" defaultValue="www.tripbuilt.app" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary dark:text-white" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-slate-300">GSTIN</label>
                    <input
                        type="text"
                        value={gstin}
                        onChange={handleGstinChange}
                        placeholder="27AABCU9603R1ZX"
                        maxLength={15}
                        className={`w-full bg-gray-50 dark:bg-slate-800 border rounded-xl px-4 py-3 focus:ring-2 outline-none text-secondary dark:text-white ${
                            gstinError
                                ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
                        }`}
                    />
                    {gstinError && (
                        <p className="text-xs text-red-600">{gstinError}</p>
                    )}
                    {!gstinError && gstin && (
                        <p className="text-xs text-green-600">✓ Valid GSTIN format</p>
                    )}
                    <p className="text-xs text-text-muted">
                        GST Identification Number for tax compliance and e-invoicing
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-slate-300">Base Currency</label>
                        <select className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary dark:text-white">
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (&euro;)</option>
                            <option value="GBP">GBP (&pound;)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-slate-300">Timezone</label>
                        <select
                            value={draftTimezone}
                            disabled
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none text-secondary dark:text-white disabled:opacity-100"
                        >
                            <option value={draftTimezone}>{getTimezoneDisplayName(draftTimezone)}</option>
                        </select>
                        <p className="text-xs text-text-muted">
                            Operational timestamps follow the profile timezone below.
                        </p>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex justify-end">
                <GlassButton variant="primary" onClick={onSave} disabled={loading} className="rounded-xl px-8">
                    {loading ? 'Committing...' : 'Save Configuration'}
                </GlassButton>
            </div>
        </div>
    );
}
