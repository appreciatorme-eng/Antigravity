export type ActionMode = "itinerary" | "payment" | "driver" | "location" | "send-document" | "send-location" | "send-poll";

export type ContactType = "client" | "driver" | "lead";

export type ChatbotState = "new" | "qualifying" | "proposal_ready" | "handed_off";

export interface ChatbotSessionSummary {
  id: string;
  state: ChatbotState;
  aiReplyCount: number;
  updatedAt: string;
  proposalDraftId?: string | null;
  proposalDraftStatus?: string | null;
}

export interface ConversationContact {
  id: string;
  name: string;
  phone: string;
  type: ContactType;
  avatar?: string;
  avatarColor?: string;
  email?: string;
  lastSeen?: string;
  isOnline?: boolean;
  trip?: string;
  label?: "lead" | "payment" | "location" | "confirmed";
  preferredLanguage?: "en" | "hi" | "hinglish";
  isPersonal?: boolean;
}
