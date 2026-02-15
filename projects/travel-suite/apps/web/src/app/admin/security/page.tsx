"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, RefreshCcw, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";

type Health = "ok" | "warn";

type SecurityDiagnostics = {
  checked_at: string;
  cron_auth: {
    legacy_secret_configured: boolean;
    signing_secret_configured: boolean;
    service_role_bearer_supported: boolean;
  };
  live_share_rate_limit: {
    threshold_per_minute: number;
    access_requests_last_5m: number;
    access_requests_last_1h: number;
    unique_ip_hashes_last_1h: number;
    top_share_hash_prefixes_last_1h: Array<{ hash_prefix: string; count: number }>;
  };
  rls: {
    summary: {
      tables_expected: number;
      tables_with_rls: number;
      missing_policy_count: number;
    };
    tables: Array<{ table_name: string; rls_enabled: boolean; policy_count: number }>;
    required_policies: Array<{ table_name: string; policy_name: string; present: boolean }>;
  };
  firebase_edge_function: {
    service_account_secret_configured: boolean;
    project_id_configured: boolean;
  };
};

function getBadgeVariant(ok: boolean): "success" | "danger" {
  return ok ? "success" : "danger";
}

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/security/diagnostics", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load diagnostics");
      }
      setData(payload as SecurityDiagnostics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load diagnostics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDiagnostics();
  }, [fetchDiagnostics]);

  const rlsOk = data ? data.rls.summary.tables_with_rls === data.rls.summary.tables_expected && data.rls.summary.missing_policy_count === 0 : false;
  const cronOk = data ? data.cron_auth.signing_secret_configured || data.cron_auth.legacy_secret_configured : false;
  const firebaseOk = data ? data.firebase_edge_function.project_id_configured && data.firebase_edge_function.service_account_secret_configured : false;

  const overall: Health = rlsOk && cronOk && firebaseOk ? "ok" : "warn";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-bold">Security</span>
            <h1 className="text-3xl font-serif text-secondary dark:text-white">Security Diagnostics</h1>
            <p className="text-text-secondary mt-1">Cron auth, live-share rate limit telemetry, and RLS policy diagnostics.</p>
          </div>
        </div>
        <GlassButton
          onClick={() => void fetchDiagnostics()}
          variant="ghost"
          disabled={loading}
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </GlassButton>
      </div>

      {/* Error State */}
      {error && (
        <GlassCard padding="lg" className="bg-red-100/50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </GlassCard>
      )}

      {/* Overall Status */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-2 mb-3">
          {overall === "ok" ? <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          <GlassBadge variant={overall === "ok" ? "success" : "warning"}>
            {overall === "ok" ? "Secure baseline" : "Needs attention"}
          </GlassBadge>
          <span className="text-xs text-text-secondary">{data?.checked_at ? `Checked ${new Date(data.checked_at).toLocaleString()}` : "Checking..."}</span>
        </div>

        {/* Security Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cron Auth */}
          <div className="rounded-xl border border-white/20 bg-white/10 dark:bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-primary mb-2">Cron Auth</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Legacy secret</span>
                <GlassBadge variant={getBadgeVariant(!!data?.cron_auth.legacy_secret_configured)} size="sm">
                  {data?.cron_auth.legacy_secret_configured ? "ON" : "OFF"}
                </GlassBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Signed HMAC</span>
                <GlassBadge variant={getBadgeVariant(!!data?.cron_auth.signing_secret_configured)} size="sm">
                  {data?.cron_auth.signing_secret_configured ? "ON" : "OFF"}
                </GlassBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Service-role bearer</span>
                <GlassBadge variant={getBadgeVariant(!!data?.cron_auth.service_role_bearer_supported)} size="sm">
                  {data?.cron_auth.service_role_bearer_supported ? "ON" : "OFF"}
                </GlassBadge>
              </div>
            </div>
          </div>

          {/* Live Share Access */}
          <div className="rounded-xl border border-white/20 bg-white/10 dark:bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-primary mb-2">Live Share Access</p>
            <div className="space-y-1 text-sm text-secondary dark:text-white">
              <p>Threshold/min: <span className="font-semibold">{data?.live_share_rate_limit.threshold_per_minute ?? "-"}</span></p>
              <p>Requests (5m): <span className="font-semibold">{data?.live_share_rate_limit.access_requests_last_5m ?? "-"}</span></p>
              <p>Requests (1h): <span className="font-semibold">{data?.live_share_rate_limit.access_requests_last_1h ?? "-"}</span></p>
              <p>Unique IP hashes (1h): <span className="font-semibold">{data?.live_share_rate_limit.unique_ip_hashes_last_1h ?? "-"}</span></p>
            </div>
          </div>

          {/* RLS Summary */}
          <div className="rounded-xl border border-white/20 bg-white/10 dark:bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-primary mb-2">RLS Summary</p>
            <div className="space-y-1 text-sm text-secondary dark:text-white">
              <p>Tables expected: <span className="font-semibold">{data?.rls.summary.tables_expected ?? "-"}</span></p>
              <p>Tables with RLS: <span className="font-semibold">{data?.rls.summary.tables_with_rls ?? "-"}</span></p>
              <p>Missing required policies: <span className="font-semibold">{data?.rls.summary.missing_policy_count ?? "-"}</span></p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* RLS Table Status */}
      <GlassCard padding="lg">
        <h2 className="text-lg font-serif text-secondary dark:text-white mb-3">RLS Table Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-text-secondary">
                <th className="py-2 pr-3">Table</th>
                <th className="py-2 pr-3">RLS</th>
                <th className="py-2">Policies</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rls.tables || []).map((row) => (
                <tr key={row.table_name} className="border-b border-white/10">
                  <td className="py-2 pr-3 font-mono text-xs text-secondary dark:text-white">{row.table_name}</td>
                  <td className="py-2 pr-3">
                    <GlassBadge variant={getBadgeVariant(row.rls_enabled)} size="sm">
                      {row.rls_enabled ? "enabled" : "disabled"}
                    </GlassBadge>
                  </td>
                  <td className="py-2 text-text-secondary">{row.policy_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Most Accessed Share Hash Prefixes */}
      <GlassCard padding="lg">
        <h2 className="text-lg font-serif text-secondary dark:text-white mb-3">Most Accessed Share Hash Prefixes (1h)</h2>
        {data?.live_share_rate_limit.top_share_hash_prefixes_last_1h?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.live_share_rate_limit.top_share_hash_prefixes_last_1h.map((item) => (
              <GlassBadge key={item.hash_prefix} variant="default" size="sm">
                {item.hash_prefix}... : {item.count}
              </GlassBadge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No share-access logs in the last hour.</p>
        )}
      </GlassCard>
    </div>
  );
}
