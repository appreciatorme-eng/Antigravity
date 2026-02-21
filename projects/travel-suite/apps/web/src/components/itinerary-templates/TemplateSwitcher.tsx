"use client";

import { Check } from 'lucide-react';
import { ItineraryTemplateId } from './types';

interface TemplateSwitcherProps {
  currentTemplate: ItineraryTemplateId;
  onTemplateChange: (templateId: ItineraryTemplateId) => void;
}

/* ─────────────────────────────────────────────
   Inline SVG thumbnail previews – one per template
   Each is a tiny ~100×70 proportional mockup
───────────────────────────────────────────── */

const SafariPreview = () => (
  <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Hero background */}
    <rect width="200" height="55" fill="#0f172a" rx="0" />
    <rect width="200" height="55" fill="url(#safari-hero-grad)" rx="0" />
    <defs>
      <linearGradient id="safari-hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d97706" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    {/* Title area in hero */}
    <rect x="50" y="13" width="100" height="7" rx="3.5" fill="white" fillOpacity="0.85" />
    <rect x="70" y="24" width="60" height="4" rx="2" fill="white" fillOpacity="0.50" />
    {/* Amber badge */}
    <rect x="75" y="33" width="50" height="10" rx="5" fill="#d97706" fillOpacity="0.85" />
    {/* Amber bottom stripe */}
    <rect y="52" width="200" height="3" fill="#d97706" opacity="0.7" />

    {/* Body */}
    <rect y="55" width="200" height="75" fill="white" />

    {/* Section heading */}
    <rect x="12" y="64" width="55" height="5" rx="2.5" fill="#0f172a" fillOpacity="0.7" />

    {/* Day card row */}
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${12 + i * 63}, 75)`}>
        <rect width="57" height="40" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        {/* Card image area */}
        <rect width="57" height="22" rx="4" fill="#fef3c7" />
        <rect x="2" y="2" width="53" height="18" rx="3" fill="#d97706" fillOpacity="0.25" />
        {/* Card text lines */}
        <rect x="4" y="26" width="38" height="4" rx="2" fill="#1e293b" fillOpacity="0.55" />
        <rect x="4" y="33" width="25" height="3" rx="1.5" fill="#94a3b8" />
      </g>
    ))}
  </svg>
);

const UrbanPreview = () => (
  <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="200" height="130" fill="white" />
    {/* Top blue border */}
    <rect width="200" height="4" fill="#124ea2" />

    {/* Header area */}
    <rect x="12" y="12" width="30" height="4" rx="2" fill="#124ea2" fillOpacity="0.7" />
    <rect x="12" y="20" width="100" height="7" rx="3.5" fill="#0f172a" fillOpacity="0.8" />
    <rect x="12" y="31" width="60" height="4" rx="2" fill="#94a3b8" />

    {/* Metric boxes */}
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${12 + i * 45}, 42)`}>
        <rect width="40" height="18" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
        <rect x="5" y="4" width="20" height="3" rx="1.5" fill="#94a3b8" />
        <rect x="5" y="10" width="28" height="4" rx="2" fill="#1e293b" fillOpacity="0.7" />
      </g>
    ))}

    {/* Day rows */}
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(12, ${70 + i * 18})`}>
        <rect width="176" height="14" rx="3" fill={i === 0 ? "#dbeafe" : "#f8fafc"} stroke="#e2e8f0" strokeWidth="0.75" />
        {/* Day number box */}
        <rect x="2" y="2" width="10" height="10" rx="2" fill="#124ea2" />
        <rect x="16" y="4" width="50" height="3.5" rx="1.75" fill="#1e293b" fillOpacity={i === 0 ? "0.8" : "0.5"} />
        {/* Activity pills */}
        <rect x="72" y="4" width="30" height="3.5" rx="1.75" fill="#124ea2" fillOpacity="0.25" />
        <rect x="106" y="4" width="22" height="3.5" rx="1.75" fill="#94a3b8" fillOpacity="0.5" />
      </g>
    ))}

    {/* Blue bottom border */}
    <rect y="126" width="200" height="4" fill="#124ea2" />
  </svg>
);

const ProfessionalPreview = () => (
  <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="200" height="130" fill="#f9fafb" />

    {/* Centered header */}
    <rect x="60" y="12" width="80" height="3" rx="1.5" fill="#6b7280" />
    <rect x="30" y="20" width="140" height="8" rx="4" fill="#111827" fillOpacity="0.85" />
    <rect x="65" y="32" width="70" height="4" rx="2" fill="#6b7280" fillOpacity="0.7" />

    {/* Divider */}
    <line x1="12" y1="44" x2="188" y2="44" stroke="#e5e7eb" strokeWidth="1" />

    {/* Summary block */}
    <rect x="20" y="50" width="160" height="3.5" rx="1.75" fill="#374151" fillOpacity="0.5" />
    <rect x="35" y="57" width="130" height="3.5" rx="1.75" fill="#374151" fillOpacity="0.35" />
    <rect x="50" y="64" width="100" height="3.5" rx="1.75" fill="#374151" fillOpacity="0.25" />

    {/* Divider */}
    <line x1="12" y1="74" x2="188" y2="74" stroke="#e5e7eb" strokeWidth="1" />

    {/* Day rows */}
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(12, ${80 + i * 14})`}>
        <circle cx="6" cy="5" r="5" fill="#124ea2" fillOpacity={1 - i * 0.25} />
        <rect x="16" y="2" width="55" height="3.5" rx="1.75" fill="#111827" fillOpacity={0.7 - i * 0.1} />
        <rect x="75" y="2" width="90" height="3.5" rx="1.75" fill="#9ca3af" fillOpacity="0.7" />
      </g>
    ))}
  </svg>
);

