'use client';

import Link from 'next/link';
import type { FeatureLimitSnapshot } from '../_types';

export interface ProposalLimitBannerProps {
  proposalLimit: FeatureLimitSnapshot | null;
}

export function ProposalLimitBanner({ proposalLimit }: ProposalLimitBannerProps) {
  const visibleLimit =
    proposalLimit && proposalLimit.limit !== null ? proposalLimit : null;

  if (!visibleLimit) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border p-4 flex items-center justify-between gap-3 ${
        visibleLimit.allowed
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div>
        <p
          className={`text-sm font-medium ${
            visibleLimit.allowed ? 'text-emerald-900' : 'text-amber-900'
          }`}
        >
          Proposal usage this month: {visibleLimit.used}/{visibleLimit.limit}
        </p>
        <p
          className={`text-xs mt-1 ${
            visibleLimit.allowed ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          {visibleLimit.allowed
            ? `${visibleLimit.remaining ?? 0} proposals remaining on your ${visibleLimit.tier} plan.`
            : 'Limit reached. Upgrade your plan to continue creating proposals.'}
        </p>
      </div>
      <Link
        href="/admin/billing"
        className={`text-sm font-medium underline-offset-2 hover:underline ${
          visibleLimit.allowed ? 'text-emerald-800' : 'text-amber-800'
        }`}
      >
        Open Billing
      </Link>
    </div>
  );
}
