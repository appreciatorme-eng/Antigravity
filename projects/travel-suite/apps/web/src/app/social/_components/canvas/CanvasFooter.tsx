"use client";

import { ArrowLeft, Save } from "lucide-react";

interface CanvasFooterProps {
  onClose: () => void;
  onSaveDraft: () => void;
}

export function CanvasFooter({
  onClose,
  onSaveDraft,
}: CanvasFooterProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Gallery
      </button>
      <button
        onClick={onSaveDraft}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
      >
        <Save className="w-4 h-4" />
        Save Draft
      </button>
    </div>
  );
}
