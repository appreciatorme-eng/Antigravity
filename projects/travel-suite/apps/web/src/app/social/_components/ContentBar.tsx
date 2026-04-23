"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pencil,
  ChevronDown,
  ChevronUp,
  Upload,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  BookmarkPlus,
  Bookmark,
  Trash2,
  X,
} from "lucide-react";
import {
  generateBrandPalette,
  type BrandPalette,
} from "@/lib/social/color-utils";

/* ---------- Types ---------- */

interface TemplateData {
  companyName: string;
  logoUrl?: string;
  logoWidth: number;
  destination: string;
  price: string;
  offer: string;
  season: string;
  contactNumber: string;
  email: string;
  website: string;
  heroImage?: string;
  services: string[];
  bulletPoints: string[];
  reviewText: string;
  reviewerName: string;
  reviewerTrip: string;
  brandPalette?: BrandPalette;
}

interface ContentPreset {
  id: string;
  name: string;
  destination: string;
  price: string;
  offer: string;
  season: string;
  services: string[];
}

const PRESETS_STORAGE_KEY = "social-studio-presets";
const MAX_PRESETS = 20;

interface ContentBarProps {
  templateData: TemplateData;
  setTemplateData: React.Dispatch<React.SetStateAction<TemplateData>>;
  orgPrimaryColor?: string | null;
  onImageUpload: (e: ChangeEvent<HTMLInputElement>, type: string) => void;
}

/* ---------- Style constants ---------- */

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-400/20 outline-none";

const CHIP_CLASS =
  "px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400/20";

const LABEL_CLASS =
  "text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide";

/* ---------- Helpers ---------- */

const CHIP_FIELDS: { key: keyof TemplateData; placeholder: string }[] = [
  { key: "destination", placeholder: "Destination" },
  { key: "price", placeholder: "Price" },
  { key: "offer", placeholder: "Offer" },
  { key: "season", placeholder: "Season" },
];

const PALETTE_SWATCHES: { field: keyof BrandPalette; label: string }[] = [
  { field: "primary", label: "Primary" },
  { field: "primaryLight", label: "Light" },
  { field: "primaryDark", label: "Dark" },
  { field: "secondary", label: "Accent" },
  { field: "analogous1", label: "Warm" },
  { field: "analogous2", label: "Cool" },
];

/* ---------- Component ---------- */

