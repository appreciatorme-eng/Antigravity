"use client";

import { useState, useCallback, useMemo } from "react";
import { toPng } from "html-to-image";
import { templates, getTemplatesByCategory, searchTemplates } from "@/lib/social/template-registry";
import { SocialTemplate, type TemplateDataForRender } from "@/lib/social/types";
import { getUpcomingFestivals } from "@/lib/social/indian-calendar";
import { toast } from "sonner";
import { PublishKitDrawer } from "./PublishKitDrawer";
import {
    TemplateSearchBar,
    TemplateCategoryFilter,
    PreviewPanel,
    TemplateGrid,
    FestivalBanner,
    TemplateStrip,
    RATIO_DIMS,
    toTemplateTier,
    FAVORITES_KEY,
    RECENT_KEY,
    MAX_RECENT,
} from "./template-gallery";
import type { AspectRatio } from "./template-gallery";

interface Props {
    templateData: TemplateDataForRender;
    connections?: { instagram: boolean; facebook: boolean };
    userTier?: string | null;
    onTemplateSelect?: (template: SocialTemplate) => void;
}

export const TemplateGallery = ({
    templateData,
    connections = { instagram: false, facebook: false },
    userTier,
    onTemplateSelect,
}: Props) => {
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("square");
    const [drawerTemplate, setDrawerTemplate] = useState<SocialTemplate | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [hdExporting, setHdExporting] = useState<string | null>(null);
    const [phoneMockupId, setPhoneMockupId] = useState<string | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<SocialTemplate | null>(null);

    // ── Favorites state (persisted in localStorage) ──────────────────
    const [favorites, setFavorites] = useState<Set<string>>(() => {
        if (typeof window === "undefined") return new Set<string>();
        try {
            const stored = localStorage.getItem(FAVORITES_KEY);
            return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
        } catch {
            return new Set<string>();
        }
    });

    const toggleFavorite = useCallback((id: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); } catch { /* noop */ }
            return next;
        });
    }, []);

    // ── Recently Used state (persisted in localStorage) ──────────────
    const [recentIds, setRecentIds] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const stored = localStorage.getItem(RECENT_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const addToRecent = useCallback((id: string) => {
        setRecentIds(prev => {
            const deduped = prev.filter(existingId => existingId !== id);
            const next = [id, ...deduped].slice(0, MAX_RECENT);
            try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* noop */ }
            return next;
        });
    }, []);

    const upcomingFestivals = getUpcomingFestivals();
    const dims = RATIO_DIMS[aspectRatio];
    const templateUserTier = useMemo(() => toTemplateTier(userTier), [userTier]);

    // Filtered template list
    const filteredTemplates = useMemo(() => {
        if (searchQuery.trim()) return searchTemplates(searchQuery.trim());
        if (activeCategory === "All") return templates;
        return getTemplatesByCategory(activeCategory);
    }, [searchQuery, activeCategory]);

    // ── Derived: recent & favorite template objects ──────────────────
    const recentTemplates = useMemo(() => {
        return recentIds
            .map(id => templates.find(t => t.id === id))
            .filter((t): t is SocialTemplate => t !== undefined);
    }, [recentIds]);

    const favoriteTemplates = useMemo(() => {
        return templates.filter(t => favorites.has(t.id));
    }, [favorites]);

    const showSpecialSections = activeCategory === "All" && !searchQuery;

    // ── Wrapped onTemplateSelect that also tracks recents ────────────
    const handleTemplateSelect = useCallback((preset: SocialTemplate) => {
        addToRecent(preset.id);
        onTemplateSelect?.(preset);
    }, [addToRecent, onTemplateSelect]);

    // ── Image download (client-side png export) ─────────────────────
    const downloadImage = useCallback(async (elementId: string, filename: string, templateId: string) => {
        try {
            setDownloading(templateId);
            const node = document.getElementById(elementId);
            if (!node) return;
            const dataUrl = await toPng(node, {
                quality: 1,
                pixelRatio: 2,
                width: dims.w,
                height: dims.h,
                style: { transform: "scale(1)", transformOrigin: "top left" },
            });
            const link = document.createElement("a");
            link.download = filename;
            link.href = dataUrl;
            link.click();
            toast.success("Downloaded! Ready for Instagram.");
        } catch {
            toast.error("Error generating image.");
        } finally {
            setDownloading(null);
        }
    }, [dims.w, dims.h]);

    // ── Save draft to backend ───────────────────────────────────────
    const handleSaveDraft = async (templateId: string, caption: string) => {
        const res = await fetch("/api/social/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                template_id: templateId,
                template_data: templateData,
                caption_instagram: caption,
                status: "draft",
                source: "manual",
            }),
        });
        if (!res.ok) throw new Error("Save failed");
    };

    // ── Server-side HD export ───────────────────────────────────────
    const handleHdExport = useCallback(async (templateId: string, preset: SocialTemplate) => {
        setHdExporting(templateId);
        try {
            const res = await fetch("/api/social/render-poster", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateData,
                    layoutType: preset.layout,
                    backgroundUrl: templateData.heroImage,
                    aspectRatio,
                    format: "png",
                    quality: 95,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: "HD export failed" }));
                throw new Error(errData.error || "HD export failed");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = `${preset.name.replace(/\s+/g, "-")}-HD.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("HD poster downloaded!");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "HD export failed";
            toast.error(message);
        } finally {
            setHdExporting(null);
        }
    }, [templateData, aspectRatio]);

    // ── Filter handlers ─────────────────────────────────────────────
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        if (value) setActiveCategory("All");
    }, []);

    const handleCategoryChange = useCallback((cat: string) => {
        setActiveCategory(cat);
        setSearchQuery("");
    }, []);

    const handlePreviewDownload = useCallback((templateId: string, templateName: string) => {
        downloadImage(`export-${templateId}`, `${templateName.replace(/\s+/g, "-")}.png`, templateId);
    }, [downloadImage]);

    const handleFilterFestival = useCallback(() => {
        handleCategoryChange("Festival");
    }, [handleCategoryChange]);

    return (
        <div className="space-y-5 animate-fade-in-up">

            <FestivalBanner
                festivals={upcomingFestivals}
                searchQuery={searchQuery}
                onFilterFestival={handleFilterFestival}
            />

            <TemplateSearchBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
            />

            <TemplateCategoryFilter
                activeCategory={activeCategory}
                searchQuery={searchQuery}
                aspectRatio={aspectRatio}
                templateCount={filteredTemplates.length}
                onCategoryChange={handleCategoryChange}
                onAspectRatioChange={setAspectRatio}
            />

            <PreviewPanel
                previewTemplate={previewTemplate}
                templateData={templateData}
                dims={dims}
                downloading={downloading}
                hdExporting={hdExporting}
                phoneMockupId={phoneMockupId}
                onClose={() => setPreviewTemplate(null)}
                onDownload={handlePreviewDownload}
                onHdExport={handleHdExport}
                onPhoneMockupToggle={setPhoneMockupId}
                onOpenInEditor={onTemplateSelect ? handleTemplateSelect : undefined}
            />

            {showSpecialSections && recentTemplates.length > 0 && (
                <TemplateStrip
                    title="Recently Used"
                    variant="recent"
                    items={recentTemplates}
                    templateData={templateData}
                    dims={dims}
                    onSelect={handleTemplateSelect}
                />
            )}

            {showSpecialSections && favorites.size > 0 && favoriteTemplates.length > 0 && (
                <TemplateStrip
                    title="Favorites"
                    variant="favorite"
                    items={favoriteTemplates}
                    templateData={templateData}
                    dims={dims}
                    onSelect={handleTemplateSelect}
                />
            )}

            <TemplateGrid
                templates={filteredTemplates}
                templateData={templateData}
                templateUserTier={templateUserTier}
                dims={dims}
                favorites={favorites}
                downloading={downloading}
                hdExporting={hdExporting}
                phoneMockupId={phoneMockupId}
                previewTemplateId={previewTemplate?.id ?? null}
                onTemplateSelect={onTemplateSelect ? handleTemplateSelect : undefined}
                onToggleFavorite={toggleFavorite}
                onDownload={downloadImage}
                onHdExport={handleHdExport}
                onPhoneMockupToggle={setPhoneMockupId}
                onPreviewToggle={setPreviewTemplate}
                onDrawerOpen={setDrawerTemplate}
            />

            <PublishKitDrawer
                isOpen={!!drawerTemplate}
                onClose={() => setDrawerTemplate(null)}
                template={drawerTemplate}
                templateData={templateData}
                connections={connections}
                onDownload={() => {
                    if (drawerTemplate) {
                        downloadImage(
                            `export-${drawerTemplate.id}`,
                            `${drawerTemplate.name.replace(/\s+/g, "-")}.png`,
                            drawerTemplate.id
                        );
                    }
                }}
                onSaveDraft={caption => {
                    if (drawerTemplate) return handleSaveDraft(drawerTemplate.id, caption);
                    return Promise.resolve();
                }}
            />
        </div>
    );
};
