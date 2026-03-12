import {
  CheckCircle2,
  Clock,
  MessageCircle,
  XCircle,
} from 'lucide-react';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassCard } from '@/components/glass/GlassCard';

export interface NotificationLog {
  id: string;
  trip_id: string | null;
  recipient_id: string | null;
  recipient_phone: string | null;
  recipient_type: string | null;
  notification_type: string;
  title: string | null;
  body: string | null;
  status: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export interface QueueHealth {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  upcomingHour: number;
}

export interface DeliveryRow {
  id: string;
  queue_id: string | null;
  trip_id: string | null;
  channel: 'whatsapp' | 'push' | 'email';
  status: 'queued' | 'processing' | 'sent' | 'failed' | 'skipped' | 'retrying';
  attempt_number: number;
  error_message: string | null;
  created_at: string;
}

export interface DeliveryResponse {
  rows: DeliveryRow[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  summary: {
    counts_by_status: Record<string, number>;
  };
}

export const NOTIFICATION_LOG_SELECT = [
  'body',
  'created_at',
  'error_message',
  'id',
  'notification_type',
  'profiles:recipient_id(full_name, email)',
  'recipient_id',
  'recipient_phone',
  'recipient_type',
  'sent_at',
  'status',
  'title',
  'trip_id',
].join(', ');

export interface WhatsAppHealthSummary {
  total_driver_profiles: number;
  drivers_with_phone: number;
  drivers_missing_phone: number;
  active_trips_with_driver: number;
  stale_active_driver_trips: number;
  location_pings_last_1h: number;
  location_pings_last_24h: number;
  unmapped_external_drivers: number;
}

export interface WhatsAppHealthPing {
  driver_id: string;
  driver_name: string;
  trip_id: string | null;
  recorded_at: string | null;
  age_minutes: number | null;
  status: 'fresh' | 'stale';
}

export interface WhatsAppHealthPayload {
  summary: WhatsAppHealthSummary;
  latest_pings: WhatsAppHealthPing[];
  drivers_missing_phone_list: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    phone?: string | null;
  }>;
}

export function getNotificationStatusIcon(status: string | null) {
  switch (status) {
    case 'sent':
    case 'delivered':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
    default:
      return null;
  }
}

export function formatNotificationDate(dateString: string | null) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

export function filterNotificationLogs(logs: NotificationLog[], searchTerm: string) {
  const normalized = searchTerm.toLowerCase();
  return logs.filter((log) =>
    log.title?.toLowerCase().includes(normalized) ||
    log.body?.toLowerCase().includes(normalized) ||
    log.profiles?.full_name?.toLowerCase().includes(normalized),
  );
}

export function normalizePhone(phone?: string | null) {
  return phone ? phone.replace(/\D/g, '') : '';
}

export function buildWhatsAppLink(
  phone?: string | null,
  message?: string | null,
  globalMessage?: string,
) {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) return null;
  const text = encodeURIComponent(
    message || globalMessage || 'Hi! We have an update for you from Travel Suite.',
  );
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

interface NotificationLogsTableProps {
  filteredLogs: NotificationLog[];
  loading: boolean;
  whatsAppMessage: string;
}

export function NotificationLogsTable({
  filteredLogs,
  loading,
  whatsAppMessage,
}: NotificationLogsTableProps) {
  return (
    <GlassCard padding="none" rounded="2xl" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/40 dark:bg-white/5 border-b border-white/40 dark:border-white/5 text-text-secondary text-sm">
              <th className="px-6 py-4 font-medium">Recipient</th>
              <th className="px-6 py-4 font-medium">WhatsApp</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Content</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Sent At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-white/5">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-12"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-48"></div><div className="h-3 bg-white/40 dark:bg-white/10 rounded w-32 mt-2"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-white/40 dark:bg-white/10 rounded w-20"></div></td>
                </tr>
              ))
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                  No notification logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const whatsappLink = buildWhatsAppLink(
                  log.recipient_phone,
                  log.body || log.title,
                  whatsAppMessage,
                );
                return (
                  <tr key={log.id} className="hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-secondary dark:text-white">{log.profiles?.full_name || 'System User'}</div>
                      <div className="text-xs text-text-secondary uppercase tracking-wider mt-0.5">{log.recipient_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1"
                        >
                          <GlassBadge variant="success" size="sm">
                            <MessageCircle className="w-3 h-3" />
                            WhatsApp
                          </GlassBadge>
                        </a>
                      ) : (
                        <span className="text-xs text-text-secondary/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <GlassBadge variant="info" size="sm">
                        {log.notification_type.replace('_', ' ')}
                      </GlassBadge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-secondary dark:text-white font-medium truncate max-w-xs">{log.title}</div>
                      <div className="text-xs text-text-secondary line-clamp-1 max-w-xs">{log.body}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getNotificationStatusIcon(log.status)}
                        <span
                          className={`text-sm font-medium ${
                            log.status === 'sent'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : log.status === 'failed'
                                ? 'text-rose-600 dark:text-rose-400'
                                : log.status === 'pending'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-text-secondary'
                          }`}
                        >
                          {(log.status || 'unknown').charAt(0).toUpperCase() +
                            (log.status || 'unknown').slice(1)}
                        </span>
                      </div>
                      {log.error_message && (
                        <div
                          className="text-[10px] text-rose-400 dark:text-rose-500 mt-1 max-w-[150px] truncate"
                          title={log.error_message}
                        >
                          {log.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {formatNotificationDate(log.sent_at || log.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
