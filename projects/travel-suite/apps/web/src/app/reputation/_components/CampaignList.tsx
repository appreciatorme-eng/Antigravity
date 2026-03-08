"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ReputationReviewCampaign, CampaignStatus } from "@/lib/reputation/types";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/reputation/constants";

interface CampaignListProps {
  campaigns: ReputationReviewCampaign[];
  onChanged?: () => Promise<void> | void;
}

const STATUS_STYLES: Record<
  CampaignStatus,
  { bg: string; text: string; dot: string }
> = {
  active: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  paused: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    dot: "bg-amber-500",
  },
  archived: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
  },
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.archived;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

function TypeBadge({ campaignType }: { campaignType: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600">
      {CAMPAIGN_TYPE_LABELS[campaignType] ?? campaignType}
    </span>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-xs font-bold text-gray-600">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

export default function CampaignList({ campaigns, onChanged }: CampaignListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusChange = useCallback(async (campaignId: string, status: CampaignStatus) => {
    try {
      const method = status === "archived" ? "DELETE" : "PATCH";
      const url = `/api/reputation/campaigns/${campaignId}`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "PATCH" ? { body: JSON.stringify({ status }) } : {}),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Failed to update campaign status:", data.error);
        return;
      }
      setSelectedId(null);
      if (onChanged) {
        await onChanged();
        return;
      }
      router.refresh();
    } catch (error) {
      console.error("Error updating campaign status:", error);
    }
  }, [onChanged, router]);

  if (campaigns.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-600 mb-1">
          Create your first review campaign
        </h3>
        <p className="text-sm text-gray-400 max-w-xs mx-auto">
          Automatically collect reviews from your clients after their trips.
          Boost your online reputation on autopilot.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => {
        const maxFunnel = Math.max(campaign.stats_sent, 1);
        const conversionRate =
          campaign.stats_sent > 0
            ? Math.round(
                (campaign.stats_reviews_generated / campaign.stats_sent) * 100
              )
            : 0;

        const isSelected = selectedId === campaign.id;

        return (
          <div
            key={campaign.id}
            className={`rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? "border-emerald-500/40 bg-white shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {/* Header */}
            <button
              type="button"
              onClick={() =>
                setSelectedId(isSelected ? null : campaign.id)
              }
              className="w-full text-left px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {campaign.name}
                    </h3>
                    <StatusBadge status={campaign.status as CampaignStatus} />
                    <TypeBadge campaignType={campaign.campaign_type} />
                  </div>

                  {/* Funnel metrics row */}
                  <div className="flex gap-4">
                    <FunnelBar
                      label="Sent"
                      value={campaign.stats_sent}
                      max={maxFunnel}
                      color="bg-blue-500"
                    />
                    <FunnelBar
                      label="Opened"
                      value={campaign.stats_opened}
                      max={maxFunnel}
                      color="bg-purple-500"
                    />
                    <FunnelBar
                      label="Completed"
                      value={campaign.stats_completed}
                      max={maxFunnel}
                      color="bg-amber-500"
                    />
                    <FunnelBar
                      label="Reviews"
                      value={campaign.stats_reviews_generated}
                      max={maxFunnel}
                      color="bg-emerald-500"
                    />
                  </div>
                </div>

                {/* Conversion badge */}
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {conversionRate}%
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">
                    conversion
                  </p>
                </div>
              </div>
            </button>

            {/* Expanded actions */}
            {isSelected && (
              <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-2">
                {campaign.status === "active" && (
                  <ActionButton
                    label="Pause"
                    variant="amber"
                    onClick={() => handleStatusChange(campaign.id, "paused")}
                  />
                )}
                {campaign.status === "paused" && (
                  <ActionButton
                    label="Resume"
                    variant="emerald"
                    onClick={() => handleStatusChange(campaign.id, "active")}
                  />
                )}
                {campaign.status !== "archived" && (
                  <ActionButton
                    label="Archive"
                    variant="zinc"
                    onClick={() => handleStatusChange(campaign.id, "archived")}
                  />
                )}
                <div className="flex-1" />
                <span className="text-[10px] text-gray-400">
                  Created{" "}
                  {new Date(campaign.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActionButton({
  label,
  variant,
  onClick,
}: {
  label: string;
  variant: "emerald" | "amber" | "zinc";
  onClick: () => void;
}) {
  const styles = {
    emerald:
      "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10",
    amber: "border-amber-500/30 text-amber-500 hover:bg-amber-500/10",
    zinc: "border-gray-200 text-gray-500 hover:bg-gray-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${styles[variant]}`}
    >
      {label}
    </button>
  );
}
