export type PaymentLinkStatus = "pending" | "viewed" | "paid" | "expired" | "cancelled";

export type PaymentEventType =
  | "created"
  | "sent"
  | "viewed"
  | "reminder_sent"
  | "paid"
  | "expired"
  | "cancelled";

export interface PaymentEvent {
  type: PaymentEventType;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface PaymentLinkData {
  id: string;
  token: string;
  proposalId: string | null;
  bookingId: string | null;
  clientId: string | null;
  clientName: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  amount: number;
  currency: "INR" | "USD";
  description: string | null;
  createdAt: string;
  expiresAt: string | null;
  viewedAt: string | null;
  paidAt: string | null;
  status: PaymentLinkStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paymentUrl: string;
  proposalTitle?: string | null;
  organizationName?: string | null;
  events: PaymentEvent[];
}

export interface CreatePaymentLinkInput {
  proposalId?: string;
  bookingId?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  amount: number;
  currency?: "INR" | "USD";
  description: string;
  expiresInHours?: number;
}

export function buildPaymentUrl(token: string, origin?: string): string {
  if (origin) {
    return `${origin.replace(/\/$/, "")}/pay/${token}`;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/pay/${token}`;
  }

  return `/pay/${token}`;
}

export function formatPaymentAmount(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export function getStatusColor(status: PaymentLinkStatus): string {
  switch (status) {
    case "pending":
      return "text-amber-400";
    case "viewed":
      return "text-blue-400";
    case "paid":
      return "text-green-400";
    case "expired":
    case "cancelled":
      return "text-red-400";
    default:
      return "text-white/60";
  }
}

export function isExpired(link: Pick<PaymentLinkData, "expiresAt" | "status">): boolean {
  if (!link.expiresAt) return false;
  if (link.status === "paid" || link.status === "cancelled") return false;
  return new Date(link.expiresAt) < new Date();
}
