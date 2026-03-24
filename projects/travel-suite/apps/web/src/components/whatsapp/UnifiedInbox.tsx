'use client';

import { useRouter } from 'next/navigation';
import { useDemoMode } from '@/lib/demo/demo-mode-context';
import { AlertTriangle } from 'lucide-react';
import { ErrorSection } from '@/components/ui/ErrorSection';
import { InboxSkeleton } from '@/components/ui/skeletons/InboxSkeleton';
import { type WhatsAppTemplate } from '@/lib/whatsapp/india-templates';
import { UnifiedInboxContextPanel } from './UnifiedInboxContextPanel';
import { useInboxData } from './useInboxData';
import { ConversationListPanel } from './ConversationListPanel';
import { ThreadPane } from './ThreadPane';
import { InboxModals } from './InboxModals';

// ---- MAIN UNIFIED INBOX ----

interface UnifiedInboxProps {
  onSendMessage?: (convId: string, message: string) => void;
  pendingTemplate?: WhatsAppTemplate | null;
  onClearPendingTemplate?: () => void;
}

export function UnifiedInbox({ onSendMessage, pendingTemplate, onClearPendingTemplate }: UnifiedInboxProps) {
  const router = useRouter();
  const { isDemoMode } = useDemoMode();

  const inbox = useInboxData({ onSendMessage });

  const isDisconnected = !isDemoMode && inbox.whatsAppStatus !== 'connected';

  if (inbox.isLoadingConvs && !isDemoMode && inbox.conversations.length === 0) {
    return <InboxSkeleton />;
  }

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Global WhatsApp disconnected banner */}
      {isDisconnected && (
        <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 backdrop-blur">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-amber-100">WhatsApp disconnected</p>
              <p className="text-xs text-amber-100/75">
                {inbox.whatsAppHealthError || 'Reconnect your session in Settings to resume live replies.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              router.push('/settings');
            }}
            className="shrink-0 rounded-xl border border-amber-200/20 bg-amber-100/10 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-100/20 active:scale-[0.98]"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* LEFT: Conversation List */}
      <ConversationListPanel
        conversations={inbox.conversations}
        selectedId={inbox.selectedId}
        isLoadingConvs={inbox.isLoadingConvs}
        conversationsError={inbox.conversationsError}
        isDemoMode={isDemoMode}
        isDisconnected={isDisconnected}
        totalUnread={inbox.totalUnread}
        businessOnly={inbox.businessOnly}
        onBusinessOnlyChange={inbox.setBusinessOnly}
        onSelect={inbox.handleSelect}
        onRetry={() => { void inbox.loadLiveConversations(); }}
        onConnectWhatsApp={() => inbox.setIsWaConnectOpen(true)}
      />

      {/* MIDDLE: Message Thread */}
      <ThreadPane
        selectedConversation={inbox.selectedConversation}
        selectedChannel={inbox.selectedChannel}
        isDemoMode={isDemoMode}
        whatsAppStatus={inbox.whatsAppStatus}
        showChatbotBanner={inbox.showChatbotBanner}
        activeChatbotSession={inbox.activeChatbotSession}
        isTakingOverChatbot={inbox.isTakingOverChatbot}
        isRefreshingProposalDraft={inbox.isRefreshingProposalDraft}
        onTakeOverChatbot={inbox.handleTakeOverChatbot}
        onOpenProposalDraft={inbox.handleOpenProposalDraft}
        onRefreshProposalDraft={inbox.handleRefreshProposalDraft}
        pendingTemplate={pendingTemplate}
        onClearPendingTemplate={onClearPendingTemplate}
        onSendMessage={inbox.handleSendMessage}
        smartReplySuggestions={inbox.smartReplySuggestions}
        smartReplyLoading={inbox.smartReplyLoading}
        onRefreshSmartReplies={() => { void inbox.refreshSmartReplySuggestions(); }}
      />

      {/* RIGHT: Context Panel */}
      <div
        className={`w-[240px] shrink-0 border-l border-white/10 overflow-hidden flex flex-col ${
          isDisconnected ? 'pt-20' : ''
        }`}
        style={{ background: 'rgba(10,22,40,0.6)' }}
      >
        <ErrorSection label="Inbox context panel">
          <UnifiedInboxContextPanel
            conversation={inbox.selectedConversation}
            onContextAction={inbox.handleContextAction}
          />
        </ErrorSection>
      </div>

      {/* Modals */}
      <InboxModals
        selectedConversation={inbox.selectedConversation}
        selectedChannel={inbox.selectedChannel}
        ctxActionModal={inbox.ctxActionModal}
        contextModal={inbox.contextModal}
        isWaConnectOpen={inbox.isWaConnectOpen}
        onSendMessage={inbox.handleSendMessage}
        onCloseCtxAction={() => inbox.setCtxActionModal(null)}
        onCloseContextModal={() => inbox.setContextModal(null)}
        onCloseWaConnect={() => inbox.setIsWaConnectOpen(false)}
      />
    </div>
  );
}
