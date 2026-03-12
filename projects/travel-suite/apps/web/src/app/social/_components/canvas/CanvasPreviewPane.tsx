"use client";

import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { renderBg, renderLayout } from "./layout-preview";
import type { CanvasModeProps } from "./types";

interface CanvasPreviewPaneProps
  extends Pick<
    CanvasModeProps,
    | "aiPosterUrl"
    | "backgrounds"
    | "onBackgroundChange"
    | "onClearAiPoster"
    | "template"
    | "templateData"
  > {
  activeBackgroundIndex: number;
  onGoToNextBackground: () => void;
  onGoToPrevBackground: () => void;
  onSetActiveBackgroundIndex: (index: number) => void;
  showPhoneMockup: boolean;
}

const PREVIEW_WIDTH = 600;

export function CanvasPreviewPane({
  activeBackgroundIndex,
  aiPosterUrl,
  backgrounds,
  onBackgroundChange,
  onClearAiPoster,
  onGoToNextBackground,
  onGoToPrevBackground,
  onSetActiveBackgroundIndex,
  showPhoneMockup,
  template,
  templateData,
}: CanvasPreviewPaneProps) {
  const canvasScale = PREVIEW_WIDTH / 1080;

  return (
    <div className="lg:col-span-3 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-8 overflow-auto">
      {showPhoneMockup ? (
        <div className="relative w-[220px] bg-black rounded-[36px] p-[6px] shadow-2xl border-2 border-slate-700 mx-auto">
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-10 border border-slate-600" />
          <div className="rounded-[30px] overflow-hidden bg-white">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-100">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 shrink-0" />
              <span className="text-[9px] font-bold text-slate-700 truncate flex-1">
                {templateData?.companyName || "your_agency"}
              </span>
            </div>
            <div className="overflow-hidden" style={{ width: 208, height: 208 }}>
              <div
                className={`origin-top-left ${renderBg(template)} overflow-hidden`}
                style={{
                  width: 1080,
                  height: 1080,
                  transform: `scale(${208 / 1080})`,
                }}
              >
                {renderLayout(template, templateData)}
              </div>
            </div>
            <div className="px-3 py-2 bg-white space-y-0.5">
              <div className="flex gap-3 text-sm">
                <span>&#9829;</span>
                <span>&#128172;</span>
                <span>&#9992;</span>
              </div>
              <p className="text-[9px] font-bold text-slate-700">142 likes</p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800"
          style={{ width: PREVIEW_WIDTH, height: PREVIEW_WIDTH }}
        >
          <div
            className={`origin-top-left ${renderBg(template)} overflow-hidden flex flex-col`}
            style={{
              width: 1080,
              height: 1080,
              transform: `scale(${canvasScale})`,
            }}
          >
            {renderLayout(template, templateData)}
          </div>

          {aiPosterUrl && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-lg shadow-lg pointer-events-none">
              <Sparkles className="w-3 h-3" />
              AI Background
            </div>
          )}

          {aiPosterUrl && onClearAiPoster && (
            <button
              onClick={onClearAiPoster}
              className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-bold rounded-lg shadow-lg border border-slate-200 hover:bg-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset bg
            </button>
          )}
        </div>
      )}

      {backgrounds.length > 1 && (
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onGoToPrevBackground}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="flex items-center gap-2">
            {backgrounds.map((url, index) => (
              <button
                key={url}
                onClick={() => {
                  onSetActiveBackgroundIndex(index);
                  onBackgroundChange(url);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === activeBackgroundIndex
                    ? "bg-indigo-500 scale-125"
                    : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onGoToNextBackground}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      )}
    </div>
  );
}
