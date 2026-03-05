"use client";

import { useState, useCallback, useMemo } from "react";
import {
    Download,
    Check,
    Square,
    Loader2,
    FileImage,
    Archive,
    AlertCircle,
} from "lucide-react";
import JSZip from "jszip";
import { templates } from "@/lib/social/template-registry";
import type { SocialTemplate, AspectRatio } from "@/lib/social/types";

/* ---------- Types ---------- */

interface BulkExporterProps {
    templateData: Record<string, unknown>;
    backgrounds: string[];
    selectedBackground: string;
    onComplete: (count: number) => void;
}

type ExportFormat = "png" | "jpeg" | "webp";

interface AspectRatioOption {
    readonly key: AspectRatio;
    readonly label: string;
    readonly ratio: string;
    readonly width: number;
    readonly height: number;
}

interface RenderJob {
    readonly template: SocialTemplate;
    readonly aspectRatio: AspectRatio;
    readonly format: ExportFormat;
}

interface RenderResult {
    readonly job: RenderJob;
    readonly blob: Blob | null;
    readonly error: string | null;
}

/* ---------- Constants ---------- */

const ASPECT_RATIO_OPTIONS: readonly AspectRatioOption[] = [
    { key: "square", label: "Square", ratio: "1:1", width: 1080, height: 1080 },
    { key: "portrait", label: "Portrait", ratio: "4:5", width: 1080, height: 1350 },
    { key: "story", label: "Story", ratio: "9:16", width: 1080, height: 1920 },
] as const;

const FORMAT_OPTIONS: readonly { key: ExportFormat; label: string }[] = [
    { key: "png", label: "PNG" },
    { key: "jpeg", label: "JPEG" },
    { key: "webp", label: "WebP" },
] as const;

const MAX_TEMPLATES = 5;
const MAX_RETRIES = 1;

/* ---------- Helpers ---------- */

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function renderImage(
    templateData: Record<string, unknown>,
    layoutType: string,
    aspectRatio: string,
    backgroundUrl: string,
    format: string,
): Promise<Blob> {
    const resp = await fetch("/api/social/render-poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateData, layoutType, aspectRatio, backgroundUrl, format, quality: 95 }),
    });
    if (!resp.ok) {
        const errorText = await resp.text().catch(() => resp.statusText);
        throw new Error(`Render failed (${resp.status}): ${errorText}`);
    }
    return resp.blob();
}

async function renderWithRetry(
    templateData: Record<string, unknown>,
    layoutType: string,
    aspectRatio: string,
    backgroundUrl: string,
    format: string,
    retries: number = MAX_RETRIES,
): Promise<Blob> {
    try {
        return await renderImage(templateData, layoutType, aspectRatio, backgroundUrl, format);
    } catch (err) {
        if (retries > 0) {
            return renderWithRetry(templateData, layoutType, aspectRatio, backgroundUrl, format, retries - 1);
        }
        throw err;
    }
}

function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/* ---------- Component ---------- */

