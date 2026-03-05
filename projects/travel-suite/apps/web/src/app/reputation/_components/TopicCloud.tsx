"use client";

import { AI_REVIEW_TOPICS } from "@/lib/reputation/constants";

interface TopicEntry {
  topic: string;
  count: number;
  sentiment?: "positive" | "neutral" | "negative";
}

interface TopicCloudProps {
  topics: TopicEntry[];
}

const SENTIMENT_PILL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  positive: {
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.25)",
    text: "#16a34a",
  },
  neutral: {
    bg: "rgba(234, 179, 8, 0.12)",
    border: "rgba(234, 179, 8, 0.25)",
    text: "#ca8a04",
  },
  negative: {
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.25)",
    text: "#dc2626",
  },
  default: {
    bg: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.25)",
    text: "#7c3aed",
  },
};

const topicMetaMap = new Map<string, { label: string; emoji: string }>(
  AI_REVIEW_TOPICS.map((t) => [t.id as string, { label: t.label, emoji: t.emoji }])
);

function getTopicSize(count: number, maxCount: number): string {
  if (maxCount <= 0) return "text-xs";
  const ratio = count / maxCount;
  if (ratio > 0.75) return "text-sm";
  if (ratio > 0.4) return "text-xs";
  return "text-[11px]";
}

export function TopicCloud({ topics }: TopicCloudProps) {
  if (topics.length === 0) {
    return (
      <div className="w-full rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400 py-8">
        No topic data available yet.
      </div>
    );
  }

  const maxCount = Math.max(...topics.map((t) => t.count), 1);

  // Sort by count descending
  const sorted = [...topics].sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-wrap gap-2">
      {sorted.map((entry) => {
        const meta = topicMetaMap.get(entry.topic);
        const label = meta?.label ?? entry.topic;
        const emoji = meta?.emoji ?? "";
        const sentimentKey = entry.sentiment ?? "default";
        const colors =
          SENTIMENT_PILL_COLORS[sentimentKey] ?? SENTIMENT_PILL_COLORS.default;
        const sizeClass = getTopicSize(entry.count, maxCount);

        return (
          <span
            key={entry.topic}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-transform hover:scale-105 ${sizeClass}`}
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
          >
            {emoji && <span className="text-base leading-none">{emoji}</span>}
            <span>{label}</span>
            <span
              className="text-[10px] opacity-70 ml-0.5 tabular-nums"
              style={{ color: colors.text }}
            >
              {entry.count}
            </span>
          </span>
        );
      })}
    </div>
  );
}
