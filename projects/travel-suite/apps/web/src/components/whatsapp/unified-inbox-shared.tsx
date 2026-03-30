'use client';

import { Mail, MessageCircle } from 'lucide-react';

import {
  type Conversation,
  type Message,
} from './MessageThread';
import type { ContextActionType } from './ContextActionModal';
import type { ConversationContact } from './whatsapp.types';
import type { ChannelConversation } from './inbox-mock-data';

export type FilterTab = 'all' | 'clients' | 'drivers' | 'leads';
export type ChannelFilter = 'all' | 'whatsapp' | 'email';
export type SortMode = 'recent' | 'unread' | 'priority';
export type ContextAction = ContextActionType | 'assign-driver' | 'request-payment' | 'add-to-crm';

// ---------------------------------------------------------------------------
// Timestamp formatting — handles both ISO strings and pre-formatted times
// ---------------------------------------------------------------------------

export function formatConversationTime(raw: string): string {
  if (!raw) return '';

  // If already formatted (e.g. "10:42 AM", "Yesterday"), pass through
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;

  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const sixDaysAgo = new Date(today.getTime() - 6 * 86400000);
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDay.getTime() === today.getTime()) {
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (msgDay.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  if (msgDay >= sixDaysAgo) {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

// Travel intent badge metadata (client-side mirror of classify-intent.ts INTENT_META)
const INTENT_BADGES: Record<string, { label: string; emoji: string; color: string }> = {
  new_enquiry:   { label: 'New Enquiry', emoji: '🆕', color: '#8b5cf6' },
  payment_query: { label: 'Payment', emoji: '💰', color: '#f59e0b' },
  modification:  { label: 'Modification', emoji: '✏️', color: '#3b82f6' },
  document:      { label: 'Document', emoji: '📄', color: '#10b981' },
  cancellation:  { label: 'Cancellation', emoji: '❌', color: '#ef4444' },
  feedback:      { label: 'Feedback', emoji: '⭐', color: '#ec4899' },
  follow_up:     { label: 'Follow Up', emoji: '🔄', color: '#6366f1' },
};

export const AVATAR_COLORS: Record<ConversationContact['type'], string> = {
  client: '#6366f1',
  driver: '#f59e0b',
  lead: '#ec4899',
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function getLastMessage(conv: Conversation): Message | undefined {
  return conv.messages[conv.messages.length - 1];
}

export function lastMessagePreview(msg?: Message): string {
  if (!msg) return '';
  if (msg.type === 'text') return msg.body?.slice(0, 50) ?? '';
  if (msg.type === 'location') return '📍 Location shared';
  if (msg.type === 'voice') return '🎤 Voice note';
  if (msg.type === 'image') return '🖼️ Photo';
  if (msg.type === 'document') return `📄 ${msg.docName ?? 'Document'}`;
  if (msg.type === 'system') return msg.body ?? '';
  return '';
}

export function LabelChip({ label }: { label?: ConversationContact['label'] }) {
  if (!label) return null;
  const configs = {
    lead: { text: '🆕 Lead', cls: 'bg-purple-500/20 text-purple-300' },
    payment: { text: '💰 Pay', cls: 'bg-yellow-500/20 text-yellow-300' },
    location: { text: '📍 Loc', cls: 'bg-blue-500/20 text-blue-300' },
    confirmed: { text: '✅ OK', cls: 'bg-green-500/20 text-green-300' },
  };
  const c = configs[label];
  if (!c) return null;
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.cls}`}>{c.text}</span>
  );
}

export function UnifiedInboxConversationItem({
  conv,
  selected,
  onClick,
}: {
  conv: ChannelConversation;
  selected: boolean;
  onClick: () => void;
}) {
  const last = getLastMessage(conv);
  const preview = lastMessagePreview(last);
  const initials = getInitials(conv.contact.name);
  const avatarColor = conv.contact.avatarColor ?? AVATAR_COLORS[conv.contact.type];
  const isUnread = conv.unreadCount > 0;
  const isEmailConv = conv.channel === 'email';
  const accentColor = isEmailConv ? '#3b82f6' : '#25D366';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 transition-colors border-b border-white/5 flex items-start gap-3 ${
        selected
          ? isEmailConv
            ? 'bg-blue-500/15 border-l-2 border-l-blue-500'
            : 'bg-[#25D366]/15 border-l-2 border-l-[#25D366]'
          : 'hover:bg-white/5'
      }`}
    >
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: avatarColor }}
        >
          {initials}
        </div>
        {conv.contact.isOnline && !isEmailConv && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#0a1628] rounded-full" />
        )}
        <span
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0a1628]"
          style={{ background: accentColor }}
        >
          {isEmailConv ? (
            <Mail className="w-2 h-2 text-white" />
          ) : (
            <MessageCircle className="w-2 h-2 text-white" />
          )}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={`text-sm truncate ${isUnread ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
            {conv.contact.name}
          </p>
          <span className="text-[10px] text-slate-300 shrink-0">{formatConversationTime(last?.timestamp ?? '')}</span>
        </div>
        <p className="text-[10px] text-slate-300 mb-1">
          {isEmailConv && conv.contact.email ? conv.contact.email : conv.contact.phone}
        </p>
        <p className={`text-xs truncate ${isUnread ? 'text-slate-100 font-medium' : 'text-slate-300'}`}>
          {last?.direction === 'out' && <span className="text-slate-500">You: </span>}
          {last?.subject ? `${last.subject} — ` : ''}
          {preview}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1 min-w-0">
            <LabelChip label={conv.contact.label} />
            {conv.intent && conv.intent !== 'general' && INTENT_BADGES[conv.intent] && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
                style={{
                  background: `${INTENT_BADGES[conv.intent].color}15`,
                  borderColor: `${INTENT_BADGES[conv.intent].color}30`,
                  color: INTENT_BADGES[conv.intent].color,
                }}
              >
                {INTENT_BADGES[conv.intent].emoji} {INTENT_BADGES[conv.intent].label}
              </span>
            )}
          </div>
          {isUnread && (
            <span
              className="text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{ background: accentColor }}
            >
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
