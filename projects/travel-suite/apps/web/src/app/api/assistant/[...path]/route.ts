import { createCatchAllHandlers } from "@/lib/api-dispatch";

export const maxDuration = 60;

const routes = createCatchAllHandlers([
  ["chat/stream", () => import("@/app/api/_handlers/assistant/chat/stream/route")],
  ["chat", () => import("@/app/api/_handlers/assistant/chat/route")],
  ["confirm", () => import("@/app/api/_handlers/assistant/confirm/route")],
  ["conversations/:sessionId", () => import("@/app/api/_handlers/assistant/conversations/[sessionId]/route")],
  ["conversations", () => import("@/app/api/_handlers/assistant/conversations/route")],
  ["export", () => import("@/app/api/_handlers/assistant/export/route")],
  ["quick-prompts", () => import("@/app/api/_handlers/assistant/quick-prompts/route")],
  ["usage", () => import("@/app/api/_handlers/assistant/usage/route")],
], {
  rateLimit: {
    limit: 100,
    windowMs: 5 * 60 * 1000,
    prefix: "api:assistant",
  },
});

export const { GET, POST, PATCH, PUT, DELETE, OPTIONS } = routes;
