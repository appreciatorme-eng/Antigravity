'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/lib/analytics/events';
import { authedFetch } from '@/lib/api/authed-fetch';
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
} from './inbox-mock-data';
import type { ContextAction } from './unified-inbox-shared';
import type { ContextActionType } from './ContextActionModal';
import type { ActionMode } from './whatsapp.types';
import { useSmartReplySuggestions } from './useSmartReplySuggestions';

export type WhatsAppStatus = 'connected' | 'pending' | 'disconnected' | 'error';

export interface PresenceState {
  readonly presence: string; // composing, recording, available, unavailable
  readonly lastSeenAt: string | null;
}

export interface InboxData {
  // Conversation state
  conversations: ChannelConversation[];
  selectedId: string | null;
  selectedConversation: ChannelConversation | null;
  selectedChannel: ChannelType;
  isLoadingConvs: boolean;
  conversationsError: string | null;
  totalUnread: number;
  presenceMap: Map<string, PresenceState>;

  // WhatsApp status
  whatsAppStatus: WhatsAppStatus;
  whatsAppHealthError: string | null;

  // Gmail status
  gmailConnected: boolean;
  emailNextPageToken: string | null;
  emailFolder: string;
  setEmailFolder: (folder: string) => void;
  searchEmails: (query: string) => void;
  loadMoreEmails: () => Promise<void>;

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
  handleSendMessage: (convId: string, message: string, subject?: string, files?: File[], ccBcc?: { cc?: string; bcc?: string }) => Promise<boolean>;
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
  startNewEmail: () => void;
  updateComposeRecipient: (email: string) => void;
  deleteEmail: (conversationId: string) => void;
  archiveEmail: (conversationId: string) => void;
}

export interface UseInboxDataOptions {
  onSendMessage?: (convId: string, message: string) => void;
}

// --- Read tracking helpers (server-side + localStorage fallback) ---

const READ_KEY = 'tripbuilt_inbox_read_at';

/** Optimistic localStorage cache — synced to server */
function getReadTimestamps(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || '{}');
  } catch { return {}; }
}

/** Write to localStorage (instant) + fire-and-forget POST to server */
function markConversationRead(convId: string) {
  const now = new Date().toISOString();
  const map = getReadTimestamps();
  const updated = { ...map, [convId]: now };
  localStorage.setItem(READ_KEY, JSON.stringify(updated));

  // Persist to server (fire-and-forget — localStorage provides instant UX)
  void authedFetch('/api/admin/inbox/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: convId }),
  }).catch(() => { /* silent — localStorage is the fast path */ });
}

/** Merge server-side read state into localStorage on startup */
async function syncReadStateFromServer(): Promise<void> {
  try {
    const res = await fetch('/api/admin/inbox/mark-read', { cache: 'no-store' });
    if (!res.ok) return;
    const json = (await res.json()) as { data?: { readMap?: Record<string, string> } };
    const serverMap = json.data?.readMap ?? {};
    if (Object.keys(serverMap).length === 0) return;

    // Merge: take the latest timestamp from either source
    const localMap = getReadTimestamps();
    const merged = { ...localMap };
    for (const [convId, serverTs] of Object.entries(serverMap)) {
      const localTs = localMap[convId];
      if (!localTs || new Date(serverTs) > new Date(localTs)) {
        merged[convId] = serverTs;
      }
    }
    localStorage.setItem(READ_KEY, JSON.stringify(merged));
  } catch { /* silent — will use whatever localStorage has */ }
}

