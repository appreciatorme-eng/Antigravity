import {
  AlertCircle,
  Clock,
  CheckCircle,
  Car,
  IndianRupee,
  FileText,
  MessageCircle,
  Plane,
  ShieldCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Priority = "high" | "medium" | "info" | "done";

export type ActionType =
  | "driver_unassigned"
  | "payment_overdue"
  | "quote_awaiting"
  | "new_whatsapp_lead"
  | "pickup_today"
  | "verification_pending";

export type InlineAction =
  | "assign_driver"
  | "send_reminder"
  | "view_leads"
  | "follow_up"
  | "view_schedule"
  | "review_docs";

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

export const TASK_ACTION_CONFIG: Record<string, { label: string; inlineAction: InlineAction }> = {
  driver_unassigned: { label: "Assign Now", inlineAction: "assign_driver" },
  payment_overdue: { label: "Send Reminder", inlineAction: "send_reminder" },
  new_whatsapp_lead: { label: "View Leads", inlineAction: "view_leads" },
  quote_awaiting: { label: "Follow Up", inlineAction: "follow_up" },
  pickup_today: { label: "View Schedule", inlineAction: "view_schedule" },
  verification_pending: { label: "Review Docs", inlineAction: "review_docs" },
};

export const TYPE_ICONS: Record<ActionType, React.ElementType> = {
  driver_unassigned: Car,
  payment_overdue: IndianRupee,
  quote_awaiting: FileText,
  new_whatsapp_lead: MessageCircle,
  pickup_today: Plane,
  verification_pending: ShieldCheck,
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { border: string; bg: string; badge: string; icon: React.ElementType; iconColor: string }
> = {
  high: {
    border: "border-l-red-500",
    bg: "bg-red-500/5",
    badge: "bg-red-500/10 text-red-500",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
  medium: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    badge: "bg-amber-500/10 text-amber-500",
    icon: Clock,
    iconColor: "text-amber-500",
  },
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/10 text-blue-500",
    icon: Clock,
    iconColor: "text-blue-400",
  },
  done: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/10 text-emerald-500",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
  },
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Urgent",
  medium: "Attention",
  info: "Info",
  done: "Done",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getActionConfig(taskType: string) {
  return TASK_ACTION_CONFIG[taskType] ?? { label: "View", inlineAction: "view_leads" as InlineAction };
}

export function getInlineAction(taskType: string): InlineAction {
  return getActionConfig(taskType).inlineAction;
}

export function getTypeIcon(taskType: string): React.ElementType {
  return TYPE_ICONS[taskType as ActionType] ?? FileText;
}
