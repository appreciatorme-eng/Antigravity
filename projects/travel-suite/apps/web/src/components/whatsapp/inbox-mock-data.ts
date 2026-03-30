// WhatsApp + Email conversation types for TripBuilt inbox.

import type { Conversation } from './MessageThread';
import type { ChatbotSessionSummary } from './whatsapp.types';

export type ChannelType = 'whatsapp' | 'email';

export interface ChannelConversation extends Conversation {
  channel: ChannelType;
  chatbotSession?: ChatbotSessionSummary | null;
  intent?: string;
}

export const ALL_MOCK_CONVERSATIONS: ChannelConversation[] = [];

export const MOCK_CLIENT_DETAILS: Record<string, {
  email: string;
  trips: number;
  ltv: string;
  firstContact: string;
  source: string;
}> = {};

export const MOCK_DRIVER_DETAILS: Record<string, {
  vehicle: string;
  phone: string;
  rating: number;
  trips: number;
}> = {};
