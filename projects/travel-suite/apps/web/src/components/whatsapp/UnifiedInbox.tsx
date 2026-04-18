'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoMode } from '@/lib/demo/demo-mode-context';
import { AlertTriangle, X } from 'lucide-react';
import { ErrorSection } from '@/components/ui/ErrorSection';
import { InboxSkeleton } from '@/components/ui/skeletons/InboxSkeleton';
import { InboxShellBone } from '@/components/ui/skeletons/InboxShellBone';
import { type WhatsAppTemplate } from '@/lib/whatsapp/india-templates';
import { UnifiedInboxContextPanel } from './UnifiedInboxContextPanel';
import { useInboxData } from './useInboxData';
import { ConversationListPanel } from './ConversationListPanel';
import { ThreadPane } from './ThreadPane';
import { InboxModals } from './InboxModals';
import { ClientFormModal } from '@/app/clients/components/ClientFormModal';
import { useClientForm } from '@/app/clients/hooks/useClientForm';

// ---- TYPES ----

type MobileView = 'list' | 'thread' | 'context';

// ---- MAIN UNIFIED INBOX ----

interface UnifiedInboxProps {
  onSendMessage?: (convId: string, message: string) => void;
  pendingTemplate?: WhatsAppTemplate | null;
  onClearPendingTemplate?: () => void;
  onUnreadChange?: (count: number) => void;
}

