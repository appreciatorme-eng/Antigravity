"use client";

import { motion } from "framer-motion";
import { Star, MessageSquare, Clock, TrendingUp } from "lucide-react";

interface ReputationKPIRowProps {
  overallRating: number;
  totalReviews: number;
  responseRate: number;
  npsScore: number | null;
}

interface KPICardProps {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  subtitle?: string;
  index: number;
}

function KPICard({ icon: Icon, iconColor, label, value, subtitle, index }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
        </div>
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <div>
        <span className="text-2xl font-bold text-white">{value}</span>
        {subtitle && (
          <span className="text-xs text-slate-500 ml-2">{subtitle}</span>
        )}
      </div>
    </motion.div>
  );
}

export function ReputationKPIRow({
  overallRating,
  totalReviews,
  responseRate,
  npsScore,
}: ReputationKPIRowProps) {
  const cards: Omit<KPICardProps, "index">[] = [
    {
      icon: Star,
      iconColor: "#eab308",
      label: "Average Rating",
      value: overallRating > 0 ? overallRating.toFixed(1) : "--",
      subtitle: "out of 5.0",
    },
    {
      icon: MessageSquare,
      iconColor: "#3b82f6",
      label: "Total Reviews",
      value: totalReviews.toLocaleString(),
    },
    {
      icon: Clock,
      iconColor: "#22c55e",
      label: "Response Rate",
      value: `${responseRate}%`,
      subtitle: "of reviews",
    },
    {
      icon: TrendingUp,
      iconColor: "#8b5cf6",
      label: "NPS Score",
      value: npsScore !== null ? String(npsScore) : "--",
      subtitle: npsScore !== null ? "(-100 to 100)" : "No data yet",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <KPICard key={card.label} {...card} index={i} />
      ))}
    </div>
  );
}
