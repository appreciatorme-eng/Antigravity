"use client";

import Link from "next/link";
import { User, Mail, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import type { TripProfile } from "@/features/trip-detail/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripClientCardProps {
  client: TripProfile | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripClientCard({ client }: TripClientCardProps) {
  if (!client) {
    return (
      <GlassCard padding="xl">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <User className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-400">No client linked</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <User className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
          Client
        </span>
      </div>

      {/* Client name */}
      <h3 className="text-lg font-bold text-secondary dark:text-white mb-4">
        {client.full_name}
      </h3>

      {/* Contact details */}
      <div className="space-y-3">
        {/* Email */}
        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-text-muted shrink-0" />
          <span className="text-sm font-bold text-secondary dark:text-slate-300 truncate">
            {client.email}
          </span>
        </div>

        {/* Phone */}
        {client.phone && (
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-text-muted shrink-0" />
            <span className="text-sm font-bold text-secondary dark:text-slate-300">
              {client.phone}
            </span>
          </div>
        )}

        {/* WhatsApp */}
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

      {/* View full profile link */}
      <Link
        href={`/clients/${client.id}`}
        className="mt-5 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
      >
        <span className="text-[10px] font-black uppercase tracking-widest">
          View Full Profile
        </span>
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </GlassCard>
  );
}
