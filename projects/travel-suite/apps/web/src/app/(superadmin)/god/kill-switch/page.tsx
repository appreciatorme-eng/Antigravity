// Kill Switch — emergency controls for maintenance mode, feature flags, and org suspensions.

"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldAlert, Power, RefreshCw } from "lucide-react";
import ToggleSwitch from "@/components/god-mode/ToggleSwitch";
import ConfirmDangerModal from "@/components/god-mode/ConfirmDangerModal";

interface PlatformSettings {
    maintenance_mode?: { value: { enabled: boolean; message?: string }; updated_at?: string };
    feature_flags?: { value: { ai_enabled: boolean; marketplace_enabled: boolean; social_enabled: boolean; reputation_enabled: boolean; whatsapp_enabled: boolean }; updated_at?: string };
    spend_limits?: { value: { pause_all_ai: boolean; global_daily_cap_usd: number }; updated_at?: string };
    org_suspensions?: { value: { suspended_org_ids: string[] }; updated_at?: string };
}

interface PendingToggle {
    key: string;
    path: string;
    newValue: boolean;
    label: string;
}

export default function KillSwitchPage() {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState<PendingToggle | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/superadmin/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data.settings ?? {});
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    function requestToggle(key: string, path: string, newValue: boolean, label: string) {
        setPending({ key, path, newValue, label });
    }

    async function confirmToggle() {
        if (!pending || !settings) return;
        setSubmitting(true);
        try {
            // Build new value by merging path into existing setting
            const current = (settings as Record<string, { value: Record<string, unknown> }>)[pending.key]?.value ?? {};
            const updated = { ...current };

            // path like "enabled" or "ai_enabled" — all are top-level
            updated[pending.path] = pending.newValue;

            const res = await fetch("/api/superadmin/settings/kill-switch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: pending.key, value: updated }),
            });

            if (res.ok) {
                await fetchSettings();
            }
        } finally {
            setSubmitting(false);
            setPending(null);
        }
    }

    const maintenance = settings?.maintenance_mode?.value;
    const flags = settings?.feature_flags?.value;
    const spendLimits = settings?.spend_limits?.value;

    const maintenanceOn = maintenance?.enabled ?? false;
    const aiEnabled = flags?.ai_enabled ?? true;
    const marketplaceEnabled = flags?.marketplace_enabled ?? true;
    const socialEnabled = flags?.social_enabled ?? true;
    const reputationEnabled = flags?.reputation_enabled ?? true;
    const whatsappEnabled = flags?.whatsapp_enabled ?? true;
    const pauseAllAi = spendLimits?.pause_all_ai ?? false;

    return (
        <div className="space-y-6">
            {/* Red warning header */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/40 border border-red-900/60">
                <ShieldAlert className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-red-300">Emergency Control Panel</p>
                    <p className="text-sm text-red-400/80 mt-0.5">
                        These controls affect the ENTIRE platform. Changes propagate within 60 seconds via Redis.
                    </p>
                </div>
                <button
                    onClick={fetchSettings}
                    disabled={loading}
                    className="ml-auto p-2 rounded-lg bg-red-900/40 border border-red-900/60 text-red-400
                               hover:text-red-300 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Maintenance mode */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Power className="w-4 h-4 text-red-400" />
                    Platform Status
                </h2>
                <ToggleSwitch
                    enabled={maintenanceOn}
                    label="Maintenance Mode"
                    description="All /api/admin/* endpoints return 503. Only superadmin and health routes pass through."
                    dangerous
                    onToggle={(v) => requestToggle("maintenance_mode", "enabled", v, "Maintenance Mode")}
                    lastChanged={settings?.maintenance_mode?.updated_at}
                />
                <ToggleSwitch
                    enabled={pauseAllAi}
                    label="Pause All AI"
                    description="AI endpoints (OpenAI, FAL.ai) return cost-pause error immediately."
                    dangerous
                    onToggle={(v) => requestToggle("spend_limits", "pause_all_ai", v, "Pause All AI")}
                    lastChanged={settings?.spend_limits?.updated_at}
                />
            </div>

            {/* Feature flags */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Feature Flags
                </h2>
                <ToggleSwitch
                    enabled={aiEnabled}
                    label="AI Assistant"
                    description="Trip planning and assistant chat features."
                    onToggle={(v) => requestToggle("feature_flags", "ai_enabled", v, "AI Assistant")}
                    lastChanged={settings?.feature_flags?.updated_at}
                />
                <ToggleSwitch
                    enabled={marketplaceEnabled}
                    label="Marketplace"
                    description="Activity and service marketplace browsing and booking."
                    onToggle={(v) => requestToggle("feature_flags", "marketplace_enabled", v, "Marketplace")}
                    lastChanged={settings?.feature_flags?.updated_at}
                />
                <ToggleSwitch
                    enabled={socialEnabled}
                    label="Social Studio"
                    description="Social post creation and publishing pipeline."
                    onToggle={(v) => requestToggle("feature_flags", "social_enabled", v, "Social Studio")}
                    lastChanged={settings?.feature_flags?.updated_at}
                />
                <ToggleSwitch
                    enabled={reputationEnabled}
                    label="Reputation Campaigns"
                    description="Review campaigns and reputation automation."
                    onToggle={(v) => requestToggle("feature_flags", "reputation_enabled", v, "Reputation Campaigns")}
                    lastChanged={settings?.feature_flags?.updated_at}
                />
                <ToggleSwitch
                    enabled={whatsappEnabled}
                    label="WhatsApp"
                    description="WhatsApp send/receive for all organizations."
                    onToggle={(v) => requestToggle("feature_flags", "whatsapp_enabled", v, "WhatsApp")}
                    lastChanged={settings?.feature_flags?.updated_at}
                />
            </div>

            {/* Currently suspended orgs */}
            {(settings?.org_suspensions?.value?.suspended_org_ids?.length ?? 0) > 0 && (
                <div className="bg-gray-900 border border-red-900/40 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
                        Suspended Organizations ({settings!.org_suspensions!.value.suspended_org_ids.length})
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {settings!.org_suspensions!.value.suspended_org_ids.map((orgId) => (
                            <span
                                key={orgId}
                                className="px-3 py-1 rounded-full bg-red-950/60 border border-red-900/60 text-red-300 text-xs font-mono"
                            >
                                {orgId}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Confirm modal */}
            {pending && (
                <ConfirmDangerModal
                    open={true}
                    title={`${pending.newValue ? "Enable" : "Disable"} ${pending.label}?`}
                    message={pending.key === "maintenance_mode" && pending.newValue
                        ? "This will block all admin API calls immediately. Only this superadmin panel will remain accessible."
                        : `This change takes effect within 60 seconds via Redis cache invalidation.`
                    }
                    onConfirm={confirmToggle}
                    onCancel={() => setPending(null)}
                    loading={submitting}
                />
            )}
        </div>
    );
}
