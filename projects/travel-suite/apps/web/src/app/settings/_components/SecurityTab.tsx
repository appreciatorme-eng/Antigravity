'use client';

import { useEffect, useState, useCallback } from 'react';
import { Shield, Smartphone, Monitor, Tablet, LogOut, RefreshCw } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { authedFetch } from '@/lib/api/authed-fetch';
import { logError } from '@/lib/observability/logger';

interface UserSession {
  id: string;
  supabase_session_id: string | null;
  ip_address: string | null;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
  last_seen_at: string;
}

interface SessionsApiPayload {
  data?: { sessions?: UserSession[] } | null;
  error?: string | null;
}

function DeviceIcon({ deviceName }: { readonly deviceName: string | null }) {
  const name = deviceName?.toLowerCase() ?? '';
  if (name.includes('ipad') || name.includes('tablet')) return <Tablet className="w-5 h-5 text-gray-400 shrink-0" />;
  if (name.includes('mobile') || name.includes('iphone') || name.includes('android') || name.includes('phone')) {
    return <Smartphone className="w-5 h-5 text-gray-400 shrink-0" />;
  }
  return <Monitor className="w-5 h-5 text-gray-400 shrink-0" />;
}

function formatLastSeen(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Active Now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatSessionLabel(session: UserSession): string {
  const parts: string[] = [];
  if (session.city) parts.push(session.city);
  if (session.country && session.country !== session.city) parts.push(session.country);
  if (session.browser) parts.push(session.browser);
  parts.push(formatLastSeen(session.last_seen_at));
  return parts.join(' · ');
}

export function SecurityTab() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authedFetch('/api/admin/security/sessions', { cache: 'no-store' });
      const payload = (await response.json()) as SessionsApiPayload;
      if (response.ok) {
        const list = payload.data?.sessions ?? [];
        setSessions(list);
        // Most recent session by last_seen_at is the current one
        if (list.length > 0) setCurrentSessionId(list[0]?.id ?? null);
      }
    } catch (error) {
      logError('[SecurityTab] Failed to load sessions', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSessions(); }, [fetchSessions]);

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const response = await authedFetch('/api/admin/security/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    } catch (error) {
      logError('[SecurityTab] Failed to revoke session', error);
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-secondary">Security Posture</h2>
        <p className="text-sm text-text-secondary mt-1">Audit privileges and fortify application defense systems.</p>
      </div>

      <div className="space-y-6">
        <div className="p-5 border border-amber-200 bg-amber-50 rounded-2xl flex items-start gap-4">
          <Shield className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-amber-900">Two-Factor Authentication Pipeline</h4>
            <p className="text-sm text-amber-800/80 mt-1 mb-3">Enforce 2FA via authenticator app across your entire organization payload.</p>
            <GlassButton variant="outline" className="text-xs bg-white border-amber-200 text-amber-700 hover:bg-amber-100">
              Enforce Policy
            </GlassButton>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary">Active Sessions</h3>
            <button
              type="button"
              onClick={() => { void fetchSessions(); }}
              className="text-gray-400 hover:text-primary transition-colors p-1 rounded"
              aria-label="Refresh sessions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading && sessions.length === 0 && (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <p className="text-sm text-text-muted py-4 text-center">
              No sessions recorded yet. Sessions are captured on each login.
            </p>
          )}

          {sessions.map((session) => {
            const isCurrent = session.id === currentSessionId;
            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <DeviceIcon deviceName={session.device_name} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-secondary truncate">
                      {session.device_name ?? 'Unknown Device'}
                      {session.os ? <span className="font-normal text-text-muted"> · {session.os}</span> : null}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 truncate">
                      {formatSessionLabel(session)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {isCurrent ? (
                    <GlassBadge variant="success">Current</GlassBadge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { void revokeSession(session.id); }}
                      disabled={revoking === session.id}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                      aria-label="Sign out this session"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {revoking === session.id ? 'Signing out…' : 'Sign out'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
