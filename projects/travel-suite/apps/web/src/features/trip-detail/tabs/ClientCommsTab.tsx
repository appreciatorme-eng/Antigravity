"use client";

import Link from "next/link";
import {
  User, Mail, Phone, MessageCircle, ExternalLink,
  Bell, Send, UtensilsCrossed, Compass, Wallet, ShieldAlert,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassBadge } from "@/components/glass/GlassBadge";
import { TripNotificationHistory } from "@/features/trip-detail/components/TripNotificationHistory";
import { useTripNotifications } from "@/lib/queries/trip-detail";
import type { Trip, TripProfile, TripNotificationEntry } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClientCommsTabProps {
  trip: Trip;
}

// ---------------------------------------------------------------------------
// Section header (same pattern as OverviewTab)
// ---------------------------------------------------------------------------

function SectionHeader({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preference display item
// ---------------------------------------------------------------------------

interface PreferenceItem {
  label: string;
  value: string;
  icon: typeof UtensilsCrossed;
}

function formatBudgetRange(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function buildPreferences(client: TripProfile): readonly PreferenceItem[] {
  const items: PreferenceItem[] = [];

  if (client.dietary_requirements && client.dietary_requirements.length > 0) {
    items.push({
      label: "Dietary Requirements",
      value: client.dietary_requirements.join(", "),
      icon: UtensilsCrossed,
    });
  }

  if (client.travel_style) {
    items.push({ label: "Travel Style", value: client.travel_style, icon: Compass });
  }

  const budgetStr = formatBudgetRange(client.budget_min, client.budget_max);
  if (budgetStr) {
    items.push({ label: "Budget Range", value: budgetStr, icon: Wallet });
  }

  if (client.mobility_needs) {
    items.push({ label: "Mobility Needs", value: client.mobility_needs, icon: ShieldAlert });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Client Profile Card (expanded version for this tab)
// ---------------------------------------------------------------------------

function ClientProfileCard({ client }: { client: TripProfile }) {
  const preferences = buildPreferences(client);

  return (
    <GlassCard padding="xl">
      <SectionHeader icon={User} label="Client Profile" />

      {/* Full name */}
      <h2 className="text-2xl font-serif font-bold text-secondary dark:text-white tracking-tight mb-5">
        {client.full_name}
      </h2>

      {/* Contact details */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-text-muted shrink-0" />
          <span className="text-sm font-bold text-secondary dark:text-slate-300 truncate">
            {client.email}
          </span>
        </div>

        {client.phone && (
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-text-muted shrink-0" />
            <span className="text-sm font-bold text-secondary dark:text-slate-300">
              {client.phone}
            </span>
          </div>
        )}

        {client.phone_whatsapp && (
          <a
            href={`https://wa.me/${client.phone_whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-bold">WhatsApp</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
          </a>
        )}
      </div>

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2 mb-5">
        {client.phone && (
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() => window.open(`tel:${client.phone}`, "_self")}
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </GlassButton>
        )}
        <GlassButton
          variant="outline"
          size="sm"
          onClick={() => window.open(`mailto:${client.email}`, "_self")}
        >
          <Mail className="w-3.5 h-3.5" />
          Email
        </GlassButton>
        {client.phone_whatsapp && (
          <GlassButton
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`https://wa.me/${client.phone_whatsapp}`, "_blank")
            }
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </GlassButton>
        )}
      </div>

      {/* Travel preferences */}
      {preferences.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-800 pt-5 mb-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">
            Travel Preferences
          </p>
          <div className="space-y-4">
            {preferences.map((pref) => {
              const PrefIcon = pref.icon;
              return (
                <div key={pref.label} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <PrefIcon className="w-3.5 h-3.5 text-text-muted" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      {pref.label}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-secondary dark:text-slate-300 pl-[22px]">
                    {pref.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View full profile link */}
      <Link
        href={`/clients/${client.id}`}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
      >
        <span className="text-[10px] font-black uppercase tracking-widest">
          View Full Profile
        </span>
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Communication Summary Card
// ---------------------------------------------------------------------------

function buildTypeCounts(
  notifications: TripNotificationEntry[],
): ReadonlyArray<{ type: string; count: number }> {
  const counts = new Map<string, number>();
  for (const entry of notifications) {
    const current = counts.get(entry.notification_type) ?? 0;
    counts.set(entry.notification_type, current + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

function formatNotificationType(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getLastNotificationDate(notifications: TripNotificationEntry[]): string {
  if (notifications.length === 0) return "N/A";
  const latest = notifications[0];
  const dateStr = latest.sent_at || latest.created_at;
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CommunicationSummaryCard({
  notifications,
  loading,
}: {
  notifications: TripNotificationEntry[];
  loading: boolean;
}) {
  const typeCounts = buildTypeCounts(notifications);
  const lastDate = getLastNotificationDate(notifications);

  return (
    <GlassCard padding="xl">
      <SectionHeader icon={Bell} label="Communication Summary" />

      {loading && (
        <p className="text-sm text-text-muted animate-pulse">Loading...</p>
      )}

      {!loading && (
        <div className="space-y-4">
          {/* Total count */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">
              Total Notifications
            </p>
            <p className="text-3xl font-serif font-bold text-secondary dark:text-white">
              {notifications.length}
            </p>
          </div>

          {/* Breakdown by type */}
          {typeCounts.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                By Type
              </p>
              <div className="space-y-2">
                {typeCounts.map(({ type, count }) => (
                  <div
                    key={type}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-secondary dark:text-slate-300">
                      {formatNotificationType(type)}
                    </span>
                    <GlassBadge variant="info" size="sm">
                      {count}
                    </GlassBadge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last notification */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">
              Last Notification
            </p>
            <p className="text-sm font-bold text-secondary dark:text-slate-300">
              {lastDate}
            </p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Quick Send Card
// ---------------------------------------------------------------------------

const NOTIFICATION_TEMPLATES = [
  { label: "Trip Confirmation", icon: Send },
  { label: "Pickup Reminder", icon: Bell },
  { label: "Itinerary Update", icon: Mail },
] as const;

function QuickSendCard() {
  return (
    <GlassCard padding="xl">
      <SectionHeader icon={Send} label="Send Notification" />

      <div className="space-y-3">
        {NOTIFICATION_TEMPLATES.map((template) => {
          const TemplateIcon = template.icon;
          return (
            <GlassButton
              key={template.label}
              variant="outline"
              size="sm"
              fullWidth
              className="justify-start gap-3"
              onClick={() => {
                // Placeholder: will integrate with notification sending
              }}
            >
              <TemplateIcon className="w-4 h-4 shrink-0" />
              {template.label}
            </GlassButton>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Empty state (no client linked)
// ---------------------------------------------------------------------------

function NoClientState() {
  return (
    <div className="col-span-12">
      <GlassCard padding="xl">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-400 mb-2">
            No client linked to this trip
          </p>
          <p className="text-sm text-text-muted">
            Link a client to enable communication features.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ClientCommsTab({ trip }: ClientCommsTabProps) {
  const { data, isLoading } = useTripNotifications(trip.id);
  const notifications = data?.notifications ?? [];
  const client = trip.profiles;

  if (!client) {
    return (
      <div className="grid grid-cols-12 gap-6">
        <NoClientState />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left column */}
      <div className="col-span-12 xl:col-span-8 space-y-6">
        <ClientProfileCard client={client} />
        <TripNotificationHistory notifications={notifications} loading={isLoading} />
      </div>

      {/* Right column */}
      <div className="col-span-12 xl:col-span-4 space-y-6">
        <CommunicationSummaryCard notifications={notifications} loading={isLoading} />
        <QuickSendCard />
      </div>
    </div>
  );
}