export function BulkExporter({
    templateData,
    selectedBackground,
    onComplete,
}: BulkExporterProps) {
    // State
    const [selectedRatios, setSelectedRatios] = useState<ReadonlySet<AspectRatio>>(
        new Set<AspectRatio>(["square"]),
    );
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<ReadonlySet<string>>(new Set());
    const [format, setFormat] = useState<ExportFormat>("png");
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [errors, setErrors] = useState<readonly string[]>([]);

    // Filter out carousel templates (not suitable for single-image export)
    const availableTemplates = useMemo(
        () => templates.filter((t) => !t.isCarousel),
        [],
    );

    // Compute total render jobs
    const totalJobs = selectedTemplateIds.size * selectedRatios.size;

    // Toggle aspect ratio
    const toggleRatio = useCallback((ratio: AspectRatio) => {
        setSelectedRatios((prev) => {
            const next = new Set(prev);
            if (next.has(ratio)) {
                // Don't allow deselecting all
                if (next.size > 1) {
                    next.delete(ratio);
                }
            } else {
                next.add(ratio);
            }
            return next;
        });
    }, []);

    // Toggle template selection
    const toggleTemplate = useCallback((id: string) => {
        setSelectedTemplateIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (next.size >= MAX_TEMPLATES) return prev;
                next.add(id);
            }
            return next;
        });
    }, []);

    // Build render jobs
    const buildJobs = useCallback((): readonly RenderJob[] => {
        const jobs: RenderJob[] = [];
        for (const templateId of selectedTemplateIds) {
            const template = availableTemplates.find((t) => t.id === templateId);
            if (!template) continue;
            for (const ratio of selectedRatios) {
                jobs.push({ template, aspectRatio: ratio, format });
            }
        }
        return jobs;
    }, [selectedTemplateIds, selectedRatios, format, availableTemplates]);

    // Generate campaign pack
    const handleGenerate = useCallback(async () => {
        const jobs = buildJobs();
        if (jobs.length === 0) return;

        setGenerating(true);
        setProgress({ current: 0, total: jobs.length });
        setErrors([]);

        const results: RenderResult[] = [];
        const errorMessages: string[] = [];

        // Render sequentially to avoid overwhelming the server
        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            setProgress({ current: i + 1, total: jobs.length });

            try {
                const blob = await renderWithRetry(
                    templateData,
                    job.template.layout,
                    job.aspectRatio,
                    selectedBackground,
                    job.format,
                );
                results.push({ job, blob, error: null });
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                const errorMsg = `${job.template.name} (${job.aspectRatio}): ${message}`;
                errorMessages.push(errorMsg);
                results.push({ job, blob: null, error: message });
            }
        }

        // Bundle successful results into ZIP
        const successfulResults = results.filter((r): r is RenderResult & { blob: Blob } => r.blob !== null);

        if (successfulResults.length === 0) {
            setErrors(errorMessages.length > 0 ? errorMessages : ["All renders failed. Please try again."]);
            setGenerating(false);
            return;
        }

        try {
            const zip = new JSZip();

            for (const result of successfulResults) {
                const filename = `${slugify(result.job.template.name)}-${result.job.aspectRatio}.${result.job.format}`;
                zip.file(filename, result.blob);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const timestamp = new Date().toISOString().slice(0, 10);
            triggerDownload(zipBlob, `campaign-pack-${timestamp}.zip`);
        } catch {
            errorMessages.push("Failed to create ZIP file.");
        }

        setErrors(errorMessages);
        setGenerating(false);
        onComplete(successfulResults.length);
    }, [buildJobs, templateData, selectedBackground, onComplete]);

    const canGenerate = selectedTemplateIds.size > 0 && selectedRatios.size > 0 && !generating;

    return (
        <div className="space-y-6">
            {/* Aspect Ratio Selection */}
            <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Aspect Ratios
                </p>
                <div className="flex flex-wrap gap-2">
                    {ASPECT_RATIO_OPTIONS.map(({ key, label, ratio, width, height }) => (
                        <button
                            key={key}
                            onClick={() => toggleRatio(key)}
                            disabled={generating}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                selectedRatios.has(key)
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                            } disabled:opacity-50`}
                        >
                            {selectedRatios.has(key) ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            {label} ({ratio})
                            <span className="text-xs opacity-70">{width}x{height}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Format
                </p>
                <div className="flex gap-2">
                    {FORMAT_OPTIONS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFormat(key)}
                            disabled={generating}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                format === key
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                            } disabled:opacity-50`}
                        >
                            <FileImage className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Templates ({selectedTemplateIds.size}/{MAX_TEMPLATES})
                    </p>
                    {selectedTemplateIds.size > 0 && (
                        <button
                            onClick={() => setSelectedTemplateIds(new Set())}
                            disabled={generating}
                            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium disabled:opacity-50"
                        >
                            Clear all
                        </button>
                    )}
                </div>
                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                    {availableTemplates.map((t) => {
                        const isSelected = selectedTemplateIds.has(t.id);
                        const isDisabled = !isSelected && selectedTemplateIds.size >= MAX_TEMPLATES;
                        return (
                            <button
                                key={t.id}
                                onClick={() => toggleTemplate(t.id)}
                                disabled={generating || isDisabled}
                                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors text-left ${
                                    isSelected
                                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                                {isSelected ? (
                                    <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                                ) : (
                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span className="font-medium truncate">{t.name}</span>
                                <span className="ml-auto text-xs text-slate-400 shrink-0">
                                    {t.category} / {t.layout.replace("Layout", "")}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Summary */}
            {totalJobs > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm text-indigo-700 dark:text-indigo-300">
                    <Archive className="w-4 h-4 shrink-0" />
                    <span>
                        <strong>{totalJobs}</strong> image{totalJobs !== 1 ? "s" : ""} will be rendered
                        ({selectedTemplateIds.size} template{selectedTemplateIds.size !== 1 ? "s" : ""} x{" "}
                        {selectedRatios.size} ratio{selectedRatios.size !== 1 ? "s" : ""})
                    </span>
                </div>
            )}

            {/* Progress */}
            {generating && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                            Rendering {progress.current}/{progress.total} images...
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
                <div className="space-y-1.5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
                        <AlertCircle className="w-4 h-4" />
                        Some images failed to render
                    </div>
                    {errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-600 dark:text-red-400 pl-6">
                            {err}
                        </p>
                    ))}
                </div>
            )}

            {/* Generate Button */}
            <button
                disabled={!canGenerate}
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {generating ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Campaign Pack...
                    </>
                ) : (
                    <>
                        <Download className="w-5 h-5" />
                        Generate Campaign Pack
                        {totalJobs > 0 && ` (${totalJobs} images)`}
                    </>
                )}
            </button>
        </div>
    );
}
