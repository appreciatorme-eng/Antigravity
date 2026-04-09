import {
  Plane,
  FileText,
  IndianRupee,
  FileSearch,
  CalendarHeart,
  Share2,
  MessageCircle,
  Send,
  CreditCard,
  Copy,
  Pencil,
  ArrowRightLeft,
  Clock,
  BellRing,
  Eye,
  ExternalLink,
  UserCircle,
  Trash2,
} from "lucide-react";

import type {
  CalendarEventType,
  EventTypeConfig,
  QuickAction,
  BadgeVariant,
} from "./types";

// ---------------------------------------------------------------------------
// Event type visual configuration
// ---------------------------------------------------------------------------

export const EVENT_TYPE_CONFIG: Record<CalendarEventType, EventTypeConfig> = {
  trip: {
    label: "Trips",
    color: "#00d084",
    textColor: "text-green-800",
    borderColor: "border-green-300",
    dotColor: "bg-green-500",
    bgColor: "bg-green-100",
    icon: Plane,
    badgeVariant: "primary",
  },
  invoice: {
    label: "Invoices",
    color: "#f59e0b",
    textColor: "text-amber-800",
    borderColor: "border-amber-300",
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-100",
    icon: FileText,
    badgeVariant: "warning",
  },
  payment: {
    label: "Payments",
    color: "#10b981",
    textColor: "text-emerald-800",
    borderColor: "border-emerald-300",
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-100",
    icon: IndianRupee,
    badgeVariant: "success",
  },
  proposal: {
    label: "Proposals",
    color: "#3b82f6",
    textColor: "text-blue-800",
    borderColor: "border-blue-300",
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-100",
    icon: FileSearch,
    badgeVariant: "info",
  },
  holiday: {
    label: "Holidays",
    color: "#ef4444",
    textColor: "text-rose-800",
    borderColor: "border-rose-300",
    dotColor: "bg-rose-500",
    bgColor: "bg-rose-100",
    icon: CalendarHeart,
    badgeVariant: "danger",
  },
  follow_up: {
    label: "Follow-ups",
    color: "#8b5cf6",
    textColor: "text-violet-800",
    borderColor: "border-violet-300",
    dotColor: "bg-violet-500",
    bgColor: "bg-violet-100",
    icon: BellRing,
    badgeVariant: "secondary",
  },
  social_post: {
    label: "Social Posts",
    color: "#a855f7",
    textColor: "text-purple-800",
    borderColor: "border-purple-300",
    dotColor: "bg-purple-500",
    bgColor: "bg-purple-100",
    icon: Share2,
    badgeVariant: "secondary",
  },
  concierge: {
    label: "Concierge",
    color: "#ec4899",
    textColor: "text-pink-800",
    borderColor: "border-pink-300",
    dotColor: "bg-pink-500",
    bgColor: "bg-pink-100",
    icon: MessageCircle,
    badgeVariant: "danger",
  },
  personal: {
    label: "Personal",
    color: "#6366f1",
    textColor: "text-indigo-800",
    borderColor: "border-indigo-300",
    dotColor: "bg-indigo-500",
    bgColor: "bg-indigo-100",
    icon: UserCircle,
    badgeVariant: "default",
  },
};

// ---------------------------------------------------------------------------
// Quick actions per event type
// ---------------------------------------------------------------------------

export const QUICK_ACTIONS: Record<CalendarEventType, QuickAction[]> = {
  trip: [
    { label: "View Trip", icon: Eye, action: "view" },
    { label: "Clone", icon: Copy, action: "clone" },
  ],
  invoice: [
    { label: "Send Invoice", icon: Send, action: "send" },
    { label: "Record Payment", icon: CreditCard, action: "record_payment" },
  ],
  payment: [
    { label: "View Invoice", icon: ExternalLink, action: "view_invoice" },
  ],
  proposal: [
    { label: "Send", icon: Send, action: "send" },
    { label: "Convert", icon: ArrowRightLeft, action: "convert" },
  ],
  holiday: [],
  follow_up: [
    { label: "Open Queue", icon: Eye, action: "view_queue" },
  ],
  social_post: [
    { label: "Edit", icon: Pencil, action: "edit" },
    { label: "Reschedule", icon: Clock, action: "reschedule" },
  ],
  concierge: [
    { label: "Respond", icon: Send, action: "respond" },
    { label: "View Trip", icon: Eye, action: "view_trip" },
  ],
  personal: [
    { label: "Edit", icon: Pencil, action: "edit" },
    { label: "Delete", icon: Trash2, action: "delete" },
  ],
};

// ---------------------------------------------------------------------------
// Status → badge variant mapping
// ---------------------------------------------------------------------------

export const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  draft: "default",
  pending: "default",
  active: "primary",
  confirmed: "primary",
  issued: "primary",
  completed: "success",
  paid: "success",
  overdue: "danger",
  cancelled: "danger",
  proposed: "info",
  sent: "info",
  viewed: "info",
  scheduled: "info",
  queued: "warning",
  retry: "warning",
  failed: "danger",
  partial: "warning",
};

// ---------------------------------------------------------------------------
// Calendar display constants
// ---------------------------------------------------------------------------

export const MONTH_NAMES: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAY_NAMES: string[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export const ALL_EVENT_TYPES: CalendarEventType[] = [
  "trip",
  "invoice",
  "payment",
  "proposal",
  "holiday",
  "follow_up",
  "social_post",
  "concierge",
  "personal",
];

// ---------------------------------------------------------------------------
// Time grid constants (Day/Week views)
// ---------------------------------------------------------------------------

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 23;
export const HOUR_HEIGHT_PX = 60;
export const HOURS: number[] = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i,
);
