"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  CreditCard,
  Star,
  MessageSquare,
  MapPin,
} from "lucide-react";
import { formatINRShort } from "@/lib/india/formats";
import type { OperatorScorecardPayload } from "@/lib/admin/operator-scorecard";

interface ScorecardCardProps {
  scorecard: OperatorScorecardPayload;
  index?: number;
}

function StatusBadge({ status }: { status: "leading" | "steady" | "at_risk" }) {
  if (status === "leading") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-sm font-bold text-emerald-400">
        <TrendingUp className="h-3.5 w-3.5" />
        Leading
      </span>
    );
  }
  if (status === "steady") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1 text-sm font-bold text-blue-400">
        <Minus className="h-3.5 w-3.5" />
        Steady
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-sm font-bold text-rose-400">
      <TrendingDown className="h-3.5 w-3.5" />
      At Risk
    </span>
  );
}

function DeltaIndicator({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
        <Minus className="h-3 w-3" />
        No change
      </span>
    );
  }

  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <TrendingUp className="h-3 w-3" />
        +{value.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-rose-400">
      <TrendingDown className="h-3 w-3" />
      {value.toFixed(1)}%
    </span>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  delta?: number | null;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          <Icon className="h-4 w-4 text-zinc-400" />
        </div>
        <span className="text-sm text-zinc-300">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white">{value}</span>
        {delta !== undefined && <DeltaIndicator value={delta} />}
      </div>
    </div>
  );
}

export function ScorecardCard({ scorecard, index = 0 }: ScorecardCardProps) {
  const { score, status, metrics, comparison, highlights, actions, monthLabel, topDestinations } = scorecard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{monthLabel}</h3>
          <p className="mt-1 text-sm text-zinc-400">Monthly Performance Report</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={status} />
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{score.toFixed(1)}</div>
            <div className="text-xs text-zinc-500">Performance Score</div>
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      {highlights.length > 0 && (
        <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
          <h4 className="mb-2 text-sm font-semibold text-emerald-400">✨ Highlights</h4>
          <ul className="space-y-1.5">
            {highlights.map((highlight, idx) => (
              <li key={idx} className="text-sm text-zinc-300 leading-relaxed">
                • {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions Section */}
      {actions.length > 0 && (
        <div className="mb-6 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
          <h4 className="mb-2 text-sm font-semibold text-blue-400">🎯 Recommended Actions</h4>
          <ul className="space-y-1.5">
            {actions.map((action, idx) => (
              <li key={idx} className="text-sm text-zinc-300 leading-relaxed">
                • {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Metrics */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">Key Metrics</h4>
        <div className="space-y-0">
          <MetricRow
            icon={CreditCard}
            label="Revenue"
            value={formatINRShort(metrics.revenueInr)}
            delta={comparison.revenueDeltaPct}
          />
          <MetricRow
            icon={FileText}
            label="Proposals"
            value={`${metrics.proposalsApproved}/${metrics.proposalsCreated}`}
            delta={comparison.proposalDeltaPct}
          />
          <MetricRow
            icon={CreditCard}
            label="Approval Rate"
            value={`${metrics.approvalRate.toFixed(1)}%`}
            delta={comparison.approvalDeltaPct}
          />
          <MetricRow
            icon={CreditCard}
            label="Payment Conversion"
            value={`${metrics.paymentConversionRate.toFixed(1)}%`}
            delta={comparison.paymentDeltaPct}
          />
          {metrics.averageRating !== null && (
            <MetricRow
              icon={Star}
              label="Average Rating"
              value={`${metrics.averageRating.toFixed(1)}/5`}
            />
          )}
          {metrics.reviewResponseRate !== null && (
            <MetricRow
              icon={MessageSquare}
              label="Review Response"
              value={`${metrics.reviewResponseRate.toFixed(1)}%`}
              delta={comparison.reviewResponseDeltaPct}
            />
          )}
        </div>
      </div>

      {/* Top Destinations */}
      {topDestinations.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
            Top Destinations
          </h4>
          <div className="space-y-2">
            {topDestinations.map((dest, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-zinc-300">{dest.destination}</span>
                </div>
                <span className="text-sm font-semibold text-white">{dest.count} trips</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