function applyReadTracking(convs: ChannelConversation[]): ChannelConversation[] {
  const readMap = getReadTimestamps();
  return convs.map((c) => {
    const lastReadAt = readMap[c.id];
    if (!lastReadAt) return c;
    const unread = c.messages.filter(
      (m) => m.direction === 'in' && (m.rawTimestamp ?? m.timestamp) > lastReadAt
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
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceState>>(new Map());
  const [gmailConnected, setGmailConnected] = useState(false);
  const [emailNextPageToken, setEmailNextPageToken] = useState<string | null>(null);
  const [emailFolder, setEmailFolderState] = useState('inbox');
  const [emailSearchQuery, setEmailSearchQuery] = useState('');

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
    !isDemoMode && (selectedChannel === 'whatsapp' || selectedChannel === 'email'),
    undefined,
    selectedChannel === 'email' ? 'email' : 'whatsapp',
  );

  const totalUnread = conversations.reduce((a, c) => a + c.unreadCount, 0);

  const emailApiParams = useMemo(() => {
    const params = new URLSearchParams({ folder: emailFolder });
    if (emailSearchQuery) params.set('q', emailSearchQuery);
    return params.toString();
  }, [emailFolder, emailSearchQuery]);

  // --- Data loading ---

  const loadLiveConversations = useCallback(async () => {
    setIsLoadingConvs(true);
    setConversationsError(null);
    try {
      const qp = businessOnly ? '' : '?business_only=false';

      // Fetch WhatsApp and email conversations in parallel
      const [waResponse, emailResponse] = await Promise.all([
        fetch(`/api/whatsapp/conversations${qp}`, { cache: 'no-store' }),
        fetch(`/api/admin/email/conversations?${emailApiParams}`, { cache: 'no-store' }).catch(() => null),
      ]);

      const waData = (await waResponse.json().catch(() => ({}))) as {
        conversations?: ChannelConversation[];
        error?: string;
      };
      if (!waResponse.ok) {
        throw new Error(waData.error || 'Failed to load conversations');
      }

      // Parse email conversations (non-blocking — email failure shouldn't break inbox)
      let emailConvs: ChannelConversation[] = [];
      if (emailResponse?.ok) {
        const emailData = (await emailResponse.json().catch(() => ({}))) as {
          data?: { conversations?: ChannelConversation[]; gmailConnected?: boolean; nextPageToken?: string | null };
        };
        emailConvs = emailData.data?.conversations ?? [];
        setGmailConnected(emailData.data?.gmailConnected ?? false);
        setEmailNextPageToken(emailData.data?.nextPageToken ?? null);
      }

      const rawConvs = [...(waData.conversations ?? []), ...emailConvs]
        .sort((a, b) => {
          const aLast = a.messages.at(-1);
          const bLast = b.messages.at(-1);
          const aTime = aLast?.rawTimestamp ?? aLast?.timestamp ?? '';
          const bTime = bLast?.rawTimestamp ?? bLast?.timestamp ?? '';
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
      const convs = applyReadTracking(rawConvs);

      setConversations(convs);
      setSelectedId((current) => current || convs[0]?.id || null);
    } catch (error) {
      setConversationsError(
        error instanceof Error ? error.message : 'Unable to load conversations right now.',
      );
    } finally {
      setIsLoadingConvs(false);
    }
  }, [businessOnly, emailApiParams]);

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
    // Sync server-side read state into localStorage before loading conversations,
    // so applyReadTracking has the merged timestamps from all devices.
    void syncReadStateFromServer().then(() => {
      void loadLiveConversations();
    });
    void loadWhatsAppHealth();
  }, [loadLiveConversations, loadWhatsAppHealth]);

  // Silent email-only refresh — merges fresh Gmail data without touching WhatsApp
  const refreshEmailConversations = useCallback(async () => {
    if (isDemoMode || !gmailConnected) return;
    try {
      const response = await fetch(`/api/admin/email/conversations?${emailApiParams}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as {
        data?: { conversations?: ChannelConversation[]; gmailConnected?: boolean };
      };
      const freshEmail = data.data?.conversations ?? [];
      setGmailConnected(data.data?.gmailConnected ?? false);

      setConversations((prev) => {
        const waConvs = prev.filter((c) => c.channel !== 'email');
        const merged = [...waConvs, ...freshEmail];
        return applyReadTracking(merged);
      });
    } catch {
      // Silent failure — email polling shouldn't disrupt inbox
    }
  }, [isDemoMode, gmailConnected, emailApiParams]);

  // Load more email threads (pagination)
  const loadMoreEmails = useCallback(async () => {
    if (!emailNextPageToken || !gmailConnected) return;
    try {
      const response = await fetch(`/api/admin/email/conversations?${emailApiParams}&pageToken=${encodeURIComponent(emailNextPageToken)}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as {
        data?: { conversations?: ChannelConversation[]; nextPageToken?: string | null };
      };
      const moreEmails = data.data?.conversations ?? [];
      setEmailNextPageToken(data.data?.nextPageToken ?? null);

      if (moreEmails.length > 0) {
        setConversations((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newOnes = moreEmails.filter((c) => !existingIds.has(c.id));
          return applyReadTracking([...prev, ...newOnes]);
        });
      }
    } catch {
      // Silent — pagination failure shouldn't disrupt inbox
    }
  }, [emailNextPageToken, gmailConnected, emailApiParams]);

  // Poll Gmail every 60 seconds — only when page is visible (saves API quota)
  useEffect(() => {
    if (isDemoMode || !gmailConnected) return;
    const tick = () => {
      if (document.visibilityState === 'visible') {
        void refreshEmailConversations();
      }
    };
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [isDemoMode, gmailConnected, refreshEmailConversations]);

  useEffect(() => {
    if (isDemoMode) return;
    const tick = () => {
      if (document.visibilityState === 'visible') {
        void loadLiveConversations();
        void loadWhatsAppHealth();
      }
    };
    const interval = setInterval(tick, 15_000);
    return () => clearInterval(interval);
  }, [isDemoMode, loadLiveConversations, loadWhatsAppHealth]);

  useEffect(() => {
    if (isDemoMode) return;

    const channel = supabase
      .channel('inbox-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_connections' },
        () => {
          void loadWhatsAppHealth();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_presence' },
        (payload) => {
          const row = payload.new as { wa_id?: string; presence?: string; last_seen_at?: string | null } | undefined;
          if (row?.wa_id) {
            setPresenceMap((prev) => {
              const next = new Map(prev);
              next.set(row.wa_id!, {
                presence: row.presence ?? 'unavailable',
                lastSeenAt: row.last_seen_at ?? null,
              });
              return next;
            });
          }
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

    const conv = conversations.find((c) => c.id === id);

    // Lazy intent classification — classify on first select if no intent yet
    if (conv && !conv.intent) {
      const lastInbound = [...conv.messages].reverse().find((m) => m.direction === 'in');
      const textToClassify = lastInbound?.body || lastInbound?.subject;
      if (textToClassify && textToClassify.length > 3) {
        void (async () => {
          try {
            const res = await authedFetch('/api/admin/classify-intent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: textToClassify }),
            });
            const json = await res.json().catch(() => ({})) as { data?: { intent?: string } };
            const intent = json.data?.intent;
            if (intent && intent !== 'general') {
              setConversations((prev) =>
                prev.map((c) => (c.id === id ? { ...c, intent } : c))
              );
            }
          } catch { /* silent — classification is non-critical */ }
        })();
      }
    }

    // Mark email thread as read in Gmail (fire-and-forget)
    if (conv?.channel === 'email' && conv.unreadCount > 0) {
      const emailConv = conv as ChannelConversation & { threadId?: string };
      if (emailConv.threadId) {
        void authedFetch('/api/admin/email/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: emailConv.threadId }),
        }).catch(() => { /* silent — local read state already updated */ });
      }
    }
  }

  async function handleTakeOverChatbot(session: ChatbotSessionSummary) {
    setIsTakingOverChatbot(true);
    try {
      const response = await authedFetch(`/api/whatsapp/chatbot-sessions/${session.id}`, {
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
      const response = await authedFetch(`/api/whatsapp/proposal-drafts/${draftId}`, {
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

  async function handleSendMessage(convId: string, message: string, subject?: string, files?: File[], ccBcc?: { cc?: string; bcc?: string }): Promise<boolean> {
    const conversation = conversations.find((item) => item.id === convId);
    if (!conversation) return false;

    if (conversation.channel === 'email') {
      const isCompose = convId.startsWith('compose_email_');

      if (isCompose && !conversation.contact.email) {
        toast.error('Enter a recipient email address');
        return false;
      }

      const optimisticId = `pending_email_${Date.now()}`;
      const optimisticMsg: Message = {
        id: optimisticId,
        type: 'text',
        direction: 'out',
        body: message,
        subject,
        timestamp: formatLocalTime(new Date(), timezone),
        status: 'pending',
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, optimisticMsg] } : c)),
      );

      try {
        // Extract thread metadata for replies
        const emailConv = conversation as ChannelConversation & {
          threadId?: string;
          lastMessageIdHeader?: string | null;
        };

        // Convert files to base64 for API
        let attachmentPayload: Array<{ filename: string; content: string; contentType: string }> | undefined;
        if (files && files.length > 0) {
          attachmentPayload = await Promise.all(
            files.map(async (f) => {
              const buffer = await f.arrayBuffer();
              const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
              return { filename: f.name, content: base64, contentType: f.type || 'application/octet-stream' };
            }),
          );
        }

        const response = await authedFetch('/api/admin/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: conversation.contact.email ?? '',
            cc: ccBcc?.cc,
            bcc: ccBcc?.bcc,
            subject: subject ?? '',
            body: message,
            threadId: emailConv.threadId,
            inReplyTo: emailConv.lastMessageIdHeader,
            attachments: attachmentPayload,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          data?: { message?: Message };
          error?: string;
        };

        if (!response.ok || !payload.data?.message) {
          throw new Error(payload.error || 'Failed to send email');
        }

        const sentMsg = payload.data.message;

        if (isCompose) {
          // Remove compose draft — real thread will appear after refresh
          setConversations((prev) => prev.filter((c) => c.id !== convId));
          setSelectedId(null);
          toast.success('Email sent');
        } else {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, messages: c.messages.map((m) => (m.id === optimisticId ? sentMsg : m)) }
                : c,
            ),
          );
        }
        onSendMessage?.(convId, message);
        // Refresh email threads after a short delay so Gmail reflects the sent message
        setTimeout(() => { void refreshEmailConversations(); }, 3_000);
        return true;
      } catch (error) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.filter((m) => m.id !== optimisticId) }
              : c,
          ),
        );
        toast.error(error instanceof Error ? error.message : 'Failed to send email');
        return false;
      }
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
      const response = await authedFetch('/api/whatsapp/send', {
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

  const COMPOSE_ID_PREFIX = 'compose_email_';

  function setEmailFolder(folder: string) {
    setEmailFolderState(folder);
    setEmailNextPageToken(null);
  }

  function searchEmails(query: string) {
    setEmailSearchQuery(query);
    setEmailNextPageToken(null);
    // Trigger re-fetch by updating state — loadLiveConversations depends on emailSearchQuery
  }

  function startNewEmail() {
    const composeId = `${COMPOSE_ID_PREFIX}${Date.now()}`;
    const composeConv: ChannelConversation = {
      id: composeId,
      channel: 'email',
      unreadCount: 0,
      contact: {
        id: `compose_contact_${Date.now()}`,
        name: 'New Email',
        phone: '',
        type: 'client',
        email: '',
      },
      messages: [],
    };

    setConversations((prev) => [composeConv, ...prev]);
    setSelectedId(composeId);
  }

  function updateComposeRecipient(email: string) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId && c.id.startsWith(COMPOSE_ID_PREFIX)
          ? {
              ...c,
              contact: {
                ...c.contact,
                name: email || 'New Email',
                email,
              },
            }
          : c,
      ),
    );
  }

  async function deleteEmail(conversationId: string) {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    // Optimistic removal
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (selectedId === conversationId) setSelectedId(null);

    try {
      const threadId = conv.id.replace('email_', '');
      const res = await authedFetch('/api/admin/email/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: threadId, action: 'delete' }),
      });
      if (!res.ok) {
        toast.error('Failed to delete email');
        void loadLiveConversations(); // revert
      } else {
        toast.success('Email moved to trash');
      }
    } catch {
      toast.error('Failed to delete email');
      void loadLiveConversations(); // revert
    }
  }

  async function archiveEmail(conversationId: string) {
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    // Optimistic removal
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (selectedId === conversationId) setSelectedId(null);

    try {
      const threadId = conv.id.replace('email_', '');
      const res = await authedFetch('/api/admin/email/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: threadId, action: 'archive' }),
      });
      if (!res.ok) {
        toast.error('Failed to archive email');
        void loadLiveConversations(); // revert
      } else {
        toast.success('Email archived');
      }
    } catch {
      toast.error('Failed to archive email');
      void loadLiveConversations(); // revert
    }
  }

  return {
    conversations,
    selectedId,
    selectedConversation,
    selectedChannel,
    isLoadingConvs,
    conversationsError,
    totalUnread,
    presenceMap,
    whatsAppStatus,
    whatsAppHealthError,
    gmailConnected,
    emailNextPageToken,
    emailFolder,
    setEmailFolder,
    searchEmails,
    loadMoreEmails,
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
    startNewEmail,
    updateComposeRecipient,
    deleteEmail,
    archiveEmail,
  };
}
