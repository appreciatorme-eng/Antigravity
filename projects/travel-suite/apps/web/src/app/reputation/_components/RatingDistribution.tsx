"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface RatingDistributionProps {
  distribution: Record<number, number>;
}

const RATING_COLORS: Record<number, string> = {
  5: "#22c55e",
  4: "#84cc16",
  3: "#eab308",
  2: "#f97316",
  1: "#ef4444",
};

export default function RatingDistribution({
  distribution,
}: RatingDistributionProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const ratings = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-3">
      {ratings.map((rating) => {
        const count = distribution[rating] ?? 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const color = RATING_COLORS[rating];

        return (
          <div key={rating} className="flex items-center gap-3">
            {/* Star label */}
            <div className="flex items-center gap-1 w-12 shrink-0">
              <span className="text-sm font-medium text-gray-900">{rating}</span>
              <Star className="w-3.5 h-3.5" style={{ color }} fill={color} />
            </div>

            {/* Bar container */}
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: (5 - rating) * 0.08 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color, minWidth: count > 0 ? "4px" : "0px" }}
              />
            </div>

            {/* Count + percentage */}
            <div className="w-20 shrink-0 text-right">
              <span className="text-xs font-medium text-gray-900">{count}</span>
              <span className="text-xs text-gray-500 ml-1">
                ({percentage.toFixed(0)}%)
              </span>
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-500">Total reviews</span>
        <span className="text-sm font-semibold text-gray-900">{total}</span>
      </div>
    </div>
  );
}
