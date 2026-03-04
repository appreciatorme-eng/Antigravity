"use client";

import { useState, useEffect, useRef } from "react";
import {
  Zap,
  MessageSquare,
  Layers,
  Image as ImageIcon,
  Star,
  Wand2,
  History,
  BarChart3,
  MapPin,
  Package,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";

/* ---------- Types ---------- */

export type ToolbarAction =
  | "prompter"
  | "captions"
  | "carousel"
  | "library"
  | "reviews"
  | "extractor"
  | "trips"
  | "bulk"
  | "history"
  | "analytics";

interface ToolbarActionsProps {
  onActionSelect: (action: ToolbarAction) => void;
}

/* ---------- Action definitions ---------- */

const PRIMARY_ACTIONS = [
  { id: "prompter" as const, label: "AI Prompter", icon: Zap },
  { id: "captions" as const, label: "AI Captions", icon: MessageSquare },
];

const MORE_ACTIONS = [
  { id: "trips" as const, label: "Import from Trip", icon: MapPin },
  { id: "carousel" as const, label: "Carousel Builder", icon: Layers },
  { id: "library" as const, label: "Media Library", icon: ImageIcon },
  { id: "reviews" as const, label: "Reviews \u2192 Insta", icon: Star },
  { id: "extractor" as const, label: "Magic Analyzer", icon: Wand2 },
  { id: "bulk" as const, label: "Campaign Pack", icon: Package },
  { id: "history" as const, label: "Post History", icon: History },
  { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
];

/* ---------- Style constants ---------- */

const PRIMARY_BTN_CLASS =
  "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:shadow-md transition-all";

const DROPDOWN_ITEM_CLASS =
  "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors";

/* ---------- Component ---------- */

export function ToolbarActions({ onActionSelect }: ToolbarActionsProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMoreAction = (action: ToolbarAction) => {
    setOpen(false);
    onActionSelect(action);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Primary action buttons */}
      {PRIMARY_ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onActionSelect(id)}
          className={PRIMARY_BTN_CLASS}
        >
          <Icon className="w-4 h-4 text-indigo-500" />
          {label}
        </button>
      ))}

      {/* More dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className={PRIMARY_BTN_CLASS}
        >
          <MoreHorizontal className="w-4 h-4 text-indigo-500" />
          More
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50">
            {MORE_ACTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleMoreAction(id)}
                className={DROPDOWN_ITEM_CLASS}
              >
                <Icon className="w-4 h-4 text-indigo-500" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
