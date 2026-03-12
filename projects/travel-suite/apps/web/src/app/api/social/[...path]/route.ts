import { createCatchAllHandlers } from "@/lib/api-dispatch";

export const maxDuration = 60;

const routes = createCatchAllHandlers([
  ["ai-image", () => import("@/app/api/_handlers/social/ai-image/route")],
  ["ai-poster", () => import("@/app/api/_handlers/social/ai-poster/route")],
  ["captions", () => import("@/app/api/_handlers/social/captions/route")],
  ["connections/:id", () => import("@/app/api/_handlers/social/connections/[id]/route")],
  ["connections", () => import("@/app/api/_handlers/social/connections/route")],
  ["extract", () => import("@/app/api/_handlers/social/extract/route")],
  ["oauth/callback", () => import("@/app/api/_handlers/social/oauth/callback/route")],
  ["oauth/facebook", () => import("@/app/api/_handlers/social/oauth/facebook/route")],
  ["oauth/google",   () => import("@/app/api/_handlers/social/oauth/google/route")],
  ["oauth/linkedin", () => import("@/app/api/_handlers/social/oauth/linkedin/route")],
  ["posts/:id/render", () => import("@/app/api/_handlers/social/posts/[id]/render/route")],
  ["posts", () => import("@/app/api/_handlers/social/posts/route")],
  ["process-queue", () => import("@/app/api/_handlers/social/process-queue/route")],
  ["publish", () => import("@/app/api/_handlers/social/publish/route")],
  ["refresh-tokens", () => import("@/app/api/_handlers/social/refresh-tokens/route")],
  ["render-poster", () => import("@/app/api/_handlers/social/render-poster/route")],
  ["reviews/import", () => import("@/app/api/_handlers/social/reviews/import/route")],
  ["reviews/public", () => import("@/app/api/_handlers/social/reviews/public/route")],
  ["reviews", () => import("@/app/api/_handlers/social/reviews/route")],
  ["schedule", () => import("@/app/api/_handlers/social/schedule/route")],
  ["smart-poster", () => import("@/app/api/_handlers/social/smart-poster/route")],
], {
  rateLimit: {
    limit: 150,
    windowMs: 5 * 60 * 1000,
    prefix: "api:social",
  },
});

export const { GET, POST, PATCH, PUT, DELETE, OPTIONS } = routes;
