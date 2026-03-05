// Super-admin API catch-all — routes to /api/superadmin/* handlers.
// All handlers assert requireSuperAdmin() before processing.

import { createCatchAllHandlers } from "@/lib/api-dispatch";

export const maxDuration = 60;

const routes = createCatchAllHandlers([
  ["me", () => import("@/app/api/_handlers/superadmin/me/route")],
  ["overview", () => import("@/app/api/_handlers/superadmin/overview/route")],
  ["users/signups", () => import("@/app/api/_handlers/superadmin/users/signups/route")],
  ["users/directory", () => import("@/app/api/_handlers/superadmin/users/directory/route")],
  ["users/:id", () => import("@/app/api/_handlers/superadmin/users/[id]/route")],
  ["analytics/feature-usage/:feature", () => import("@/app/api/_handlers/superadmin/analytics/feature-usage/[feature]/route")],
  ["analytics/feature-usage", () => import("@/app/api/_handlers/superadmin/analytics/feature-usage/route")],
  ["cost/aggregate", () => import("@/app/api/_handlers/superadmin/cost/aggregate/route")],
  ["cost/trends", () => import("@/app/api/_handlers/superadmin/cost/trends/route")],
  ["cost/org/:orgId", () => import("@/app/api/_handlers/superadmin/cost/org/[orgId]/route")],
  ["referrals/overview", () => import("@/app/api/_handlers/superadmin/referrals/overview/route")],
  ["referrals/detail/:type", () => import("@/app/api/_handlers/superadmin/referrals/detail/[type]/route")],
  ["announcements/:id/send", () => import("@/app/api/_handlers/superadmin/announcements/[id]/send/route")],
  ["announcements/:id", () => import("@/app/api/_handlers/superadmin/announcements/[id]/route")],
  ["announcements", () => import("@/app/api/_handlers/superadmin/announcements/route")],
  ["support/tickets/:id/respond", () => import("@/app/api/_handlers/superadmin/support/tickets/[id]/respond/route")],
  ["support/tickets/:id", () => import("@/app/api/_handlers/superadmin/support/tickets/[id]/route")],
  ["support/tickets", () => import("@/app/api/_handlers/superadmin/support/tickets/route")],
  ["settings/kill-switch", () => import("@/app/api/_handlers/superadmin/settings/kill-switch/route")],
  ["settings/org-suspend", () => import("@/app/api/_handlers/superadmin/settings/org-suspend/route")],
  ["settings", () => import("@/app/api/_handlers/superadmin/settings/route")],
  ["monitoring/health", () => import("@/app/api/_handlers/superadmin/monitoring/health/route")],
  ["monitoring/queues", () => import("@/app/api/_handlers/superadmin/monitoring/queues/route")],
  ["audit-log", () => import("@/app/api/_handlers/superadmin/audit-log/route")],
]);

export const { GET, POST, PATCH, PUT, DELETE, OPTIONS } = routes;
