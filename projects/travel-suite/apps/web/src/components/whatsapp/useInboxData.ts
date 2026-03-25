'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/lib/analytics/events';
import { formatLocalTime } from '@/lib/date/tz';
import { useDemoMode } from '@/lib/demo/demo-mode-context';
import { createClient } from '@/lib/supabase/client';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { toast } from 'sonner';
import type { Message } from './MessageThread';
import type { ChatbotSessionSummary } from './whatsapp.types';
import {
  type ChannelConversation,
  type ChannelType,
  ALL_MOCK_CONVERSATIONS,
} from './inbox-mock-data';
import type { ContextAction } from './unified-inbox-shared';
import type { ContextActionType } from './ContextActionModal';
import type { ActionMode } from './whatsapp.types';
import { useSmartReplySuggestions } from './useSmartReplySuggestions';

export type WhatsAppStatus = 'connected' | 'pending' | 'disconnected' | 'error';

export interface InboxData {
  // Conversation state
  conversations: ChannelConversation[];
  selectedId: string | null;
  selectedConversation: ChannelConversation | null;
  selectedChannel: ChannelType;
  isLoadingConvs: boolean;
  conversationsError: string | null;
  totalUnread: number;

  // WhatsApp status
  whatsAppStatus: WhatsAppStatus;
  whatsAppHealthError: string | null;

  // Chatbot
  activeChatbotSession: ChatbotSessionSummary | null;
  showChatbotBanner: boolean;
  isTakingOverChatbot: boolean;
  isRefreshingProposalDraft: boolean;

  // Smart replies
  smartReplySuggestions: string[];
  smartReplyLoading: boolean;
  clearSmartReplySuggestions: () => void;
  refreshSmartReplySuggestions: () => void;

  // Modal state
  contextModal: { type: ContextActionType; tripName?: string; waId?: string } | null;
  ctxActionModal: ActionMode | null;
  isWaConnectOpen: boolean;

  // Actions
  handleSelect: (id: string) => void;
  handleSendMessage: (convId: string, message: string, subject?: string) => Promise<boolean>;
  handleTakeOverChatbot: (session: ChatbotSessionSummary) => Promise<void>;
  handleOpenProposalDraft: (draftId: string) => void;
  handleRefreshProposalDraft: (draftId: string) => Promise<void>;
  handleContextAction: (action: ContextAction, tripName?: string) => void;
  setCtxActionModal: (mode: ActionMode | null) => void;
  setContextModal: (modal: { type: ContextActionType; tripName?: string; waId?: string } | null) => void;
  setIsWaConnectOpen: (open: boolean) => void;
  setWhatsAppStatus: (status: WhatsAppStatus) => void;
  loadLiveConversations: () => Promise<void>;
  businessOnly: boolean;
  setBusinessOnly: (value: boolean) => void;
  addToCrmModal: { open: boolean; phone: string; name: string };
  setAddToCrmModal: (val: { open: boolean; phone: string; name: string }) => void;
}

export interface UseInboxDataOptions {
  onSendMessage?: (convId: string, message: string) => void;
}

// --- Read tracking helpers (pure, no hook state) ---

const READ_KEY = 'tripbuilt_inbox_read_at';

function getReadTimestamps(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || '{}');
  } catch { return {}; }
}

function markConversationRead(convId: string) {
  const map = getReadTimestamps();
  const updated = { ...map, [convId]: new Date().toISOString() };
  localStorage.setItem(READ_KEY, JSON.stringify(updated));
}

function applyReadTracking(convs: ChannelConversation[]): ChannelConversation[] {
  const readMap = getReadTimestamps();
  return convs.map((c) => {
    const lastReadAt = readMap[c.id];
    if (!lastReadAt) return c;
    const unread = c.messages.filter(
      (m) => m.direction === 'in' && m.timestamp > lastReadAt
    ).length;
    return { ...c, unreadCount: unread };
  });
}

