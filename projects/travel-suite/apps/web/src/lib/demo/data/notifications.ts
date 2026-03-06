// Demo Mode — 5 hardcoded GoBuddy Adventures notifications for the bell dropdown.
// First 3 are unread (matches dashboard pendingNotifications: 3).

interface DemoNotification {
  id: string;
  type: "lead" | "payment" | "driver" | "trip" | "message";
  title: string;
  description: string;
  timeLabel: string;
  read: boolean;
  href: string;
}

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: "dn1",
    type: "lead",
    title: "New WhatsApp Lead",
    description: "Bhai Rajasthan 5 din ka rate batao — Family of 4",
    timeLabel: "5 min ago",
    read: false,
    href: "/inbox",
  },
  {
    id: "dn2",
    type: "payment",
    title: "Payment Received",
    description: "₹45,000 from Priya Mehta — Kerala Backwaters Trip",
    timeLabel: "12 min ago",
    read: false,
    href: "/admin/billing",
  },
  {
    id: "dn3",
    type: "driver",
    title: "Driver Confirmed",
    description: "Raju Singh confirmed 6:00 AM pickup — Andaman Trip",
    timeLabel: "30 min ago",
    read: false,
    href: "/drivers",
  },
  {
    id: "dn4",
    type: "trip",
    title: "Trip Tomorrow",
    description: "Rajasthan Royal Tour starts tomorrow — 8 pax",
    timeLabel: "1 hr ago",
    read: true,
    href: "/trips",
  },
  {
    id: "dn5",
    type: "message",
    title: "Client Message",
    description: "Ananya Gupta: Can we add one extra night in Udaipur?",
    timeLabel: "2 hrs ago",
    read: true,
    href: "/inbox",
  },
];