export function ContentBar({
  templateData,
  setTemplateData,
  orgPrimaryColor,
  onImageUpload,
}: ContentBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [brandColorEnabled, setBrandColorEnabled] = useState(
    Boolean(templateData.brandPalette),
  );

  // Preset state
  const [presets, setPresets] = useState<ContentPreset[]>([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const presetsDropdownRef = useRef<HTMLDivElement>(null);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPresets(parsed);
      }
    } catch {
      /* ignore corrupt data */
    }
  }, []);

  // Persist presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        presetsDropdownRef.current &&
        !presetsDropdownRef.current.contains(e.target as Node)
      ) {
        setShowPresetsDropdown(false);
      }
    };
    if (showPresetsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPresetsDropdown]);

  const savePreset = () => {
    const trimmed = presetName.trim();
    if (!trimmed) return;
    const newPreset: ContentPreset = {
      id: Date.now().toString(36),
      name: trimmed,
      destination: templateData.destination,
      price: templateData.price,
      offer: templateData.offer,
      season: templateData.season,
      services: [...templateData.services],
    };
    setPresets((prev) => [newPreset, ...prev].slice(0, MAX_PRESETS));
    setPresetName("");
    setShowSaveInput(false);
  };

  const loadPreset = (preset: ContentPreset) => {
    setTemplateData((prev) => ({
      ...prev,
      destination: preset.destination,
      price: preset.price,
      offer: preset.offer,
      season: preset.season,
      services: [...preset.services],
    }));
    setShowPresetsDropdown(false);
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const palette = orgPrimaryColor
    ? generateBrandPalette(orgPrimaryColor)
    : null;

  const hasLogo = Boolean(templateData.logoUrl);
  const hasBrandColors = Boolean(templateData.brandPalette);

  /* Immutable field updater */
  const updateField = (field: keyof TemplateData, value: string | number) => {
    setTemplateData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleBrandColor = () => {
    if (!palette) return;
    const next = !brandColorEnabled;
    setBrandColorEnabled(next);
    if (next) {
      setTemplateData((prev) => ({ ...prev, brandPalette: palette }));
    } else {
      setTemplateData((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { brandPalette: _removed, ...rest } = prev;
        return rest as TemplateData;
      });
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* --- Collapsed bar --- */}
      <div className="flex items-center gap-3 px-5 py-3 flex-wrap">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <Pencil className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Content
          </span>
        </div>

        {/* Inline editable chips */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {CHIP_FIELDS.map(({ key, placeholder }) => (
            <div key={key} className={CHIP_CLASS}>
              <input
                type="text"
                value={templateData[key] as string}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder={placeholder}
                className="bg-transparent outline-none text-slate-900 dark:text-white w-[8ch] min-w-0"
                style={{
                  width: `${Math.max(8, String(templateData[key]).length + 1)}ch`,
                }}
              />
            </div>
          ))}

          {/* Status indicators */}
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
              hasLogo
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}
          >
            Logo {hasLogo ? "\u2713" : "\u2717"}
          </span>
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
              hasBrandColors
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}
          >
            Brand Colors {hasBrandColors ? "\u2713" : "\u2717"}
          </span>
        </div>

        {/* Preset actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Save Preset */}
          {showSaveInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") savePreset();
                  if (e.key === "Escape") {
                    setShowSaveInput(false);
                    setPresetName("");
                  }
                }}
                placeholder="Preset name..."
                autoFocus
                className="px-2.5 py-1.5 text-xs rounded-lg border border-indigo-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-28"
              />
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="px-2.5 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveInput(false);
                  setPresetName("");
                }}
                aria-label="Cancel preset save"
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveInput(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Save current content as preset"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save
            </button>
          )}

          {/* Load Preset dropdown */}
          <div className="relative" ref={presetsDropdownRef}>
            <button
              onClick={() => setShowPresetsDropdown((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                showPresetsDropdown
                  ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Load a saved preset"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Presets
              {presets.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">
                  {presets.length}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
              {showPresetsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {presets.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">
                      No presets saved yet. Click &quot;Save&quot; to create one.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {presets.map((preset) => (
                        <div
                          key={preset.id}
                          className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                        >
                          <button
                            onClick={() => loadPreset(preset)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                              {preset.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {preset.destination} &middot; {preset.price}
                            </p>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePreset(preset.id);
                            }}
                            aria-label="Delete preset"
                            className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="Delete preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors shrink-0"
        >
          {expanded ? (
            <>
              Hide <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Edit All Fields <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* --- Expanded panel --- */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
              {/* Row 1: Company Name */}
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>Company Name</label>
                <input
                  type="text"
                  value={templateData.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              {/* Row 2: Contact info (3 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Contact Phone</label>
                  <input
                    type="text"
                    value={templateData.contactNumber}
                    onChange={(e) =>
                      updateField("contactNumber", e.target.value)
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Email</label>
                  <input
                    type="email"
                    value={templateData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Website</label>
                  <input
                    type="text"
                    value={templateData.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {/* Row 3: Logo + Brand Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logo upload + scale */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <label className={LABEL_CLASS}>Agency Logo (PNG)</label>
                  <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                    <input
                      type="file"
                      accept="image/png"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) => onImageUpload(e, "logo")}
                    />
                    <div className="py-2.5 text-center text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 group-hover:text-indigo-600 transition-colors">
                      <Upload className="w-4 h-4" />
                      {hasLogo ? "Change Logo" : "Upload Logo"}
                    </div>
                  </div>
                  {hasLogo && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between tracking-wide">
                        Scale <span>{templateData.logoWidth}px</span>
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="600"
                        value={templateData.logoWidth}
                        onChange={(e) =>
                          updateField("logoWidth", Number(e.target.value))
                        }
                        className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Brand color toggle + swatches */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_CLASS}>
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        Brand Theme
                      </span>
                    </label>
                    {palette && (
                      <button
                        onClick={toggleBrandColor}
                        aria-label={brandColorEnabled ? "Disable brand colors" : "Enable brand colors"}
                        className="transition-transform hover:scale-105"
                      >
                        {brandColorEnabled ? (
                          <ToggleRight className="w-7 h-7 text-indigo-500" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>
                  {palette ? (
                    <div className="flex gap-2 flex-wrap">
                      {PALETTE_SWATCHES.map(({ field, label }) => (
                        <div
                          key={label}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <div
                            className="w-6 h-6 rounded-lg shadow-sm border border-white/20 ring-1 ring-black/10"
                            style={{ backgroundColor: palette[field] }}
                            title={`${label}: ${palette[field]}`}
                          />
                          <span className="text-[8px] text-slate-400 font-medium">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      No org primary color configured.
                    </p>
                  )}
                  {brandColorEnabled && (
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block" />
                      Brand colors applied
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
