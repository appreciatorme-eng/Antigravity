'use client';

import { useMemo, useState } from 'react';
import { Zap, Check, Send } from 'lucide-react';
import { CannedResponses } from '@/components/whatsapp/CannedResponses';
import {
  WHATSAPP_TEMPLATES,
  TEMPLATE_CATEGORIES_DISPLAY,
  LANGUAGE_LABELS,
  type TemplateCategory,
  type WhatsAppTemplate,
} from '@/lib/whatsapp/india-templates';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface TemplatesListViewProps {
  onUseTemplate?: (template: WhatsAppTemplate) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function TemplatesListView({ onUseTemplate }: TemplatesListViewProps) {
  const [showCanned, setShowCanned] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<WhatsAppTemplate['language'] | 'all'>(
    'all',
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = WHATSAPP_TEMPLATES;
    if (selectedCategory !== 'all')
      result = result.filter((t) => t.category === selectedCategory);
    if (selectedLanguage !== 'all')
      result = result.filter((t) => t.language === selectedLanguage);
    return result;
  }, [selectedCategory, selectedLanguage]);

  const categories = [
    'all',
    ...Array.from(new Set(WHATSAPP_TEMPLATES.map((t) => t.category))),
  ] as Array<TemplateCategory | 'all'>;

  function handleCopy(template: WhatsAppTemplate) {
    navigator.clipboard.writeText(template.body).catch(() => {});
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Message Templates</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {WHATSAPP_TEMPLATES.length} templates for Indian tour operators
          </p>
        </div>
        <button
          onClick={() => setShowCanned(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold hover:bg-[#25D366]/25 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Quick Replies
        </button>
      </div>

      {/* Language filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
        {(['all', 'en', 'hi', 'hinglish'] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              selectedLanguage === lang
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-white/8 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30'
                : 'bg-white/8 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {cat === 'all' ? 'All Templates' : TEMPLATE_CATEGORIES_DISPLAY[cat]}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="border border-white/10 rounded-xl bg-white/5 hover:bg-white/8 transition-colors flex flex-col overflow-hidden"
          >
            <div className="p-4 flex-1">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-xl shrink-0">{template.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{template.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-400 uppercase tracking-wider">
                      {TEMPLATE_CATEGORIES_DISPLAY[template.category]}
                    </span>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        template.language === 'en'
                          ? 'bg-blue-500/15 text-blue-400'
                          : template.language === 'hi'
                            ? 'bg-orange-500/15 text-orange-400'
                            : 'bg-purple-500/15 text-purple-400'
                      }`}
                    >
                      {template.language === 'en'
                        ? '\uD83C\uDDEC\uD83C\uDDE7 EN'
                        : template.language === 'hi'
                          ? '\uD83C\uDDEE\uD83C\uDDF3 HI'
                          : '\uD83E\uDD1D Mix'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-300 bg-black/20 rounded-lg p-3 font-mono leading-relaxed max-h-32 overflow-hidden relative">
                {template.body.slice(0, 200)}
                {template.body.length > 200 && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
                )}
              </div>
              <div className="flex gap-1 flex-wrap mt-2">
                {template.variables.slice(0, 4).map((v) => (
                  <span
                    key={v}
                    className="text-[9px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded px-1.5 py-0.5 font-mono"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
                {template.variables.length > 4 && (
                  <span className="text-[9px] text-slate-500">
                    +{template.variables.length - 4} more
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <button
                onClick={() => handleCopy(template)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  copiedId === template.id
                    ? 'border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366]'
                    : 'border-white/15 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Check
                  className={`w-3.5 h-3.5 ${copiedId !== template.id ? 'opacity-0' : ''}`}
                />
                {copiedId === template.id ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => onUseTemplate?.(template)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 border border-[#25D366]/20 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Use
              </button>
            </div>
          </div>
        ))}
      </div>

      <CannedResponses
        isOpen={showCanned}
        onClose={() => setShowCanned(false)}
        onSelect={(msg) => {
          navigator.clipboard.writeText(msg).catch(() => {});
          setShowCanned(false);
        }}
      />
    </div>
  );
}
