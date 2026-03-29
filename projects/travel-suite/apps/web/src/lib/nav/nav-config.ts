/**
 * Unified Navigation Configuration
 *
 * Single source of truth for ALL navigation items across:
 * - Desktop sidebar (Sidebar.tsx)
 * - Mobile bottom nav + "More" drawer (MobileNav.tsx)
 * - Future: Flutter app (apps/mobile/)
 *
 * When adding a new page, add it here with the correct section.
 * Both Sidebar and MobileNav auto-consume this config.
 *
 * Icon names are strings (lucide icon names) mapped to components at render time.
 * This keeps the config JSON-serializable for future cross-platform use.
 */

import type { NavCounts } from "@/components/layout/useNavCounts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NavSection =
  | "primary"
  | "daily"
  | "operations"
  | "growth"
  | "account";

export interface NavItemConfig {
  /** Lucide icon name — mapped to component at render time */
  readonly icon: string;
  readonly label: string;
  readonly href: string;
  readonly badgeKey?: keyof NavCounts;
  readonly badgeColor?: string;
  readonly section: NavSection;
}

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

export const NAV_ITEMS: readonly NavItemConfig[] = [
  // ── PRIMARY ──────────────────────────────────────────────────────────
  // Bottom tab bar on mobile, top section on desktop sidebar
  { icon: "Home", label: "Home", href: "/", section: "primary" },
  {
    icon: "MessageCircle",
    label: "Inbox",
    href: "/inbox",
    badgeKey: "inboxUnread",
    badgeColor: "#25D366",
    section: "primary",
  },
  {
    icon: "Briefcase",
    label: "Trips",
    href: "/trips",
    badgeKey: "bookingsToday",
    badgeColor: "#f97316",
    section: "primary",
  },
  {
    icon: "Users",
    label: "Clients",
    href: "/clients",
    badgeKey: "reviewsNeedingResponse",
    badgeColor: "#3b82f6",
    section: "primary",
  },
  {
    icon: "FileText",
    label: "Proposals",
    href: "/proposals",
    badgeKey: "proposalsPending",
    badgeColor: "#8b5cf6",
    section: "primary",
  },

  // ── DAILY WORKFLOW ───────────────────────────────────────────────────
  { icon: "Plane", label: "Bookings", href: "/bookings", section: "daily" },
  { icon: "Map", label: "Planner", href: "/planner", section: "daily" },
  { icon: "Calendar", label: "Calendar", href: "/calendar", section: "daily" },
  { icon: "Truck", label: "Drivers", href: "/drivers", section: "daily" },

  // ── OPERATIONS ──────────────────────────────────────────────────────
  {
    icon: "Receipt",
    label: "Invoices",
    href: "/admin/invoices",
    section: "operations",
  },
  {
    icon: "TrendingUp",
    label: "Revenue",
    href: "/admin/revenue",
    section: "operations",
  },
  {
    icon: "Coins",
    label: "Pricing & Profit",
    href: "/admin/pricing",
    section: "operations",
  },
  {
    icon: "Compass",
    label: "Operations",
    href: "/admin/operations",
    section: "operations",
  },

  // ── GROWTH ──────────────────────────────────────────────────────────
  {
    icon: "Store",
    label: "Marketplace",
    href: "/marketplace",
    section: "growth",
  },
  { icon: "Star", label: "Reputation", href: "/reputation", section: "growth" },
  {
    icon: "Megaphone",
    label: "Social Studio",
    href: "/social",
    section: "growth",
  },
  {
    icon: "Sparkles",
    label: "AI Insights",
    href: "/admin/insights",
    section: "growth",
  },
  {
    icon: "Gift",
    label: "Refer & Earn",
    href: "/admin/referrals",
    section: "growth",
  },

  // ── ACCOUNT ─────────────────────────────────────────────────────────
  { icon: "Settings", label: "Settings", href: "/settings", section: "account" },
  {
    icon: "CreditCard",
    label: "Billing",
    href: "/billing",
    section: "account",
  },
  { icon: "Map", label: "Add-ons", href: "/add-ons", section: "account" },
  { icon: "LifeBuoy", label: "Support", href: "/support", section: "account" },
];

// ---------------------------------------------------------------------------
// FAB quick actions (center tab on mobile, sidebar button on desktop)
// ---------------------------------------------------------------------------

export interface FabAction {
  readonly emoji: string;
  readonly label: string;
  readonly description: string;
  /** Navigate to this route, OR dispatch this custom event */
  readonly route?: string;
  readonly event?: string;
  readonly bgColor: string;
}

export const FAB_ACTIONS: readonly FabAction[] = [
  {
    emoji: "✈️",
    label: "New Trip",
    description: "Create a new trip itinerary",
    route: "/trips?create=true",
    bgColor: "bg-blue-500 hover:bg-blue-400",
  },
  {
    emoji: "\uD83D\uDCB0",
    label: "Quick Quote",
    description: "Generate a quick quotation",
    event: "open-quick-quote",
    bgColor: "bg-amber-500 hover:bg-amber-400",
  },
  {
    emoji: "📱",
    label: "WA Broadcast",
    description: "Send WhatsApp broadcast",
    route: "/inbox?mode=broadcast",
    bgColor: "bg-[#25D366] hover:bg-[#20bc5a]",
  },
  {
    emoji: "📋",
    label: "New Proposal",
    description: "Create a new proposal",
    route: "/proposals/create",
    bgColor: "bg-violet-500 hover:bg-violet-400",
  },
];

// ---------------------------------------------------------------------------
// Section display metadata
// ---------------------------------------------------------------------------

export const SECTION_LABELS: Record<NavSection, string> = {
  primary: "Primary",
  daily: "Daily Workflow",
  operations: "Operations",
  growth: "Growth",
  account: "Account",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get all items for a given section */
export function getNavSection(section: NavSection): readonly NavItemConfig[] {
  return NAV_ITEMS.filter((item) => item.section === section);
}

/** Get primary nav items (bottom tab bar on mobile, top sidebar on desktop) */
export function getPrimaryItems(): readonly NavItemConfig[] {
  return getNavSection("primary");
}

/**
 * Get all secondary items grouped by section (for "More" drawer / sidebar expand).
 * @param mobileTabHrefs - hrefs of items in the mobile tab bar (excluded from results,
 *   but other primary items like Proposals are prepended to "Daily Workflow").
 */
export function getSecondaryGrouped(
  mobileTabHrefs: readonly string[] = [],
): ReadonlyArray<{
  section: NavSection;
  label: string;
  items: readonly NavItemConfig[];
}> {
  // Primary items NOT in the mobile tab bar go into "Daily Workflow" at the top
  const overflowPrimary = mobileTabHrefs.length > 0
    ? NAV_ITEMS.filter((i) => i.section === "primary" && !mobileTabHrefs.includes(i.href))
    : [];

  const sections: NavSection[] = ["daily", "operations", "growth", "account"];
  return sections
    .map((section) => {
      const sectionItems = getNavSection(section);
      // Prepend overflow primary items (e.g. Proposals) to the daily section
      const items = section === "daily" && overflowPrimary.length > 0
        ? [...overflowPrimary, ...sectionItems]
        : sectionItems;
      return { section, label: SECTION_LABELS[section], items };
    })
    .filter((group) => group.items.length > 0);
}
