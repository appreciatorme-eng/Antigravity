export type ActionMode = "itinerary" | "payment" | "driver" | "location";

export type ContactType = "client" | "driver" | "lead";

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
}
