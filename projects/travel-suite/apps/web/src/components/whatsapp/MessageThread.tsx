'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  MapPin,
  FileText,
  CreditCard,
  Navigation,
  UserCheck,
  Zap,
  Check,
  CheckCheck,
  Mic,
  Image,
  X,
} from 'lucide-react';
import { CannedResponses } from './CannedResponses';

export type MessageType = 'text' | 'location' | 'image' | 'voice' | 'system' | 'document';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'pending';
export type MessageDirection = 'in' | 'out';

export interface Message {
  id: string;
  type: MessageType;
  direction: MessageDirection;
  body?: string;
  timestamp: string; // e.g. "10:42 AM"
  status?: MessageStatus;
  // location
  lat?: number;
  lng?: number;
  locationLabel?: string;
  // image
  imageUrl?: string;
  imageCaption?: string;
  // voice
  voiceDuration?: string;
  // document
  docName?: string;
  docSize?: string;
}

export type ContactType = 'client' | 'driver' | 'lead';

export interface ConversationContact {
  id: string;
  name: string;
  phone: string; // +91 XXXXX XXXXX
  type: ContactType;
  avatar?: string; // initials fallback
  avatarColor?: string;
  lastSeen?: string;
  isOnline?: boolean;
  trip?: string;
  label?: 'lead' | 'payment' | 'location' | 'confirmed';
}

export interface Conversation {
  id: string;
  contact: ConversationContact;
  messages: Message[];
  unreadCount: number;
}

const AVATAR_COLORS: Record<string, string> = {
  client: '#6366f1',
  driver: '#f59e0b',
  lead: '#ec4899',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function ReadReceipt({ status }: { status?: MessageStatus }) {
  if (!status || status === 'pending') return null;
  if (status === 'sent') return <Check className="w-3 h-3 text-slate-400" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-slate-400" />;
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-400" />;
  return null;
}

function detectLabel(messages: Message[]): ConversationContact['label'] | null {
  const recentText = messages
    .slice(-5)
    .map((m) => m.body?.toLowerCase() ?? '')
    .join(' ');

  if (recentText.includes('payment') || recentText.includes('pay') || recentText.includes('invoice') || recentText.includes('gst')) return 'payment';
  if (messages.some((m) => m.type === 'location')) return 'location';
  if (recentText.includes('confirm') || recentText.includes('book')) return 'confirmed';
  return null;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === 'out';

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] text-slate-500 bg-white/5 border border-white/10 rounded-full px-3 py-1">
          {msg.body}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
          isOut
            ? 'rounded-tr-sm bg-[#25D366]/15 border border-[#25D366]/25'
            : 'rounded-tl-sm bg-white/8 border border-white/10'
        }`}
      >
        {msg.type === 'location' && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{msg.locationLabel ?? 'Location Shared'}</p>
              <button className="text-xs text-blue-400 hover:underline">View Location</button>
            </div>
          </div>
        )}

        {msg.type === 'voice' && (
          <div className="flex items-center gap-2 min-w-[140px]">
            <div className="w-8 h-8 rounded-full bg-[#25D366]/30 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 text-[#25D366]" />
            </div>
            <div className="flex-1">
              <div className="h-1.5 bg-white/20 rounded-full">
                <div className="h-full w-2/3 bg-[#25D366]/60 rounded-full" />
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono shrink-0">{msg.voiceDuration ?? '0:12'}</span>
          </div>
        )}

        {msg.type === 'image' && (
          <div className="mb-1">
            <div className="w-48 h-32 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden">
              {msg.imageUrl ? (
                <img src={msg.imageUrl} alt="shared" className="w-full h-full object-cover" />
              ) : (
                <Image className="w-8 h-8 text-slate-500" />
              )}
            </div>
            {msg.imageCaption && (
              <p className="text-xs text-slate-300 mt-1">{msg.imageCaption}</p>
            )}
          </div>
        )}

        {msg.type === 'document' && (
          <div className="flex items-center gap-2 min-w-[160px]">
            <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{msg.docName ?? 'Document'}</p>
              <p className="text-[10px] text-slate-400">{msg.docSize ?? '—'}</p>
            </div>
          </div>
        )}

        {msg.type === 'text' && msg.body && (
          <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
        )}

        {/* Footer */}
        <div className={`flex items-center gap-1 mt-1 ${isOut ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[9px] text-slate-500 font-medium">{msg.timestamp}</span>
          {isOut && <ReadReceipt status={msg.status} />}
        </div>
      </div>
    </div>
  );
}

