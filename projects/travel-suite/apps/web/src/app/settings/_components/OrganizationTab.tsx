'use client';

import { useState } from 'react';
import { GlassButton } from '@/components/glass/GlassButton';
import { getTimezoneDisplayName } from '@/lib/date/tz';
import { validateGSTIN } from '@/lib/tax/gst-calculator';

const INPUT_CLASS = "w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary dark:text-white";
const LABEL_CLASS = "text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-slate-300";

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu & Kashmir", "Ladakh", "Chandigarh", "Puducherry",
    "Andaman & Nicobar", "Dadra & Nagar Haveli", "Daman & Diu", "Lakshadweep",
];

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
                    <label className={LABEL_CLASS}>Official Name</label>
                    <input type="text" defaultValue="TripBuilt Elite" aria-label="Official Name" className={INPUT_CLASS} />
                </div>
                <div className="space-y-2">
                    <label className={LABEL_CLASS}>Website Domain</label>
                    <input type="text" defaultValue="www.tripbuilt.app" aria-label="Website Domain" className={INPUT_CLASS} />
                </div>
                <div className="space-y-2">
                    <label className={LABEL_CLASS}>GSTIN</label>
                    <input
                        type="text"
                        value={gstin}
                        onChange={handleGstinChange}
                        placeholder="27AABCU9603R1ZX"
                        aria-label="GSTIN"
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
                        <p className="text-xs text-green-600">Valid GSTIN format</p>
                    )}
                    <p className="text-xs text-text-muted">
                        GST Identification Number for tax compliance and e-invoicing
                    </p>
                </div>

                {/* Address Section */}
                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-bold text-secondary mb-4">Registered Address</h3>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Street Address</label>
                            <input type="text" placeholder="Building name, street, area" aria-label="Street Address" className={INPUT_CLASS} />
                        </div>
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Address Line 2</label>
                            <input type="text" placeholder="Landmark, locality (optional)" aria-label="Address Line 2" className={INPUT_CLASS} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className={LABEL_CLASS}>City</label>
                                <input type="text" placeholder="e.g. Mumbai" aria-label="City" className={INPUT_CLASS} />
                            </div>
                            <div className="space-y-2">
                                <label className={LABEL_CLASS}>State</label>
                                <select aria-label="State" className={INPUT_CLASS}>
                                    <option value="">Select state</option>
                                    {INDIAN_STATES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={LABEL_CLASS}>Pincode</label>
                                <input type="text" placeholder="e.g. 400001" aria-label="Pincode" maxLength={6} className={INPUT_CLASS} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branch Addresses */}
                <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-secondary">Branch Offices</h3>
                        <GlassButton variant="outline" size="sm" className="text-xs">
                            + Add Branch
                        </GlassButton>
                    </div>
                    <p className="text-xs text-text-muted">
                        Add branch office addresses for multi-location operations. Branch addresses appear on invoices and proposals.
                    </p>
                </div>

                {/* Currency & Timezone */}
                <div className="border-t border-gray-100 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Base Currency</label>
                            <select defaultValue="INR" aria-label="Base Currency" className={INPUT_CLASS}>
                                <option value="INR">INR (&#8377;)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (&euro;)</option>
                                <option value="GBP">GBP (&pound;)</option>
                                <option value="AED">AED (د.إ)</option>
                                <option value="SGD">SGD (S$)</option>
                                <option value="THB">THB (&#3647;)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className={LABEL_CLASS}>Timezone</label>
                            <select
                                value={draftTimezone}
                                disabled
                                aria-label="Timezone"
                                className={`${INPUT_CLASS} disabled:opacity-100`}
                            >
                                <option value={draftTimezone}>{getTimezoneDisplayName(draftTimezone)}</option>
                            </select>
                            <p className="text-xs text-text-muted">
                                Operational timestamps follow the profile timezone below.
                            </p>
                        </div>
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
