'use client';

import { User } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { getTimezoneDisplayName } from '@/lib/date/tz';

export interface ProfileTabProps {
    readonly draftTimezone: string;
    readonly timezone: string;
    readonly timezoneOptions: readonly string[];
    readonly savingTimezone: boolean;
    readonly loading: boolean;
    readonly onDraftTimezoneChange: (value: string) => void;
    readonly onSaveTimezone: () => void;
    readonly onSave: () => void;
}

export function ProfileTab({
    draftTimezone,
    timezone,
    timezoneOptions,
    savingTimezone,
    loading,
    onDraftTimezoneChange,
    onSaveTimezone,
    onSave,
}: ProfileTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-secondary">Personal Account</h2>
                <p className="text-sm text-text-secondary mt-1">Manage your operational identity and personal details.</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center relative group cursor-pointer">
                    <User className="w-10 h-10 text-gray-400 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    </div>
                </div>
                <div>
                    <GlassButton variant="secondary" className="text-xs font-bold rounded-xl" size="sm">
                        Upload Avatar
                    </GlassButton>
                    <p className="text-xs text-text-muted mt-2">JPG or PNG. Max size of 2MB.</p>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Full Name</label>
                    <input type="text" defaultValue="Admin User" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">Email Address</label>
                    <input type="email" defaultValue="admin@travelsuite.app" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3" />
                </div>
                <div className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                                Operational Timezone
                            </label>
                            <select
                                value={draftTimezone}
                                onChange={(event) => onDraftTimezoneChange(event.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary"
                            >
                                {timezoneOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {getTimezoneDisplayName(option)}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-text-muted">
                                Used for bookings, proposal activity, and inbox timestamps.
                            </p>
                        </div>
                        <GlassButton
                            variant="primary"
                            onClick={onSaveTimezone}
                            disabled={savingTimezone || draftTimezone === timezone}
                            className="rounded-xl px-6"
                        >
                            {savingTimezone ? 'Saving timezone...' : 'Save timezone'}
                        </GlassButton>
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
