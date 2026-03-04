import { createCatchAllHandlers } from "@/lib/api-dispatch";

export const maxDuration = 300;

const routes = createCatchAllHandlers([
  ["ai/analyze", () => import("@/app/api/_handlers/reputation/ai/analyze/route")],
  ["ai/batch-analyze", () => import("@/app/api/_handlers/reputation/ai/batch-analyze/route")],
  ["ai/respond", () => import("@/app/api/_handlers/reputation/ai/respond/route")],
  ["analytics/snapshot", () => import("@/app/api/_handlers/reputation/analytics/snapshot/route")],
  ["analytics/topics", () => import("@/app/api/_handlers/reputation/analytics/topics/route")],
  ["analytics/trends", () => import("@/app/api/_handlers/reputation/analytics/trends/route")],
  ["brand-voice", () => import("@/app/api/_handlers/reputation/brand-voice/route")],
  ["campaigns/trigger", () => import("@/app/api/_handlers/reputation/campaigns/trigger/route")],
  ["campaigns/:id", () => import("@/app/api/_handlers/reputation/campaigns/[id]/route")],
  ["campaigns", () => import("@/app/api/_handlers/reputation/campaigns/route")],
  ["connections", () => import("@/app/api/_handlers/reputation/connections/route")],
  ["dashboard", () => import("@/app/api/_handlers/reputation/dashboard/route")],
  ["nps/submit", () => import("@/app/api/_handlers/reputation/nps/submit/route")],
  ["nps/:token", () => import("@/app/api/_handlers/reputation/nps/[token]/route")],
  ["reviews/:id", () => import("@/app/api/_handlers/reputation/reviews/[id]/route")],
  ["reviews", () => import("@/app/api/_handlers/reputation/reviews/route")],
  ["widget/config", () => import("@/app/api/_handlers/reputation/widget/config/route")],
  ["widget/:token", () => import("@/app/api/_handlers/reputation/widget/[token]/route")],
]);

export const { GET, POST, PATCH, PUT, DELETE, OPTIONS } = routes;