export function useInboxData({ onSendMessage }: UseInboxDataOptions): InboxData {
  const router = useRouter();
  const analytics = useAnalytics();
  const { isDemoMode } = useDemoMode();
  const supabase = useMemo(() => createClient(), []);
  const { timezone } = useUserTimezone();

  const [conversations, setConversations] = useState<ChannelConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatus>('disconnected');
  const [whatsAppHealthError, setWhatsAppHealthError] = useState<string | null>(null);
  const [isTakingOverChatbot, setIsTakingOverChatbot] = useState(false);
  const [isRefreshingProposalDraft, setIsRefreshingProposalDraft] = useState(false);
  const [contextModal, setContextModal] = useState<{ type: ContextActionType; tripName?: string; waId?: string } | null>(null);
  const [ctxActionModal, setCtxActionModal] = useState<ActionMode | null>(null);
  const [isWaConnectOpen, setIsWaConnectOpen] = useState(false);
  const [businessOnly, setBusinessOnly] = useState(true);
  const [addToCrmModal, setAddToCrmModal] = useState<{ open: boolean; phone: string; name: string }>({ open: false, phone: '', name: '' });

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedChannel: ChannelType = (selectedConversation as ChannelConversation | null)?.channel ?? 'whatsapp';
  const activeChatbotSession =
    selectedConversation?.channel === 'whatsapp' ? selectedConversation.chatbotSession ?? null : null;
  const showChatbotBanner =
    !isDemoMode &&
    activeChatbotSession?.state !== undefined &&
    activeChatbotSession.state !== 'handed_off' &&
    activeChatbotSession.aiReplyCount > 0;

  const {
    suggestions: smartReplySuggestions,
    loading: smartReplyLoading,
    clear: clearSmartReplySuggestions,
    refresh: refreshSmartReplySuggestions,
  } = useSmartReplySuggestions(
    selectedConversation,
    !isDemoMode && selectedChannel === 'whatsapp',
  );

  const totalUnread = conversations.reduce((a, c) => a + c.unreadCount, 0);

  // --- Data loading ---

  const loadLiveConversations = useCallback(async () => {
    setIsLoadingConvs(true);
    setConversationsError(null);
    try {
      const qp = businessOnly ? '' : '?business_only=false';
      const response = await fetch(`/api/whatsapp/conversations${qp}`, { cache: 'no-store' });
      const data = (await response.json().catch(() => ({}))) as {
        conversations?: ChannelConversation[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load conversations');
      }
      const rawConvs = data.conversations ?? [];
      const convs = applyReadTracking(rawConvs);

      // In demo mode with no real data, fall back to mock conversations
      if (isDemoMode && convs.length === 0) {
        setConversations(ALL_MOCK_CONVERSATIONS);
        setSelectedId('conv_1');
        setWhatsAppStatus('connected');
      } else {
        setConversations(convs);
        setSelectedId((current) => current || convs[0]?.id || null);
      }
    } catch (error) {
      // In demo mode, fall back to mock conversations on error
      if (isDemoMode) {
        setConversations(ALL_MOCK_CONVERSATIONS);
        setSelectedId('conv_1');
        setWhatsAppStatus('connected');
      } else {
        setConversationsError(
          error instanceof Error ? error.message : 'Unable to load conversations right now.',
        );
      }
    } finally {
      setIsLoadingConvs(false);
    }
  }, [isDemoMode, businessOnly]);

  const loadWhatsAppHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp/health', { cache: 'no-store' });
      const json = (await response.json().catch(() => ({}))) as {
        data?: { connected?: boolean; error?: string | null };
        connected?: boolean;
        error?: string | null;
      };
      // apiSuccess wraps in { data, error } envelope — unwrap it
      const payload = json.data ?? json;
      setWhatsAppStatus(payload.connected ? 'connected' : 'disconnected');
      setWhatsAppHealthError(payload.error ?? null);
    } catch {
      setWhatsAppStatus('error');
      setWhatsAppHealthError('Unable to reach WhatsApp right now.');
    }
  }, []);

  useEffect(() => {
    // Always attempt to load real conversations first
    void loadLiveConversations();
    void loadWhatsAppHealth();
  }, [loadLiveConversations, loadWhatsAppHealth]);

  useEffect(() => {
    if (isDemoMode) return;

    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_webhook_events' },
        () => {
          void loadLiveConversations();
          void loadWhatsAppHealth();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_connections' },
        () => {
          void loadWhatsAppHealth();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isDemoMode, loadLiveConversations, loadWhatsAppHealth, supabase]);

  // --- Actions ---

  function handleSelect(id: string) {
    setSelectedId(id);
    markConversationRead(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  }

  async function handleTakeOverChatbot(session: ChatbotSessionSummary) {
    setIsTakingOverChatbot(true);
    try {
      const response = await fetch(`/api/whatsapp/chatbot-sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'handed_off' }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { session?: ChatbotSessionSummary };
        error?: string;
      };

      if (!response.ok || !payload.data?.session) {
        throw new Error(payload.error || 'Failed to hand conversation to a human');
      }

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === selectedId
            ? { ...conversation, chatbotSession: payload.data?.session ?? null }
            : conversation,
        ),
      );
      toast.success('AI handoff disabled for this conversation');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to take over this conversation',
      );
    } finally {
      setIsTakingOverChatbot(false);
    }
  }

  function handleOpenProposalDraft(draftId: string) {
    router.push(`/proposals/create?whatsappDraft=${encodeURIComponent(draftId)}`);
  }

  async function handleRefreshProposalDraft(draftId: string) {
    setIsRefreshingProposalDraft(true);
    try {
      const response = await fetch(`/api/whatsapp/proposal-drafts/${draftId}`, {
        method: 'POST',
      });
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { draft?: { id?: string } };
        error?: string;
      };

      if (!response.ok || !payload.data?.draft?.id) {
        throw new Error(payload.error || 'Failed to refresh proposal draft');
      }

      toast.success('Proposal draft refreshed from the latest chat context');
      handleOpenProposalDraft(payload.data.draft.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh proposal draft');
    } finally {
      setIsRefreshingProposalDraft(false);
    }
  }

  async function handleSendMessage(convId: string, message: string, subject?: string): Promise<boolean> {
    const conversation = conversations.find((item) => item.id === convId);
    if (!conversation) return false;

    if (conversation.channel !== 'whatsapp') {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const localMsg: Message = {
            id: `m_${Date.now()}`,
            type: 'text',
            direction: 'out',
            body: message,
            subject,
            timestamp: formatLocalTime(new Date(), timezone),
            status: 'sent',
          };
          return { ...c, messages: [...c.messages, localMsg] };
        }),
      );
      onSendMessage?.(convId, message);
      return true;
    }

    if (whatsAppStatus !== 'connected') {
      toast.error('WhatsApp is not connected. Link it from Settings before replying.');
      setWhatsAppStatus('disconnected');
      return false;
    }

    const optimisticId = `pending_${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      type: 'text',
      direction: 'out',
      body: message,
      subject,
      timestamp: formatLocalTime(new Date(), timezone),
      status: 'pending',
    };

    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, optimisticMessage] } : c)),
    );

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: conversation.contact.phone,
          message,
          subject,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.data?.message) {
        throw new Error(payload?.error || 'Failed to send WhatsApp message');
      }

      const sentMessage = payload.data.message as Message;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((msg) => (msg.id === optimisticId ? sentMessage : msg)),
              }
            : c,
        ),
      );
      setWhatsAppStatus('connected');
      analytics.whatsappSent('thread');
      clearSmartReplySuggestions();
      onSendMessage?.(convId, message);
      return true;
    } catch (error) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, messages: c.messages.filter((msg) => msg.id !== optimisticId) }
            : c,
        ),
      );
      setWhatsAppStatus('disconnected');
      toast.error(error instanceof Error ? error.message : 'Failed to send WhatsApp reply');
      return false;
    }
  }

  async function handleContextAction(action: ContextAction, tripName?: string) {
    if (!selectedConversation) return;
    const { contact } = selectedConversation;

    if (action === 'add-to-crm') {
      // If name is just the phone number (no push name), leave it blank
      const isPhoneName = /^\+?\d[\d\s-]+$/.test(contact.name || '');
      setAddToCrmModal({
        open: true,
        phone: contact.phone,
        name: isPhoneName ? '' : (contact.name || ''),
      });
      return;
    }

    if (action === 'assign-driver') {
      setCtxActionModal('driver');
      return;
    }

    if (action === 'request-payment') {
      setCtxActionModal('payment');
      return;
    }

    if (action === 'create-proposal') {
      const waId = contact.phone.replace(/[\s+]/g, '');
      setContextModal({ type: 'create-proposal', waId });
      return;
    }

    setContextModal({ type: action as ContextActionType, tripName });
  }

  return {
    conversations,
    selectedId,
    selectedConversation,
    selectedChannel,
    isLoadingConvs,
    conversationsError,
    totalUnread,
    whatsAppStatus,
    whatsAppHealthError,
    activeChatbotSession,
    showChatbotBanner,
    isTakingOverChatbot,
    isRefreshingProposalDraft,
    smartReplySuggestions,
    smartReplyLoading,
    clearSmartReplySuggestions,
    refreshSmartReplySuggestions,
    contextModal,
    ctxActionModal,
    isWaConnectOpen,
    handleSelect,
    handleSendMessage,
    handleTakeOverChatbot,
    handleOpenProposalDraft,
    handleRefreshProposalDraft,
    handleContextAction,
    setCtxActionModal,
    setContextModal,
    setIsWaConnectOpen,
    setWhatsAppStatus,
    loadLiveConversations,
    businessOnly,
    setBusinessOnly,
    addToCrmModal,
    setAddToCrmModal,
  };
}
