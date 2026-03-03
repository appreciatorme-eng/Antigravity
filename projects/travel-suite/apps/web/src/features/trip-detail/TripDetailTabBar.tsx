"use client";

import {
  LayoutDashboard,
  Map,
  IndianRupee,
  MessageCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripDetailTab } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TripDetailTabBarProps {
  activeTab: TripDetailTab;
  onTabChange: (tab: TripDetailTab) => void;
}

// ---------------------------------------------------------------------------
// Tab configuration
// ---------------------------------------------------------------------------

interface TabConfig {
  key: TripDetailTab;
  label: string;
  icon: LucideIcon;
}

const TABS: readonly TabConfig[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "itinerary", label: "Itinerary", icon: Map },
  { key: "financials", label: "Financials", icon: IndianRupee },
  { key: "comms", label: "Client & Comms", icon: MessageCircle },
  { key: "group", label: "Group", icon: Users },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TripDetailTabBar({ activeTab, onTabChange }: TripDetailTabBarProps) {
  return (
    <nav className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-900 rounded-2xl overflow-x-auto w-full max-w-fit border border-gray-200 dark:border-slate-800">
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={cn(
              "px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap inline-flex items-center gap-2",
              isActive
                ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                : "text-text-muted hover:text-secondary dark:hover:text-white",
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
