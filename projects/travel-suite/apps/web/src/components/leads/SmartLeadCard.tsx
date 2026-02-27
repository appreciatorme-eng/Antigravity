'use client';

import React, { useMemo } from 'react';
import { MapPin, Users, Calendar, Zap, ChevronRight } from 'lucide-react';
import { parseLeadMessage, ParsedIntent } from '@/lib/leads/intent-parser';

interface SmartLeadCardProps {
  message: string;
  phone: string;
  contactName?: string;
  onConvert: (intent: ParsedIntent) => void;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70
      ? 'bg-[#00d084]/20 text-[#00d084] border-[#00d084]/30'
      : pct >= 40
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-white/10 text-white/50 border-white/20';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {pct}% match
    </span>
  );
}

interface ChipProps {
  icon: React.ReactNode;
  label: string;
  colorClass?: string;
}

function InfoChip({ icon, label, colorClass = 'bg-white/10 text-white/70 border-white/10' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {icon}
      {label}
    </span>
  );
}

export default function SmartLeadCard({
  message,
  phone,
  contactName,
  onConvert,
}: SmartLeadCardProps) {
  const intent = useMemo(() => parseLeadMessage(message), [message]);

  const isWeakSignal = intent.confidence < 0.4;

  const displayName =
    contactName || intent.extractedName || phone;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[#00d084] font-semibold text-sm">
            <Zap className="w-3.5 h-3.5 fill-[#00d084]" />
            Lead Detected
          </span>
        </div>
        <ConfidenceBadge value={intent.confidence} />
      </div>

      {/* Weak-signal notice */}
      {isWeakSignal && (
        <p className="text-white/40 text-xs leading-relaxed">
          Looks like a general inquiry — not enough detail to auto-fill everything.
        </p>
      )}

      {/* Extracted chips — only render those we have data for */}
      {!isWeakSignal && (
        <div className="flex flex-wrap gap-2">
          {intent.destination && (
            <InfoChip
              icon={<MapPin className="w-3 h-3" />}
              label={intent.destination}
              colorClass="bg-[#00d084]/10 text-[#00d084] border-[#00d084]/20"
            />
          )}
          {intent.travelers !== null && (
            <InfoChip
              icon={<Users className="w-3 h-3" />}
              label={`${intent.travelers} traveler${intent.travelers !== 1 ? 's' : ''}`}
              colorClass="bg-blue-500/10 text-blue-300 border-blue-500/20"
            />
          )}
          {intent.durationDays !== null && (
            <InfoChip
              icon={<Calendar className="w-3 h-3" />}
              label={`${intent.durationDays} days`}
              colorClass="bg-purple-500/10 text-purple-300 border-purple-500/20"
            />
          )}
          {intent.budgetTier && (
            <InfoChip
              icon={<span className="text-[10px]">₹</span>}
              label={intent.budgetTier.charAt(0).toUpperCase() + intent.budgetTier.slice(1)}
              colorClass="bg-amber-500/10 text-amber-300 border-amber-500/20"
            />
          )}
        </div>
      )}

      {/* Contact line */}
      <p className="text-white/50 text-xs truncate">
        {displayName !== phone ? (
          <>
            <span className="text-white/70">{displayName}</span>
            <span className="mx-1.5">·</span>
            {phone}
          </>
        ) : (
          phone
        )}
      </p>

      {/* CTA */}
      <button
        onClick={() => onConvert(intent)}
        className="w-full flex items-center justify-center gap-2 bg-[#00d084] hover:bg-[#00b873] active:scale-95 transition-all duration-150 text-black font-semibold rounded-xl py-2.5 text-sm"
      >
        Convert to Booking
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Sub-note */}
      <p className="text-center text-white/30 text-[11px]">
        Pre-fills from this conversation
      </p>
    </div>
  );
}
