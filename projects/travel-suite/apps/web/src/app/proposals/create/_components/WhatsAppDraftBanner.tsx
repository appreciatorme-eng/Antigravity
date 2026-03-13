'use client';

import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassCard } from '@/components/glass/GlassCard';
import type { WhatsAppProposalDraft } from '../_types';

export interface WhatsAppDraftBannerProps {
  loading: boolean;
  draft: WhatsAppProposalDraft | null;
}

export function WhatsAppDraftBanner({ loading, draft }: WhatsAppDraftBannerProps) {
  if (loading) {
    return (
      <GlassCard padding="md" rounded="xl" opacity="high" className="border-[#eadfcd] bg-[#fffdf8]">
        <p className="text-sm text-[#6f5b3e]">Loading WhatsApp lead context...</p>
      </GlassCard>
    );
  }

  if (!draft) {
    return null;
  }

  return (
    <GlassCard padding="md" rounded="xl" opacity="high" className="border-[#eadfcd] bg-[#fffdf8]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GlassBadge variant="secondary">Prefilled from WhatsApp</GlassBadge>
            <span className="text-xs uppercase tracking-wide text-[#6f5b3e]">
              Draft status: {draft.status}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#1b140a]">{draft.title}</p>
          <p className="mt-1 text-sm text-[#6f5b3e]">
            {[
              draft.destination,
              draft.travelDates,
              draft.groupSize ? `${draft.groupSize} travellers` : null,
              draft.budgetInr
                ? `Budget \u20B9${draft.budgetInr.toLocaleString('en-IN')}`
                : null,
            ]
              .filter(Boolean)
              .join(' \u2022 ')}
          </p>
        </div>
        <div className="rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-sm text-[#6f5b3e]">
          <p className="font-medium text-[#1b140a]">
            {draft.travelerName || 'WhatsApp lead'}
          </p>
          <p>{draft.travelerPhone}</p>
          {draft.travelerEmail ? <p>{draft.travelerEmail}</p> : null}
        </div>
      </div>
    </GlassCard>
  );
}
