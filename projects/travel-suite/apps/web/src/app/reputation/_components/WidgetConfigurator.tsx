"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Layout,
  Star,
  Copy,
  Check,
  Settings2,
  Eye,
  Code,
} from "lucide-react";
import type {
  ReputationWidget,
  WidgetConfig,
  WidgetType,
  WidgetTheme,
} from "@/lib/reputation/types";
import WidgetPreview from "./WidgetPreview";

interface WidgetConfiguratorProps {
  widget?: ReputationWidget;
  onSave: (config: WidgetConfig) => void;
}

const WIDGET_TYPES: { value: WidgetType; label: string; description: string }[] = [
  { value: "carousel", label: "Carousel", description: "Horizontal scrolling cards" },
  { value: "grid", label: "Grid", description: "2-3 column review grid" },
  { value: "badge", label: "Badge", description: "Compact floating badge" },
  { value: "floating", label: "Floating", description: "Corner floating widget" },
  { value: "wall", label: "Wall", description: "Masonry review layout" },
];

const THEME_OPTIONS: { value: WidgetTheme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
];

const PLATFORM_FILTERS = [
  { id: "google", label: "Google" },
  { id: "tripadvisor", label: "TripAdvisor" },
  { id: "facebook", label: "Facebook" },
  { id: "makemytrip", label: "MakeMyTrip" },
  { id: "internal", label: "Direct Feedback" },
];

export default function WidgetConfigurator({
  widget,
  onSave,
}: WidgetConfiguratorProps) {
  const [config, setConfig] = useState<WidgetConfig>({
    name: widget?.name ?? "",
    widget_type: widget?.widget_type ?? "carousel",
    theme: widget?.theme ?? "dark",
    accent_color: widget?.accent_color ?? "#00d084",
    min_rating_to_show: widget?.min_rating_to_show ?? 4,
    max_reviews: widget?.max_reviews ?? 10,
    platforms_filter: widget?.platforms_filter ?? [],
    destinations_filter: widget?.destinations_filter ?? [],
    show_branding: widget?.show_branding !== false,
    custom_header: widget?.custom_header ?? "",
    custom_footer: widget?.custom_footer ?? "",
  });

  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateConfig = useCallback(
    <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const togglePlatformFilter = useCallback((platformId: string) => {
    setConfig((prev) => {
      const current = prev.platforms_filter ?? [];
      const next = current.includes(platformId)
        ? current.filter((p) => p !== platformId)
        : [...current, platformId];
      return { ...prev, platforms_filter: next };
    });
  }, []);

  const handleSave = async () => {
    if (!config.name.trim()) return;
    setIsSaving(true);
    try {
      onSave(config);
    } finally {
      setIsSaving(false);
    }
  };

  const embedToken = widget?.embed_token ?? "YOUR_TOKEN";
  const embedCode = `<div id="rep-widget" data-token="${embedToken}"></div>\n<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget/reputation.js"></script>`;

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
    }
  };

  // Build preview config
  const previewConfig: Partial<ReputationWidget> = {
    widget_type: config.widget_type,
    theme: config.theme,
    accent_color: config.accent_color,
    border_radius: 12,
    show_branding: config.show_branding,
    custom_header: config.custom_header || null,
    custom_footer: config.custom_footer || null,
    min_rating_to_show: config.min_rating_to_show ?? 4,
    max_reviews: config.max_reviews ?? 10,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Configuration */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-white">Configuration</h3>
        </div>

        {/* Widget name */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Widget Name</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateConfig("name", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
            placeholder="e.g. Homepage Reviews"
          />
        </div>

        {/* Widget type */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Layout className="w-3.5 h-3.5" />
            Widget Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WIDGET_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => updateConfig("widget_type", type.value)}
                className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                  config.widget_type === type.value
                    ? "border-primary/50 bg-primary/10 text-white"
                    : "border-white/10 bg-slate-800/30 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                <p className="text-xs font-medium">{type.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {type.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Palette className="w-3.5 h-3.5" />
            Theme
          </label>
          <div className="flex gap-2">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.value}
                onClick={() => updateConfig("theme", theme.value)}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  config.theme === theme.value
                    ? "border-primary/50 bg-primary/10 text-white"
                    : "border-white/10 bg-slate-800/30 text-slate-400 hover:text-white"
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Accent Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.accent_color ?? "#00d084"}
              onChange={(e) => updateConfig("accent_color", e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={config.accent_color ?? "#00d084"}
              onChange={(e) => updateConfig("accent_color", e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Min rating slider */}
        <div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Star className="w-3.5 h-3.5" />
            Minimum Rating to Show: {config.min_rating_to_show}
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={config.min_rating_to_show ?? 4}
            onChange={(e) =>
              updateConfig("min_rating_to_show", parseInt(e.target.value, 10))
            }
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>1 star</span>
            <span>5 stars</span>
          </div>
        </div>

        {/* Max reviews */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Max Reviews</label>
          <input
            type="number"
            min={1}
            max={50}
            value={config.max_reviews ?? 10}
            onChange={(e) =>
              updateConfig("max_reviews", parseInt(e.target.value, 10) || 10)
            }
            className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Platform filters */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            Platform Filter (leave empty for all)
          </label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_FILTERS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => togglePlatformFilter(platform.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  (config.platforms_filter ?? []).includes(platform.id)
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-white/10 bg-slate-800/30 text-slate-400 hover:text-white"
                }`}
              >
                {platform.label}
              </button>
            ))}
          </div>
        </div>

        {/* Show branding toggle */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">Show Branding</label>
          <button
            onClick={() => updateConfig("show_branding", !config.show_branding)}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              config.show_branding ? "bg-primary" : "bg-slate-700"
            }`}
          >
            <motion.div
              animate={{ x: config.show_branding ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>

        {/* Custom header */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Custom Header Text
          </label>
          <input
            type="text"
            value={config.custom_header ?? ""}
            onChange={(e) => updateConfig("custom_header", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
            placeholder="e.g. What Our Travelers Say"
          />
        </div>

        {/* Custom footer */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">
            Custom Footer Text
          </label>
          <input
            type="text"
            value={config.custom_footer ?? ""}
            onChange={(e) => updateConfig("custom_footer", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
            placeholder="e.g. Rated 4.8/5 across platforms"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!config.name.trim() || isSaving}
          className="w-full px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Saving..." : widget ? "Update Widget" : "Create Widget"}
        </button>
      </div>

      {/* Right: Preview + Embed Code */}
      <div className="space-y-5">
        {/* Preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Live Preview</h3>
          </div>
          <WidgetPreview config={previewConfig} />
        </div>

        {/* Embed code */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Code className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Embed Code</h3>
          </div>
          <div className="relative rounded-xl bg-slate-900 border border-white/10 p-4">
            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
              {embedCode}
            </pre>
            <button
              onClick={handleCopyEmbed}
              className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Paste this code into your website where you want the review widget
            to appear.
          </p>
        </div>
      </div>
    </div>
  );
}
