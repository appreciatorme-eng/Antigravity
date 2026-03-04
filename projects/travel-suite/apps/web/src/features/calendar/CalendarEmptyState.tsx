"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";

interface CalendarEmptyStateProps {
  message?: string;
}

export function CalendarEmptyState({
  message = "No events this month",
}: CalendarEmptyStateProps) {
  return (
    <GlassCard padding="xl" className="flex flex-col items-center justify-center py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <CalendarDays className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-lg font-serif text-slate-800 mb-1">{message}</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-xs">
          Your calendar is clear. Create a new trip to get started.
        </p>

        <Link href="/trips">
          <GlassButton variant="primary" size="md">
            Create a Trip
          </GlassButton>
        </Link>
      </motion.div>
    </GlassCard>
  );
}
