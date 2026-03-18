'use client';

import { Calendar, Sparkles } from 'lucide-react';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import type { DashboardV2State } from './types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatCompactCurrency(value: number): string {
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function buildBriefingSentence(data: DashboardV2State): string {
  const parts: string[] = [];
  const cc = data.critical?.commandCenter;
  const stats = data.critical?.stats;

  if (cc) {
    const depCount = cc.departures.length;
    if (depCount > 0) {
      parts.push(
        `${depCount} departure${depCount > 1 ? 's' : ''} today`,
      );
    }

    const overdueInvoices = cc.pending_payments.filter((p) => p.is_overdue);
    if (overdueInvoices.length > 0) {
      const total = overdueInvoices.reduce((s, p) => s + p.balance_amount, 0);
      parts.push(
        `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} (${formatCompactCurrency(total)})`,
      );
    }

    const urgentQuotes = cc.expiring_quotes.filter(
      (q) => typeof q.hours_to_expiry === 'number' && q.hours_to_expiry <= 72,
    );
    if (urgentQuotes.length > 0) {
      parts.push(
        `${urgentQuotes.length} quote${urgentQuotes.length > 1 ? 's' : ''} expiring soon`,
      );
    }

    const overdueFu = cc.follow_ups.filter((f) => f.overdue);
    if (overdueFu.length > 0) {
      parts.push(
        `${overdueFu.length} overdue follow-up${overdueFu.length > 1 ? 's' : ''}`,
      );
    }
  }

  if (stats && stats.pendingProposals > 0) {
    parts.push(
      `${stats.pendingProposals} pending proposal${stats.pendingProposals > 1 ? 's' : ''}`,
    );
  }

  if (parts.length === 0) {
    return 'All clear — no urgent items right now. Great job staying on top of things.';
  }

  return `You have ${parts.join(', ')}.`;
}

interface MorningBriefingProps {
  data: DashboardV2State;
}

export function MorningBriefing({ data }: MorningBriefingProps) {
  const isLoading = data.phase === 'loading';
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <GlassSkeleton className="h-12 w-72" />
        <GlassSkeleton className="h-5 w-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div className="space-y-2">
        <h1 className="text-4xl font-serif leading-none tracking-tight text-secondary dark:text-white md:text-5xl">
          {getGreeting()}
        </h1>
        <div className="flex items-center gap-2 text-text-muted">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="max-w-2xl text-sm font-medium">
            {buildBriefingSentence(data)}
          </p>
        </div>
      </div>

      <div className="flex h-12 shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="text-sm font-black uppercase tracking-tighter text-secondary dark:text-white">
          {todayLabel}
        </span>
      </div>
    </div>
  );
}
