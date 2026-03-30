/**
 * Maps icon name strings from nav-config.ts to lucide-react components.
 *
 * This indirection keeps nav-config.ts JSON-serializable (for future
 * cross-platform use with Flutter) while giving React components the
 * actual icon elements they need.
 */

import {
  Home,
  MessageCircle,
  Briefcase,
  Users,
  FileText,
  Plane,
  Map,
  Calendar,
  Truck,
  Receipt,
  TrendingUp,
  Coins,
  Compass,
  Store,
  Star,
  Megaphone,
  Sparkles,
  Gift,
  Settings,
  CreditCard,
  LifeBuoy,
  FileSpreadsheet,
  LayoutTemplate,
  BarChart3,
  Puzzle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  MessageCircle,
  Briefcase,
  Users,
  FileText,
  Plane,
  Map,
  Calendar,
  Truck,
  Receipt,
  TrendingUp,
  Coins,
  Compass,
  Store,
  Star,
  Megaphone,
  Sparkles,
  Gift,
  Settings,
  CreditCard,
  LifeBuoy,
  FileSpreadsheet,
  LayoutTemplate,
  BarChart3,
  Puzzle,
};

/** Resolve an icon name string to a lucide-react component. Falls back to FileText. */
export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? FileText;
}
