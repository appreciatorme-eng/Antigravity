"use client";
/* eslint-disable @next/next/no-img-element */

import {
  Check,
  Download,
  Loader2,
  RotateCcw,
  Send,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import type { CanvasModeProps } from "./types";

interface CanvasEditorPanelProps
  extends Pick<
    CanvasModeProps,
    | "aiPosterUrl"
    | "backgrounds"
    | "connections"
    | "onBackgroundChange"
    | "onClearAiPoster"
    | "onTemplateDataChange"
    | "templateData"
  > {
  activeBackgroundIndex: number;
  downloading: boolean;
  hdExporting: boolean;
  onDownload: () => void;
  onHdExport: () => void;
  onSetActiveBackgroundIndex: (index: number) => void;
  onTogglePhoneMockup: () => void;
  showPhoneMockup: boolean;
}

export function CanvasEditorPanel({
  activeBackgroundIndex,
  aiPosterUrl,
  backgrounds,
  connections,
  downloading,
  hdExporting,
  onBackgroundChange,
  onClearAiPoster,
  onDownload,
  onHdExport,
  onSetActiveBackgroundIndex,
  onTemplateDataChange,
  onTogglePhoneMockup,
  showPhoneMockup,
  templateData,
}: CanvasEditorPanelProps) {
  const labelCls =
    "text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1";
  const inputCls =
    "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-indigo-500 outline-none";

  return (
    <div className="lg:col-span-2 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-6 space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-xs">
            &#9998;
          </span>
          Content
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Destination</label>
            <input
              type="text"
              value={templateData.destination || ""}
              onChange={(event) =>
                onTemplateDataChange((prev) => ({
                  ...prev,
                  destination: event.target.value,
                }))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Price</label>
            <input
              type="text"
              value={templateData.price || ""}
              onChange={(event) =>
                onTemplateDataChange((prev) => ({
                  ...prev,
                  price: event.target.value,
                }))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Offer</label>
            <input
              type="text"
              value={templateData.offer || ""}
              onChange={(event) =>
                onTemplateDataChange((prev) => ({
                  ...prev,
                  offer: event.target.value,
                }))
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Season</label>
            <input
              type="text"
              value={templateData.season || ""}
              onChange={(event) =>
                onTemplateDataChange((prev) => ({
                  ...prev,
                  season: event.target.value,
                }))
              }
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center text-xs">
            &#128444;
          </span>
          Background
        </h3>

        {aiPosterUrl && (
          <div className="mb-3 flex items-center gap-3 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <img
              src={aiPosterUrl}
              alt="AI background"
              className="w-10 h-10 rounded-lg object-cover shrink-0 ring-1 ring-purple-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                <Sparkles className="w-3 h-3" />
                AI-generated background
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Overlaid on this template
              </p>
            </div>
            {onClearAiPoster && (
              <button
                onClick={onClearAiPoster}
                className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Reset to original background"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {backgrounds.map((url, index) => (
            <button
              key={url}
              onClick={() => {
                onSetActiveBackgroundIndex(index);
                onBackgroundChange(url);
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 transition-all ${
                index === activeBackgroundIndex
                  ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950"
                  : "ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-slate-400"
              }`}
            >
              <img
                src={url}
                alt={`Background ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-xs">
            &#128228;
          </span>
          Export
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download
          </button>
          <button
            onClick={onHdExport}
            disabled={hdExporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50"
          >
            {hdExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            HD Export
          </button>
          <button
            onClick={onTogglePhoneMockup}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-colors ${
              showPhoneMockup
                ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Phone Preview
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("canvas-mode:publish"));
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            Queue Review
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1">
          {connections.instagram ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <X className="w-3 h-3 text-slate-300" />
          )}
          Instagram
        </span>
        <span className="flex items-center gap-1">
          {connections.facebook ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <X className="w-3 h-3 text-slate-300" />
          )}
          Facebook
        </span>
      </div>
    </div>
  );
}
