// Demo Mode — notification type + empty array.

interface DemoNotification {
  id: string;
  type: "lead" | "payment" | "driver" | "trip" | "message";
  title: string;
  description: string;
  timeLabel: string;
  read: boolean;
  href: string;
}

export const DEMO_NOTIFICATIONS: DemoNotification[] = [];
