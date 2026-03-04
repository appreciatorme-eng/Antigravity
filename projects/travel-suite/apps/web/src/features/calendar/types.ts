import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Calendar Command Center — data types
// ---------------------------------------------------------------------------

export type CalendarEventType =
  | "trip"
  | "invoice"
  | "payment"
  | "proposal"
  | "social_post"
  | "concierge"
  | "personal";

export type CalendarViewMode = "month" | "week" | "day";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";

// ---------------------------------------------------------------------------
// Core event model
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string | null;
  status: string;
  statusVariant: BadgeVariant;
  amount: number | null;
  currency: string | null;
  href: string;
  drillHref: string | null;
  entityData:
    | TripEventData
    | InvoiceEventData
    | ProposalEventData
    | PaymentEventData
    | SocialPostEventData
    | ConciergeEventData
    | PersonalEventData;
}

// ---------------------------------------------------------------------------
// Entity-specific payloads
// ---------------------------------------------------------------------------

export interface TripEventData {
  type: "trip";
  clientName: string;
  clientId: string | null;
  destination: string | null;
  tripTitle: string | null;
  durationDays: number | null;
}

export interface InvoiceEventData {
  type: "invoice";
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  tripId: string | null;
}

export interface ProposalEventData {
  type: "proposal";
  clientName: string;
  clientId: string;
  totalPrice: number | null;
  viewedAt: string | null;
  expiresAt: string | null;
}

export interface PaymentEventData {
  type: "payment";
  invoiceId: string;
  invoiceNumber: string;
  method: string | null;
  reference: string | null;
}

export interface SocialPostEventData {
  type: "social_post";
  caption: string | null;
  platform: string | null;
  templateId: string | null;
}

export interface ConciergeEventData {
  type: "concierge";
  message: string;
  requestType: string;
  tripId: string | null;
  clientId: string;
  response: string | null;
}

export interface PersonalEventData {
  type: "personal";
  description: string | null;
  location: string | null;
  category: "meeting" | "task" | "reminder" | "personal" | "other";
  allDay: boolean;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

export interface CalendarFiltersState {
  enabledTypes: Set<CalendarEventType>;
  searchQuery: string;
}

// ---------------------------------------------------------------------------
// UI configuration types
// ---------------------------------------------------------------------------

export interface EventTypeConfig {
  label: string;
  color: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  bgColor: string;
  icon: LucideIcon;
  badgeVariant: BadgeVariant;
}

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  action: string;
  variant?: "primary" | "outline" | "danger";
}

// ---------------------------------------------------------------------------
// Layout types for week view lane assignment
// ---------------------------------------------------------------------------

export interface EventLane {
  event: CalendarEvent;
  startCol: number;
  span: number;
  lane: number;
}

// ---------------------------------------------------------------------------
// Personal event creation input
// ---------------------------------------------------------------------------

export interface CreatePersonalEventInput {
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  category: "meeting" | "task" | "reminder" | "personal" | "other";
  allDay: boolean;
}
