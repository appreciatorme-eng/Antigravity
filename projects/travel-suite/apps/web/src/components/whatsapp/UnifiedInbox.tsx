'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoMode } from '@/lib/demo/demo-mode-context';
import { AlertTriangle, Download, Loader2, X } from 'lucide-react';
import { ErrorSection } from '@/components/ui/ErrorSection';
import { InboxSkeleton } from '@/components/ui/skeletons/InboxSkeleton';
import { type WhatsAppTemplate } from '@/lib/whatsapp/india-templates';
import { UnifiedInboxContextPanel } from './UnifiedInboxContextPanel';
import { useInboxData } from './useInboxData';
import { ConversationListPanel } from './ConversationListPanel';
import { ThreadPane } from './ThreadPane';
import { InboxModals } from './InboxModals';
import { ClientFormModal } from '@/app/clients/components/ClientFormModal';
import { useClientForm } from '@/app/clients/hooks/useClientForm';

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

  // History import banner state
  const [showImportBanner, setShowImportBanner] = useState(false);
  const [importingHistory, setImportingHistory] = useState(false);
  const importCheckedRef = useRef(false);

  useEffect(() => {
    if (isDemoMode || importCheckedRef.current) return;
    importCheckedRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/whatsapp/import-history');
        if (!res.ok) return;
        const data = await res.json() as { connected: boolean; historyImported: boolean };
        if (data.connected && !data.historyImported) {
          setShowImportBanner(true);
        }
      } catch { /* silent */ }
    })();
  }, [isDemoMode]);

  async function handleImportFromBanner() {
    setImportingHistory(true);
    try {
      const res = await fetch('/api/admin/whatsapp/relink', { method: 'POST' });
      if (res.ok) {
        // Open the WhatsApp connect modal for QR scan
        inbox.setIsWaConnectOpen(true);
        setShowImportBanner(false);
      }
    } catch { /* silent */ }
    setImportingHistory(false);
  }

  const isDisconnected = !isDemoMode && inbox.whatsAppStatus !== 'connected';

  if (inbox.isLoadingConvs && !isDemoMode && inbox.conversations.length === 0) {
    return <InboxSkeleton />;
  }

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden">
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

      {/* Import history banner — shown when connected but history not yet imported */}
      {showImportBanner && !isDisconnected && (
        <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-blue-300/25 bg-blue-500/10 px-4 py-3 backdrop-blur">
          <div className="flex items-start gap-3">
            <Download className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
            <div>
              <p className="text-sm font-semibold text-blue-100">
                Import your WhatsApp conversations
              </p>
              <p className="text-xs text-blue-100/75">
                Re-link your WhatsApp to bring in existing chats. Quick QR scan — takes 10 seconds.
              </p>
            </div>
          </div>
          {(
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { void handleImportFromBanner(); }}
                disabled={importingHistory}
                className="shrink-0 rounded-xl border border-blue-200/20 bg-blue-100/10 px-3 py-2 text-xs font-semibold text-blue-50 transition hover:bg-blue-100/20 active:scale-[0.98] disabled:opacity-50"
              >
                {importingHistory ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Importing...
                  </span>
                ) : (
                  'Re-link & Import'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowImportBanner(false)}
                className="shrink-0 rounded-lg p-1 text-blue-300 hover:bg-blue-100/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
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
        contactPresence={(() => {
          const waId = inbox.selectedConversation?.contact.phone.replace(/\D/g, '') ?? '';
          return inbox.presenceMap.get(waId)?.presence ?? null;
        })()}
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