function AutoLabelChip({ label }: { label: ConversationContact['label'] }) {
  if (!label) return null;
  const configs = {
    lead: { icon: '🆕', text: 'Lead', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    payment: { icon: '💰', text: 'Payment', bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    location: { icon: '📍', text: 'Location', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    confirmed: { icon: '✅', text: 'Confirmed', bg: 'bg-green-500/20 text-green-300 border-green-500/30' },
  };
  const c = configs[label];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.bg}`}>
      {c.icon} {c.text}
    </span>
  );
}

interface MessageThreadProps {
  conversation: Conversation | null;
  onSendMessage?: (conversationId: string, message: string) => void;
}

export function MessageThread({ conversation, onSendMessage }: MessageThreadProps) {
  const [inputText, setInputText] = useState('');
  const [showCanned, setShowCanned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  function handleSend() {
    const text = inputText.trim();
    if (!text || !conversation) return;
    onSendMessage?.(conversation.id, text);
    setInputText('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleCannedSelect(msg: string) {
    setInputText(msg);
    setShowCanned(false);
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white/2">
        <div className="w-20 h-20 rounded-full bg-[#25D366]/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#25D366]">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-slate-300 font-semibold text-lg">Select a conversation</p>
          <p className="text-slate-500 text-sm mt-1">Pick a chat from the left to start messaging</p>
        </div>
      </div>
    );
  }

  const { contact, messages } = conversation;
  const detectedLabel = detectLabel(messages) ?? contact.label;
  const avatarColor = AVATAR_COLORS[contact.type] ?? '#6366f1';
  const initials = getInitials(contact.name);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div
        className="shrink-0 h-16 flex items-center justify-between px-4 border-b border-white/10"
        style={{ background: 'rgba(10,22,40,0.8)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: avatarColor }}
            >
              {initials}
            </div>
            {contact.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-[#0a1628] rounded-full" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{contact.name}</h2>
              {detectedLabel && <AutoLabelChip label={detectedLabel} />}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{contact.phone}</span>
              {contact.trip && (
                <>
                  <span>·</span>
                  <span className="text-[#25D366]">{contact.trip}</span>
                </>
              )}
              {contact.isOnline ? (
                <span className="text-[#25D366]">· Online</span>
              ) : contact.lastSeen ? (
                <span>· Last seen {contact.lastSeen}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <Phone className="w-4 h-4 text-slate-400" />
          </button>
          <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar space-y-0.5">
        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1];
          const showDateSep =
            i === 0 || (prevMsg && prevMsg.timestamp.includes('Yesterday') !== msg.timestamp.includes('Yesterday'));
          return (
            <div key={msg.id}>
              {showDateSep && i === 0 && (
                <div className="flex justify-center my-3">
                  <span className="text-[10px] font-semibold text-slate-500 bg-white/5 border border-white/10 rounded-full px-3 py-1 uppercase tracking-wider">
                    Today
                  </span>
                </div>
              )}
              <MessageBubble msg={msg} />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Trip Actions Bar */}
      <div className="shrink-0 px-4 pt-2 pb-1 flex items-center gap-2 overflow-x-auto">
        {[
          { icon: <FileText className="w-3.5 h-3.5" />, label: 'Send Itinerary' },
          { icon: <CreditCard className="w-3.5 h-3.5" />, label: 'Payment Link' },
          { icon: <Navigation className="w-3.5 h-3.5" />, label: 'Request Location' },
          { icon: <UserCheck className="w-3.5 h-3.5" />, label: 'Driver Details' },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-slate-300 text-xs font-medium transition-colors"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 bg-white/8 border border-white/15 rounded-2xl px-3 py-2">
          <button className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0">
            <Paperclip className="w-4 h-4 text-slate-400" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none min-w-0"
          />
          <button className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0">
            <Smile className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => setShowCanned(true)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            title="Canned Responses"
          >
            <Zap className="w-4 h-4 text-[#25D366]" />
          </button>
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#1FAF54] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>

      <CannedResponses
        isOpen={showCanned}
        onClose={() => setShowCanned(false)}
        onSelect={handleCannedSelect}
      />
    </div>
  );
}
