'use client';

import { GlassButton } from '@/components/glass/GlassButton';
import { getTimezoneDisplayName } from '@/lib/date/tz';

export interface OrganizationTabProps {
    readonly draftTimezone: string;
    readonly loading: boolean;
    readonly onSave: () => void;
}

export function OrganizationTab({ draftTimezone, loading, onSave }: OrganizationTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-secondary">Organization Profile</h2>
                <p className="text-sm text-text-secondary mt-1">Manage global brand identity and account settings.</p>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Official Name</label>
                    <input type="text" defaultValue="TripBuilt Elite" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Website Domain</label>
                    <input type="text" defaultValue="www.travelsuite.app" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Base Currency</label>
                        <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary">
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (&euro;)</option>
                            <option value="GBP">GBP (&pound;)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Timezone</label>
                        <select
                            value={draftTimezone}
                            disabled
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none text-secondary disabled:opacity-100"
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