const TEMPLATE_OPTIONS = [
  {
    id: 'safari_story' as ItineraryTemplateId,
    label: 'Safari Story',
    description: 'Hero header · Photo grid · Timeline',
    accentColor: '#d97706',
    Preview: SafariPreview,
  },
  {
    id: 'urban_brief' as ItineraryTemplateId,
    label: 'Urban Brief',
    description: 'Corporate header · Compact rows',
    accentColor: '#124ea2',
    Preview: UrbanPreview,
  },
  {
    id: 'professional' as ItineraryTemplateId,
    label: 'Professional',
    description: 'Centered serif · Classic layout',
    accentColor: '#4f46e5',
    Preview: ProfessionalPreview,
  },
  {
    id: 'luxury_resort' as ItineraryTemplateId,
    label: 'Luxury Resort',
    description: 'Dark mode · Glass cards',
    accentColor: '#ccb27a',
    Preview: () => (
      <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="200" height="130" fill="#000000" />
        <rect width="200" height="40" fill="#ccb27a" fillOpacity="0.15" />
        <rect x="60" y="15" width="80" height="8" rx="4" fill="#ffffff" fillOpacity="0.9" />
        <rect x="80" y="27" width="40" height="3" rx="1.5" fill="#ccb27a" />
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(${15 + i * 90}, 50)`}>
            <rect width="80" height="60" rx="6" fill="#ffffff" fillOpacity="0.05" stroke="#ffffff" strokeOpacity="0.1" />
            <rect x="5" y="5" width="70" height="25" rx="4" fill="#ffffff" fillOpacity="0.1" />
            <rect x="10" y="38" width="50" height="4" rx="2" fill="#ffffff" fillOpacity="0.8" />
            <rect x="10" y="46" width="30" height="3" rx="1.5" fill="#ffffff" fillOpacity="0.4" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: 'visual_journey' as ItineraryTemplateId,
    label: 'Visual Journey',
    description: 'Immersive · Large photos',
    accentColor: '#e11d48',
    Preview: () => (
      <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="200" height="130" fill="#f8fafc" />
        <rect width="200" height="45" fill="#0f172a" />
        <rect x="20" y="25" width="100" height="8" rx="4" fill="#ffffff" />
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(15, ${55 + i * 35})`}>
            <rect x={i % 2 === 0 ? 0 : 100} width="70" height="25" rx="4" fill="#0f172a" fillOpacity="0.1" />
            <rect x={i % 2 === 0 ? 80 : 0} y="5" width="90" height="4" rx="2" fill="#0f172a" fillOpacity="0.8" />
            <rect x={i % 2 === 0 ? 80 : 0} y="15" width="60" height="3" rx="1.5" fill="#94a3b8" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: 'bento_journey' as ItineraryTemplateId,
    label: 'Bento Grid',
    description: 'Immersive · Masonry Layout',
    accentColor: '#6366f1',
    Preview: () => (
      <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect width="200" height="130" fill="#f0f2f5" />
        <rect x="10" y="20" width="80" height="15" rx="4" fill="#6366f1" fillOpacity="0.8" />
        <rect x="10" y="45" width="80" height="70" rx="8" fill="#cbd5e1" />
        <rect x="100" y="45" width="40" height="30" rx="6" fill="#94a3b8" />
        <rect x="150" y="45" width="40" height="30" rx="6" fill="#94a3b8" />
        <rect x="100" y="85" width="90" height="30" rx="6" fill="#cbd5e1" />
      </svg>
    ),
  },
] as const;

export function TemplateSwitcher({ currentTemplate, onTemplateChange }: TemplateSwitcherProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900 dark:text-slate-100">Choose Your Template</span>
        <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">All Free</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TEMPLATE_OPTIONS.map(({ id, label, description, accentColor, Preview }) => {
          const isSelected = currentTemplate === id;

          return (
            <button
              key={id}
              onClick={() => onTemplateChange(id)}
              className={`
                relative group rounded-xl border-2 text-left transition-all duration-200 overflow-hidden
                hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                ${isSelected
                  ? 'shadow-md'
                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }
              `}
              style={isSelected
                ? { borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}22` }
                : {}
              }
              aria-pressed={isSelected}
            >
              {/* SVG Thumbnail */}
              <div className="h-[90px] w-full overflow-hidden bg-gray-50 dark:bg-slate-900">
                <Preview />
              </div>

              {/* Info */}
              <div className="px-3 py-2 bg-white dark:bg-slate-950 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">{label}</span>
                {isSelected && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shadow shrink-0 ml-2"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Accent bottom bar on selection */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: accentColor }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
