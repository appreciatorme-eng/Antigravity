import {
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

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
