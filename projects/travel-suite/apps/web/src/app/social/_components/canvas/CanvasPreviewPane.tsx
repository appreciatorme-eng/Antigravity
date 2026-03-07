"use client";
/* eslint-disable @next/next/no-img-element */

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
      {aiPosterUrl && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-200 dark:border-purple-800">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            AI-Generated Poster — text &amp; design baked into the image
          </span>
          {onClearAiPoster && (
            <button
              onClick={onClearAiPoster}
              className="ml-auto flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-300 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Switch to Template
            </button>
          )}
        </div>
      )}

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
              {aiPosterUrl ? (
                <img
                  src={aiPosterUrl}
                  alt="AI-generated poster"
                  className="w-full h-full object-cover"
                />
              ) : (
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
              )}
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
      ) : aiPosterUrl ? (
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl border border-purple-300 dark:border-purple-700"
          style={{ width: PREVIEW_WIDTH, height: PREVIEW_WIDTH }}
        >
          <img
            src={aiPosterUrl}
            alt="AI-generated poster"
            className="w-full h-full object-contain"
          />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-lg shadow-lg">
            <Sparkles className="w-3 h-3" />
            AI Poster
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
        </div>
      )}

      {!aiPosterUrl && backgrounds.length > 1 && (
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
