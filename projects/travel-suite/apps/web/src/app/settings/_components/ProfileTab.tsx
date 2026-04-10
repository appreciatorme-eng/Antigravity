'use client';

import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GlassButton } from '@/components/glass/GlassButton';
import { getTimezoneDisplayName } from '@/lib/date/tz';

export interface ProfileTabProps {
    readonly fullName: string;
    readonly email: string;
    readonly avatarUrl: string | null;
    readonly draftTimezone: string;
    readonly timezone: string;
    readonly timezoneOptions: readonly string[];
    readonly savingTimezone: boolean;
    readonly loading: boolean;
    readonly showSuccess: boolean;
    readonly onFullNameChange: (value: string) => void;
    readonly onEmailChange: (value: string) => void;
    readonly onDraftTimezoneChange: (value: string) => void;
    readonly onSaveTimezone: () => void;
    readonly onSave: () => Promise<void> | void;
}

export function ProfileTab({
    fullName,
    email,
    avatarUrl,
    draftTimezone,
    timezone,
    timezoneOptions,
    savingTimezone,
    loading,
    showSuccess,
    onFullNameChange,
    onEmailChange,
    onDraftTimezoneChange,
    onSaveTimezone,
    onSave,
}: ProfileTabProps) {
    const t = useTranslations('settings.profile');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-secondary">{t('title')}</h2>
                <p className="text-sm text-text-secondary mt-1">{t('description')}</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center relative group cursor-pointer">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={fullName || 'Profile avatar'} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        <User className="w-10 h-10 text-gray-400 group-hover:scale-110 transition-transform" />
                    )}
                    <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    </div>
                </div>
                <div>
                    <GlassButton variant="secondary" className="text-xs font-bold rounded-xl" size="sm">
                        {t('avatar.uploadButton')}
                    </GlassButton>
                    <p className="text-xs text-text-muted mt-2">{t('avatar.fileRequirements')}</p>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">{t('fields.fullName')}</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(event) => onFullNameChange(event.target.value)}
                        aria-label="Full Name"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-secondary dark:text-white"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">{t('fields.email')}</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => onEmailChange(event.target.value)}
                        aria-label="Email"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-secondary dark:text-white"
                    />
                </div>
                <div className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                                {t('timezone.label')}
                            </label>
                            <select
                                value={draftTimezone}
                                onChange={(event) => onDraftTimezoneChange(event.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-secondary dark:text-white"
                            >
                                {timezoneOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {getTimezoneDisplayName(option)}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-text-muted">
                                {t('timezone.description')}
                            </p>
                        </div>
                        <GlassButton
                            variant="primary"
                            onClick={onSaveTimezone}
                            disabled={savingTimezone || draftTimezone === timezone}
                            className="rounded-xl px-6"
                        >
                            {savingTimezone ? t('timezone.saving') : t('timezone.save')}
                        </GlassButton>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex justify-end">
                <div className="flex items-center gap-4">
                    {showSuccess && (
                        <span className="animate-in fade-in slide-in-from-right-4 flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                            Saved
                        </span>
                    )}
                    <GlassButton variant="primary" onClick={() => { void onSave(); }} disabled={loading || !fullName.trim() || !email.trim()} className="rounded-xl px-8">
                    {loading ? t('actions.saving') : t('actions.save')}
                    </GlassButton>
                </div>
            </div>
        </div>
    );
}