export function UnifiedInbox({ onSendMessage, pendingTemplate, onClearPendingTemplate, onUnreadChange }: UnifiedInboxProps) {
  const router = useRouter();
  const { isDemoMode } = useDemoMode();
  const [quickSendText, setQuickSendText] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false);

  const inbox = useInboxData({ onSendMessage });

  // Client form for "Add to CRM" action — reuses the full client form from /clients page
  const clientForm = useClientForm({
    onSaved: async () => {
      inbox.setAddToCrmModal({ open: false, phone: '', name: '' });
      clientForm.setModalOpen(false);
      void inbox.loadLiveConversations();
    },
  });

  // Sync: when inbox triggers add-to-crm, open the client form with pre-filled data
  const prevCrmRef = useRef(false);
  useEffect(() => {
    if (inbox.addToCrmModal.open && !prevCrmRef.current) {
      clientForm.resetForm();
      clientForm.setFormData((prev) => ({
        ...prev,
        phone: inbox.addToCrmModal.phone,
        full_name: inbox.addToCrmModal.name,
        sourceChannel: 'whatsapp',
        lifecycleStage: 'lead',
      }));
      clientForm.setModalOpen(true);
    }
    prevCrmRef.current = inbox.addToCrmModal.open;
  }, [inbox.addToCrmModal, clientForm]);

  // Sync local unread count to parent
  const stableOnUnreadChange = useCallback(
    (count: number) => onUnreadChange?.(count),
    [onUnreadChange],
  );
  useEffect(() => {
    stableOnUnreadChange(inbox.totalUnread);
  }, [inbox.totalUnread, stableOnUnreadChange]);

  const isDisconnected = !isDemoMode && inbox.whatsAppStatus !== 'connected';

  // On mobile, selecting a conversation switches to thread view
  const handleMobileSelect = useCallback((id: string) => {
    inbox.handleSelect(id);
    setMobileView('thread');
  }, [inbox]);

  const handleMobileBack = useCallback(() => {
    setMobileView('list');
  }, []);

  const handleOpenContextDrawer = useCallback(() => {
    setContextDrawerOpen(true);
  }, []);

  if (inbox.isLoadingConvs && !isDemoMode && inbox.conversations.length === 0) {
    return <InboxShellBone loading fallback={<InboxSkeleton />} />;
  }

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      {/* Global WhatsApp disconnected banner */}
      {isDisconnected && (
        <div className="absolute inset-x-2 md:inset-x-4 top-2 md:top-4 z-20 flex items-center justify-between gap-2 md:gap-4 rounded-2xl border border-amber-300/25 bg-amber-500/10 px-3 md:px-4 py-2 md:py-3 backdrop-blur">
          <div className="flex items-start gap-2 md:gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="text-xs md:text-sm font-semibold text-amber-100">WhatsApp disconnected</p>
              <p className="text-[10px] md:text-xs text-amber-100/75 hidden sm:block">
                {inbox.whatsAppHealthError || 'Reconnect your session in Settings to resume live replies.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              router.push('/settings');
            }}
            className="shrink-0 rounded-xl border border-amber-200/20 bg-amber-100/10 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold text-amber-50 transition hover:bg-amber-100/20 active:scale-[0.98]"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* LEFT: Conversation List — full-width on mobile, fixed-width on desktop */}
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex min-h-0 w-full md:w-[280px] shrink-0 flex-col overflow-hidden`}>
        <ConversationListPanel
          conversations={inbox.conversations}
          selectedId={inbox.selectedId}
          isLoadingConvs={inbox.isLoadingConvs}
          conversationsError={inbox.conversationsError}
          isDemoMode={isDemoMode}
          isDisconnected={isDisconnected}
          businessOnly={inbox.businessOnly}
          gmailConnected={inbox.gmailConnected}
          onBusinessOnlyChange={inbox.setBusinessOnly}
          onSelect={handleMobileSelect}
          onRetry={() => { void inbox.loadLiveConversations(); }}
          onConnectWhatsApp={() => inbox.setIsWaConnectOpen(true)}
          onNewEmail={inbox.startNewEmail}
          emailNextPageToken={inbox.emailNextPageToken}
          emailFolder={inbox.emailFolder}
          onEmailFolderChange={inbox.setEmailFolder}
          onLoadMoreEmails={() => { void inbox.loadMoreEmails(); }}
          onEmailSearch={inbox.searchEmails}
        />
      </div>

      {/* MIDDLE: Message Thread — full-width on mobile, flex on desktop */}
      <div className={`${mobileView === 'thread' ? 'flex' : 'hidden'} md:flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden`}>
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
          contactPresence={(() => {
            const waId = inbox.selectedConversation?.contact.phone.replace(/\D/g, '') ?? '';
            return inbox.presenceMap.get(waId)?.presence ?? null;
          })()}
          onContextAction={inbox.handleContextAction}
          onRecipientChange={inbox.updateComposeRecipient}
          onDeleteEmail={inbox.deleteEmail}
          onArchiveEmail={inbox.archiveEmail}
          quickSendText={quickSendText}
          onQuickSendConsumed={() => setQuickSendText(null)}
          onBack={handleMobileBack}
          onOpenContext={handleOpenContextDrawer}
        />
      </div>

      {/* RIGHT: Context Panel — hidden on mobile, slide-over drawer instead */}
      <div
        className={`hidden md:flex w-[240px] shrink-0 border-l border-white/10 overflow-hidden flex-col ${
          isDisconnected ? 'pt-20' : ''
        }`}
        style={{ background: 'rgba(10,22,40,0.6)' }}
      >
        <ErrorSection label="Inbox context panel">
          <UnifiedInboxContextPanel
            conversation={inbox.selectedConversation}
            onContextAction={inbox.handleContextAction}
            onQuickSend={setQuickSendText}
          />
        </ErrorSection>
      </div>

      {/* Mobile context drawer overlay */}
      {contextDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setContextDrawerOpen(false)}
          />
          <div
            className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[320px] md:hidden flex flex-col overflow-hidden border-l border-white/10 animate-in slide-in-from-right duration-200"
            style={{ background: 'rgba(10,22,40,0.98)', backdropFilter: 'blur(20px)' }}
          >
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-sm font-bold text-white">Contact Details</p>
              <button
                onClick={() => setContextDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Close contact details"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ErrorSection label="Inbox context panel">
                <UnifiedInboxContextPanel
                  conversation={inbox.selectedConversation}
                  onContextAction={(action, tripName) => {
                    setContextDrawerOpen(false);
                    inbox.handleContextAction(action, tripName);
                  }}
                  onQuickSend={(text) => {
                    setContextDrawerOpen(false);
                    setQuickSendText(text);
                  }}
                />
              </ErrorSection>
            </div>
          </div>
        </>
      )}

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

      {/* Add to CRM modal — reuses full client form */}
      <ClientFormModal
        isOpen={clientForm.modalOpen}
        onClose={() => {
          clientForm.setModalOpen(false);
          inbox.setAddToCrmModal({ open: false, phone: '', name: '' });
        }}
        formData={clientForm.formData}
        onFormChange={clientForm.setFormData}
        editingClientId={clientForm.editingClientId}
        saving={clientForm.saving}
        formError={clientForm.formError}
        onSave={clientForm.handleSaveClient}
      />
    </div>
  );
}
