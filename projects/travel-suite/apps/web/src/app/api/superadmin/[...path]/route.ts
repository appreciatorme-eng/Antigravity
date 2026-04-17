// Super-admin API catch-all — routes to /api/superadmin/* handlers.
// All handlers assert requireSuperAdmin() before processing.

import { createCatchAllHandlers } from "@/lib/api-dispatch";

export const maxDuration = 60;

const SUPERADMIN_RATE_LIMIT = {
    limit: 100,
    windowMs: 5 * 60 * 1000,
    prefix: "api:superadmin:dispatch",
};

const routes = createCatchAllHandlers([
  ["me", () => import("@/app/api/_handlers/superadmin/me/route")],
  ["overview", () => import("@/app/api/_handlers/superadmin/overview/route")],
  ["overview/presets", () => import("@/app/api/_handlers/superadmin/overview/presets/route")],
  ["business-os", () => import("@/app/api/_handlers/superadmin/business-os/route")],
  ["business-os/ops-loop", () => import("@/app/api/_handlers/superadmin/business-os/ops-loop/route")],
  ["autopilot", () => import("@/app/api/_handlers/superadmin/autopilot/route")],
  ["autopilot/run", () => import("@/app/api/_handlers/superadmin/autopilot/run/route")],
  ["autopilot/approvals/:id/approve", () => import("@/app/api/_handlers/superadmin/autopilot/approvals/[id]/approve/route")],
  ["autopilot/approvals/:id/reject", () => import("@/app/api/_handlers/superadmin/autopilot/approvals/[id]/reject/route")],
  ["autopilot/approvals", () => import("@/app/api/_handlers/superadmin/autopilot/approvals/route")],
  ["ai/daily-brief", () => import("@/app/api/_handlers/superadmin/ai/daily-brief/route")],
  ["ai/account-playbook", () => import("@/app/api/_handlers/superadmin/ai/account-playbook/route")],
  ["ai/propose-account-action", () => import("@/app/api/_handlers/superadmin/ai/propose-account-action/route")],
  ["accounts/:orgId/comms/:id/reply", () => import("@/app/api/_handlers/superadmin/accounts/[orgId]/comms/[id]/reply/route")],
  ["accounts/:orgId/comms/:id/send", () => import("@/app/api/_handlers/superadmin/accounts/[orgId]/comms/[id]/send/route")],
  ["accounts/:orgId/comms", () => import("@/app/api/_handlers/superadmin/accounts/[orgId]/comms/route")],
  ["accounts/:orgId/commitments", () => import("@/app/api/_handlers/superadmin/accounts/[orgId]/commitments/route")],
  ["accounts/:orgId/memory", () => import("@/app/api/_handlers/superadmin/accounts/[orgId]/memory/route")],
  ["accounts/:orgId/activity", () => import("@/app/api/_handlers/superadmin/accounts/[orgId]/activity/route")],
  ["accounts/:orgId", () => import("@/app/api/_handlers/superadmin/accounts/[orgId]/route")],
  ["accounts", () => import("@/app/api/_handlers/superadmin/accounts/route")],
  ["work-items/:id/outcomes", () => import("@/app/api/_handlers/superadmin/work-items/[id]/outcomes/route")],
  ["work-items", () => import("@/app/api/_handlers/superadmin/work-items/route")],
  ["collections", () => import("@/app/api/_handlers/superadmin/collections/route")],
  ["users/signups", () => import("@/app/api/_handlers/superadmin/users/signups/route")],
  ["users/directory", () => import("@/app/api/_handlers/superadmin/users/directory/route")],
  ["users/invite", () => import("@/app/api/_handlers/superadmin/users/invite/route")],
  ["users/:id/impersonate", () => import("@/app/api/_handlers/superadmin/users/[id]/impersonate/route")],
  ["users/:id", () => import("@/app/api/_handlers/superadmin/users/[id]/route")],
  ["orgs/org-detail", () => import("@/app/api/_handlers/superadmin/orgs/org-detail/route")],
  ["orgs/:id", () => import("@/app/api/_handlers/superadmin/orgs/route")],
  ["orgs", () => import("@/app/api/_handlers/superadmin/orgs/route")],
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
  ["settings/slack", () => import("@/app/api/_handlers/superadmin/settings/slack/route")],
  ["settings", () => import("@/app/api/_handlers/superadmin/settings/route")],
  ["monitoring/health", () => import("@/app/api/_handlers/superadmin/monitoring/health/route")],
  ["monitoring/queues", () => import("@/app/api/_handlers/superadmin/monitoring/queues/route")],
  ["monitoring/queues/:queue/:action", () => import("@/app/api/_handlers/superadmin/monitoring/queue-actions/route")],
  ["audit-log", () => import("@/app/api/_handlers/superadmin/audit-log/route")],
  ["errors/:id", () => import("@/app/api/_handlers/superadmin/errors/route")],
  ["errors", () => import("@/app/api/_handlers/superadmin/errors/route")],
  ["mcp", () => import("@/app/api/_handlers/superadmin/mcp/route")],
], { rateLimit: SUPERADMIN_RATE_LIMIT });

export const { GET, POST, PATCH, PUT, DELETE, OPTIONS } = routes;
