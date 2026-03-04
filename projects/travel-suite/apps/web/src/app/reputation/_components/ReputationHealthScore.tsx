"use client";

import { motion } from "framer-motion";
import {
  getHealthScoreColor,
  getHealthScoreLabel,
} from "@/lib/reputation/score-calculator";

interface ReputationHealthScoreProps {
  score: number;
  size?: number;
}

export function ReputationHealthScore({
  score,
  size = 180,
}: ReputationHealthScoreProps) {
  const color = getHealthScoreColor(score);
  const label = getHealthScoreLabel(score);

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (progress / 100) * circumference;

  const center = size / 2;

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-slate-400 mt-1">out of 100</span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <span
          className="text-sm font-semibold"
          style={{ color }}
        >
          {label}
        </span>
        <p className="text-xs text-slate-500 mt-0.5">Health Score</p>
      </div>
    </div>
  );
}
