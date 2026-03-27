'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Zap,
  LayoutTemplate,
  Radio,
} from 'lucide-react';
import { UnifiedInbox } from '@/components/whatsapp/UnifiedInbox';
import { AutomationRules } from '@/components/whatsapp/AutomationRules';
import type { WhatsAppTemplate } from '@/lib/whatsapp/india-templates';
import { useNavCounts } from '@/components/layout/useNavCounts';
import { BroadcastTab } from './BroadcastTab';
import { TemplatesListView } from './TemplatesListView';
import { GuidedTour } from '@/components/tour/GuidedTour';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PageTab = 'inbox' | 'automations' | 'templates' | 'broadcast';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PAGE_TABS: Array<{ key: PageTab; label: string; icon: React.ReactNode }> = [
  { key: 'inbox', label: 'Inbox', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { key: 'automations', label: 'Automations', icon: <Zap className="w-3.5 h-3.5" /> },
  { key: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
  { key: 'broadcast', label: 'Broadcast', icon: <Radio className="w-3.5 h-3.5" /> },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<PageTab>('inbox');
  const [pendingTemplate, setPendingTemplate] = useState<WhatsAppTemplate | null>(null);
  const counts = useNavCounts();
  const [localUnread, setLocalUnread] = useState<number | null>(null);
  const handleUnreadChange = useCallback((count: number) => setLocalUnread(count), []);
  // Use local count (synced from UnifiedInbox) when available, fall back to server count
  const unreadCount = localUnread ?? counts.inboxUnread;

  function handleUseTemplate(template: WhatsAppTemplate) {
    setPendingTemplate(template);
    setActiveTab('inbox');
  }

  return (
    <div
      className="flex flex-col h-[100dvh] overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0d1f38 100%)' }}
    >
      <GuidedTour />
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-3 md:px-6 py-2.5 md:py-4 flex items-center justify-between border-b border-white/10"
        style={{ background: 'rgba(10,22,40,0.8)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          {/* Omnichannel Logo */}
          <div
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #25D366, #3b82f6)', boxShadow: '0 4px 12px rgba(37,211,102,0.2), 0 4px 12px rgba(59,130,246,0.1)' }}
          >
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black text-white">Inbox</h1>
              {unreadCount > 0 && (
                <span
                  className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full text-white text-[9px] md:text-[10px] font-black shadow-md"
                  style={{ background: 'linear-gradient(135deg, #25D366, #3b82f6)' }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 hidden sm:block">Unified inbox for tour operators</p>
          </div>
        </div>

        {/* Status indicators — compact on mobile */}
        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span className="text-[10px] md:text-xs font-semibold text-[#25D366] hidden sm:inline">WhatsApp</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-semibold text-blue-400 hidden sm:inline">Email</span>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex gap-0.5 md:gap-1 px-3 md:px-6 py-1.5 md:py-2 border-b border-white/10 overflow-x-auto"
        style={{ background: 'rgba(10,22,40,0.6)' }}
        data-tour="inbox-tabs"
      >
        {PAGE_TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all shrink-0 ${
              activeTab === key
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {icon}
            {label}
            {key === 'inbox' && unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#25D366] text-white text-[9px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
            {activeTab === key && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#25D366] rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'inbox' && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden min-h-0"
              data-tour="inbox-messages"
            >
              <UnifiedInbox
                pendingTemplate={pendingTemplate}
                onClearPendingTemplate={() => setPendingTemplate(null)}
                onUnreadChange={handleUnreadChange}
              />
            </motion.div>
          )}

          {activeTab === 'automations' && (
            <motion.div
              key="automations"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden"
              data-tour="inbox-automations"
            >
              <AutomationRules />
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <TemplatesListView onUseTemplate={handleUseTemplate} />
            </motion.div>
          )}

          {activeTab === 'broadcast' && (
            <motion.div
              key="broadcast"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <BroadcastTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
