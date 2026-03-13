"use client";

import { Eye, Download, Loader2, Smartphone, X, Zap, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";
import { renderLayout, renderBg } from "./layout-helpers";
import type { Dimensions } from "./types";

export interface PreviewPanelProps {
    previewTemplate: SocialTemplate | null;
    templateData: TemplateDataForRender;
    dims: Dimensions;
    downloading: string | null;
    hdExporting: string | null;
    phoneMockupId: string | null;
    onClose: () => void;
    onDownload: (templateId: string, templateName: string) => void;
    onHdExport: (templateId: string, preset: SocialTemplate) => void;
    onPhoneMockupToggle: (templateId: string | null) => void;
    onOpenInEditor: ((preset: SocialTemplate) => void) | undefined;
}

export function PreviewPanel({
    previewTemplate,
    templateData,
    dims,
    downloading,
    hdExporting,
    phoneMockupId,
    onClose,
    onDownload,
    onHdExport,
    onPhoneMockupToggle,
    onOpenInEditor,
}: PreviewPanelProps) {
    return (
        <AnimatePresence>
            {previewTemplate && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                >
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Eye className="w-5 h-5 text-indigo-500" />
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        Preview: {previewTemplate.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                        {previewTemplate.layout.replace("Layout", "")} · {previewTemplate.category}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onPhoneMockupToggle(phoneMockupId === previewTemplate.id ? null : previewTemplate.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                                >
                                    <Smartphone className="w-3.5 h-3.5" /> Phone
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Preview content */}
                        <div className="flex gap-5 items-start justify-center">
                            <div
                                className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 ${renderBg(previewTemplate)}`}
                                style={{ width: 540, height: dims.h * (540 / dims.w), flexShrink: 0 }}
                            >
                                <div
                                    className={`origin-top-left overflow-hidden ${renderBg(previewTemplate)} relative`}
                                    style={{ width: dims.w, height: dims.h, transform: `scale(${540 / dims.w})` }}
                                >
                                    {renderLayout(previewTemplate, templateData)}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 justify-center pt-1">
                            <button
                                onClick={() => onDownload(previewTemplate.id, previewTemplate.name)}
                                disabled={downloading === previewTemplate.id}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                {downloading === previewTemplate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Download
                            </button>
                            <button
                                onClick={() => onHdExport(previewTemplate.id, previewTemplate)}
                                disabled={hdExporting === previewTemplate.id}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            >
                                {hdExporting === previewTemplate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                HD Export
                            </button>
                            {onOpenInEditor && (
                                <button
                                    onClick={() => { onOpenInEditor(previewTemplate); onClose(); }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-900 transition-colors"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                    Open in Editor
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
