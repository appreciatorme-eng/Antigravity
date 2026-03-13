import {
  AlertCircle,
  Clock,
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

export type Priority = "high" | "medium" | "info";
export type Tab = "active" | "completed";

export type InlineAction =
  | "assign_driver"
  | "send_reminder"
  | "view_leads"
  | "follow_up"
  | "view_schedule"
  | "review_docs";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TASK_ACTION_CONFIG: Record<
  string,
  { label: string; inlineAction: InlineAction }
> = {
  driver_unassigned: { label: "Assign Now", inlineAction: "assign_driver" },
  payment_overdue: { label: "Send Reminder", inlineAction: "send_reminder" },
  new_whatsapp_lead: { label: "View Leads", inlineAction: "view_leads" },
  quote_awaiting: { label: "Follow Up", inlineAction: "follow_up" },
  pickup_today: { label: "View Schedule", inlineAction: "view_schedule" },
  verification_pending: { label: "Review Docs", inlineAction: "review_docs" },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  {
    border: string;
    bg: string;
    badge: string;
    icon: React.ElementType;
    iconColor: string;
  }
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
};

export const PRIORITY_GROUP_LABELS: Record<Priority, string> = {
  high: "Urgent",
  medium: "Needs Attention",
  info: "Informational",
};

export const PRIORITY_ORDER: Priority[] = ["high", "medium", "info"];

export const TYPE_ICONS: Record<string, React.ElementType> = {
  driver_unassigned: Car,
  payment_overdue: IndianRupee,
  quote_awaiting: FileText,
  new_whatsapp_lead: MessageCircle,
  pickup_today: Plane,
  verification_pending: ShieldCheck,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getActionConfig(taskType: string) {
  return (
    TASK_ACTION_CONFIG[taskType] ?? {
      label: "View",
      inlineAction: "view_leads" as InlineAction,
    }
  );
}

export function getInlineAction(taskType: string): InlineAction {
  return getActionConfig(taskType).inlineAction;
}
