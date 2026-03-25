'use client';

import { useAnalytics } from '@/lib/analytics/events';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassCard } from '@/components/glass/GlassCard';
import { AlertTriangle, FileText, RefreshCw, X } from 'lucide-react';
import { ErrorSection } from '@/components/ui/ErrorSection';
import { MessageThread } from './MessageThread';
import type { ChannelConversation, ChannelType } from './inbox-mock-data';
import type { ChatbotSessionSummary } from './whatsapp.types';
import type { WhatsAppTemplate } from '@/lib/whatsapp/india-templates';
import type { WhatsAppStatus } from './useInboxData';
import type { ContextAction } from './unified-inbox-shared';

interface ThreadPaneProps {
  selectedConversation: ChannelConversation | null;
  selectedChannel: ChannelType;
  isDemoMode: boolean;
  whatsAppStatus: WhatsAppStatus;

  // Chatbot banner
  showChatbotBanner: boolean;
  activeChatbotSession: ChatbotSessionSummary | null;
  isTakingOverChatbot: boolean;
  isRefreshingProposalDraft: boolean;
  onTakeOverChatbot: (session: ChatbotSessionSummary) => Promise<void>;
  onOpenProposalDraft: (draftId: string) => void;
  onRefreshProposalDraft: (draftId: string) => Promise<void>;

  // Template
  pendingTemplate?: WhatsAppTemplate | null;
  onClearPendingTemplate?: () => void;

  // Message sending
  onSendMessage: (convId: string, message: string, subject?: string) => Promise<boolean>;

  // Smart replies
  smartReplySuggestions: string[];
  smartReplyLoading: boolean;
  onRefreshSmartReplies: () => void;

  // Presence
  contactPresence?: string | null;

  // Context actions (create proposal, etc.)
  onContextAction?: (action: ContextAction, tripName?: string) => void;
}

export function ThreadPane({
  selectedConversation,
  selectedChannel,
  isDemoMode,
  whatsAppStatus,
  showChatbotBanner,
  activeChatbotSession,
  isTakingOverChatbot,
  isRefreshingProposalDraft,
  onTakeOverChatbot,
  onOpenProposalDraft,
  onRefreshProposalDraft,
  pendingTemplate,
  onClearPendingTemplate,
  onSendMessage,
  smartReplySuggestions,
  smartReplyLoading,
  onRefreshSmartReplies,
  contactPresence,
  onContextAction,
}: ThreadPaneProps) {
  const analytics = useAnalytics();
  const isDisconnected = !isDemoMode && whatsAppStatus !== 'connected';

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden min-h-0 ${isDisconnected ? 'pt-20' : ''}`}
      style={{
        background:
          'radial-gradient(ellipse at top, rgba(37,211,102,0.04) 0%, rgba(10,22,40,0.5) 60%)',
      }}
    >
      {/* WhatsApp disconnected banner (thread-level) */}
      {!isDemoMode && selectedChannel === 'whatsapp' && whatsAppStatus !== 'connected' && (
        <div className="shrink-0 flex items-center justify-between gap-4 border-b border-amber-400/20 bg-amber-500/10 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-amber-200">
                {whatsAppStatus === 'pending'
                  ? 'Finish linking WhatsApp to send replies'
                  : 'WhatsApp is not connected'}
              </p>
              <p className="text-xs text-amber-100/75">
                Thread replies will stay local until the session is connected.
              </p>
            </div>
          </div>
          <a
            href="/settings?tab=integrations"
            className="shrink-0 rounded-lg border border-amber-300/30 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-300/10"
          >
            Open settings
          </a>
        </div>
      )}

      {/* Pending template banner */}
      {pendingTemplate && (
        <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-[#25D366]/10 border-b border-[#25D366]/20">
          <span className="text-base shrink-0">{pendingTemplate.emoji ?? '📋'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#25D366] truncate">Template ready: {pendingTemplate.name}</p>
            <p className="text-[11px] text-slate-400">
              {selectedConversation ? 'Template pre-filled below — edit variables and send' : 'Select a conversation to apply this template'}
            </p>
          </div>
          <button
            onClick={onClearPendingTemplate}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      )}

      {/* Chatbot banner */}
      {showChatbotBanner && activeChatbotSession ? (
        <div className="shrink-0 px-4 py-3 border-b border-white/10">
          <GlassCard
            padding="md"
            rounded="lg"
            opacity="low"
            className="border border-violet-400/30 bg-violet-500/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-violet-100">
                  🤖 AI is handling this conversation
                </p>
                <p className="mt-1 text-xs leading-5 text-violet-100/80">
                  {activeChatbotSession.state === 'proposal_ready'
                    ? `The assistant gathered trip details and is waiting for a human follow-up. ${activeChatbotSession.aiReplyCount} AI replies sent.${activeChatbotSession.proposalDraftId ? ' A proposal draft is ready to review.' : ''}`
                    : `${activeChatbotSession.aiReplyCount} AI replies sent so far. Take over to stop further automated replies.`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {activeChatbotSession.proposalDraftId ? (
                  <div className="flex items-center gap-2">
                    <GlassButton
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-violet-300/40 text-violet-100 hover:bg-violet-200/10"
                      onClick={() => onOpenProposalDraft(activeChatbotSession.proposalDraftId ?? '')}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Open Draft
                    </GlassButton>
                    <GlassButton
                      type="button"
                      size="sm"
                      variant="outline"
                      loading={isRefreshingProposalDraft}
                      className="border-violet-300/40 text-violet-100 hover:bg-violet-200/10"
                      onClick={() => onRefreshProposalDraft(activeChatbotSession.proposalDraftId ?? '')}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </GlassButton>
                  </div>
                ) : null}
                <GlassButton
                  type="button"
                  size="sm"
                  variant="outline"
                  loading={isTakingOverChatbot}
                  className="shrink-0 border-violet-300/40 text-violet-100 hover:bg-violet-200/10"
                  onClick={() => onTakeOverChatbot(activeChatbotSession)}
                >
                  Take Over
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : null}

      {/* Message thread */}
      <ErrorSection label="Inbox message thread">
        <MessageThread
          conversation={selectedConversation}
          channel={selectedChannel}
          onSendMessage={onSendMessage}
          externalInput={selectedConversation && pendingTemplate ? pendingTemplate.body : undefined}
          onExternalInputConsumed={onClearPendingTemplate}
          smartReplies={smartReplySuggestions}
          smartRepliesLoading={smartReplyLoading}
          onUseSmartReply={() => analytics.aiSuggestionUsed('reply')}
          onRefreshSmartReplies={onRefreshSmartReplies}
          contactPresence={contactPresence}
          onContextAction={onContextAction}
        />
      </ErrorSection>
    </div>
  );
}
