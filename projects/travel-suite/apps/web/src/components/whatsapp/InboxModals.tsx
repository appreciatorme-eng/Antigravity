'use client';

import { toast } from 'sonner';
import type { ChannelConversation, ChannelType } from './inbox-mock-data';
import type { ActionMode } from './whatsapp.types';
import { ActionPickerModal } from './ActionPickerModal';
import { ContextActionModal, type ContextActionType } from './ContextActionModal';
import { WhatsAppConnectModal } from './WhatsAppConnectModal';

interface InboxModalsProps {
  selectedConversation: ChannelConversation | null;
  selectedChannel: ChannelType;
  ctxActionModal: ActionMode | null;
  contextModal: { type: ContextActionType; tripName?: string; waId?: string } | null;
  isWaConnectOpen: boolean;
  onSendMessage: (convId: string, message: string, subject?: string) => Promise<boolean>;
  onCloseCtxAction: () => void;
  onCloseContextModal: () => void;
  onCloseWaConnect: () => void;
}

export function InboxModals({
  selectedConversation,
  selectedChannel,
  ctxActionModal,
  contextModal,
  isWaConnectOpen,
  onSendMessage,
  onCloseCtxAction,
  onCloseContextModal,
  onCloseWaConnect,
}: InboxModalsProps) {
  return (
    <>
      {/* Context Panel -> ActionPickerModal (Driver / Payment) */}
      {selectedConversation && ctxActionModal && (
        <ActionPickerModal
          isOpen
          mode={ctxActionModal}
          contact={selectedConversation.contact}
          channel={selectedChannel}
          onSend={(msg, subject) => {
            return onSendMessage(selectedConversation.id, msg, subject).then((sent) => {
              if (sent) {
                const labels: Record<ActionMode, string> = {
                  itinerary: 'Itinerary',
                  payment: 'Payment request',
                  driver: 'Driver details',
                  location: 'Location request',
                  'send-document': 'Document',
                  'send-location': 'Location pin',
                  'send-poll': 'Poll',
                };
                toast.success(`${labels[ctxActionModal]} sent to ${selectedConversation.contact.name}`);
              }
              return sent;
            });
          }}
          onClose={onCloseCtxAction}
        />
      )}

      {/* Context Panel -> ContextActionModal (Trip / Quote / Create) */}
      {selectedConversation && contextModal && (
        <ContextActionModal
          isOpen
          type={contextModal.type}
          tripName={contextModal.tripName}
          waId={contextModal.waId}
          contact={selectedConversation.contact}
          channel={selectedChannel}
          onSendMessage={(msg, subject) => {
            return onSendMessage(selectedConversation.id, msg, subject).then((sent) => {
              if (sent) {
                onCloseContextModal();
              }
              return sent;
            });
          }}
          onClose={onCloseContextModal}
        />
      )}

      {/* WhatsApp QR Connect */}
      <WhatsAppConnectModal
        isOpen={isWaConnectOpen}
        onClose={onCloseWaConnect}
        onConnected={onCloseWaConnect}
      />
    </>
  );
}
