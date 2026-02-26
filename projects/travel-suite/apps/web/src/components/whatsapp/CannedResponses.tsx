'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Copy, Send, Zap, Globe, MessageSquare, ChevronRight } from 'lucide-react';
import {
  WHATSAPP_TEMPLATES,
  QUICK_REPLIES,
  HINDI_QUICK_REPLIES,
  TEMPLATE_CATEGORIES_DISPLAY,
  type WhatsAppTemplate,
  type TemplateCategory,
} from '@/lib/whatsapp/india-templates';

interface CannedResponsesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (message: string) => void;
}

type TabType = 'english' | 'hindi';
type SubTab = 'quick' | 'templates';

function VariableHighlightedText({ text }: { text: string }) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (/^\{\{[^}]+\}\}$/.test(part)) {
          const varName = part.replace(/[{}]/g, '');
          return (
            <span
              key={i}
              className="inline-block bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 rounded px-1 text-[11px] font-mono mx-0.5 cursor-pointer hover:bg-yellow-400/30 transition-colors"
              title={`Variable: ${varName}`}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function TemplateCard({
  template,
  onSelect,
  onCopy,
}: {
  template: WhatsAppTemplate;
  onSelect: (msg: string) => void;
  onCopy: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 hover:bg-white/8 transition-colors">
      <button
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-2"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{template.emoji ?? '💬'}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{template.name}</p>
            <p className="text-xs text-slate-400 truncate">{template.preview}</p>
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 border-t border-white/10">
              <div className="mt-3 p-3 bg-black/20 rounded-lg text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                <VariableHighlightedText text={template.body} />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onCopy(template.body)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 transition-colors text-xs font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
                <button
                  onClick={() => onSelect(template.body)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#1FAF54] text-white transition-colors text-xs font-semibold"
                >
                  <Send className="w-3.5 h-3.5" />
                  Use Template
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CannedResponses({ isOpen, onClose, onSelect }: CannedResponsesProps) {
  const [tab, setTab] = useState<TabType>('english');
  const [subTab, setSubTab] = useState<SubTab>('quick');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 350);
    }
  }, [isOpen]);

  const filteredTemplates = useMemo(() => {
    const q = search.toLowerCase();
    const langFilter: WhatsAppTemplate['language'][] =
      tab === 'hindi' ? ['hi', 'hinglish'] : ['en', 'hinglish'];

    return WHATSAPP_TEMPLATES.filter(
      (t) =>
        langFilter.includes(t.language) &&
        (q === '' ||
          t.name.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          t.preview.toLowerCase().includes(q))
    );
  }, [search, tab]);

  const filteredQuickReplies = useMemo(() => {
    const q = search.toLowerCase();
    const replies = tab === 'hindi' ? HINDI_QUICK_REPLIES : QUICK_REPLIES;
    return q === '' ? replies : replies.filter((r) => r.toLowerCase().includes(q));
  }, [search, tab]);

  const groupedTemplates = useMemo(() => {
    const groups: Partial<Record<TemplateCategory, WhatsAppTemplate[]>> = {};
    for (const t of filteredTemplates) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category]!.push(t);
    }
    return groups;
  }, [filteredTemplates]);

  function handleCopy(msg: string, id?: string) {
    navigator.clipboard.writeText(msg).catch(() => {});
    const key = id ?? msg.slice(0, 20);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-2xl mx-auto"
          >
            <div
              className="rounded-t-2xl border border-white/10 border-b-0 overflow-hidden flex flex-col"
              style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(10,22,40,0.99) 100%)',
                backdropFilter: 'blur(24px)',
                maxHeight: '80vh',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#25D366]" />
                  </div>
                  <h2 className="text-base font-bold text-white">Quick Replies</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Language Tabs */}
              <div className="flex gap-1 px-5 pb-3">
                {(['english', 'hindi'] as TabType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setSearch(''); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tab === t
                        ? 'bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20'
                        : 'bg-white/8 text-slate-400 hover:text-white hover:bg-white/12'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {t === 'english' ? 'English' : 'Hindi / Hinglish'}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="px-5 pb-3">
                <div className="flex items-center gap-2 bg-white/8 border border-white/12 rounded-xl px-3 py-2">
                  <Search className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search replies and templates..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch('')}>
                      <X className="w-3.5 h-3.5 text-slate-500 hover:text-white transition-colors" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sub Tabs */}
              <div className="flex gap-1 px-5 pb-3">
                {(['quick', 'templates'] as SubTab[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubTab(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      subTab === s
                        ? 'bg-white/15 text-white'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/8'
                    }`}
                  >
                    {s === 'quick' ? (
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Quick Replies
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Templates ({filteredTemplates.length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5">
                {subTab === 'quick' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredQuickReplies.length === 0 ? (
                      <p className="col-span-2 text-center text-slate-500 text-sm py-8">
                        No quick replies found
                      </p>
                    ) : (
                      filteredQuickReplies.map((reply) => {
                        const isCopied = copiedId === reply.slice(0, 20);
                        return (
                          <div
                            key={reply}
                            className="group relative border border-white/10 rounded-xl p-3 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                          >
                            <p className="text-sm text-slate-200 mb-3 leading-relaxed">{reply}</p>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleCopy(reply)}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                  isCopied
                                    ? 'border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366]'
                                    : 'border-white/15 text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <Copy className="w-3 h-3" />
                                {isCopied ? 'Copied!' : 'Copy'}
                              </button>
                              <button
                                onClick={() => onSelect(reply)}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] hover:bg-[#1FAF54] text-white transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                Send
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.keys(groupedTemplates).length === 0 ? (
                      <p className="text-center text-slate-500 text-sm py-8">No templates found</p>
                    ) : (
                      Object.entries(groupedTemplates).map(([category, templates]) => (
                        <div key={category}>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {TEMPLATE_CATEGORIES_DISPLAY[category as TemplateCategory] ?? category}
                          </p>
                          <div className="space-y-2">
                            {templates!.map((t) => (
                              <TemplateCard
                                key={t.id}
                                template={t}
                                onSelect={(msg) => { onSelect(msg); onClose(); }}
                                onCopy={(msg) => handleCopy(msg, t.id)}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
