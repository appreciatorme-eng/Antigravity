import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";

const ALLOWED_ORIGINS: ReadonlySet<string> = new Set(
  (process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_APP_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
);

type HandlerMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
// ctx is typed as `any` because each handler narrows params differently (e.g. { id: string })
// while the dispatcher calls them uniformly. Return type is still enforced.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandlerFn = (req: NextRequest, ctx: any) => Response | Promise<Response | undefined> | undefined;
type HandlerModule = Partial<Record<HandlerMethod, HandlerFn>>;
type RouteEntry = [string, () => Promise<HandlerModule>];

export interface DispatcherRateLimitConfig {
    limit: number;
    windowMs: number;
    prefix: string;
}

function extractRateLimitIdentifier(req: NextRequest): string {
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
    return `ip:${ip}`;
}

function matchRoute(
  pathParts: string[],
  routes: RouteEntry[]
): { loader: () => Promise<HandlerModule>; params: Record<string, string> } | null {
  for (const [pattern, loader] of routes) {
    const patternParts = pattern.split("/");

    if (patternParts.length !== pathParts.length) {
      continue;
    }

    let isMatch = true;
    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      return { loader, params };
    }
  }

  return null;
}

function isHandlerFn(value: unknown): value is HandlerFn {
  return typeof value === "function";
}

async function dispatch(
  req: NextRequest,
  method: HandlerMethod,
  pathParts: string[],
  routes: RouteEntry[],
  rl?: DispatcherRateLimitConfig
): Promise<Response> {
  try {
    if (rl) {
        const identifier = extractRateLimitIdentifier(req);
        const result = await enforceRateLimit({
            identifier,
            limit: rl.limit,
            windowMs: rl.windowMs,
            prefix: rl.prefix,
        });
        if (!result.success) {
            const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
            return NextResponse.json(
                { error: "Too many requests. Please retry later." },
                {
                    status: 429,
                    headers: {
                        "retry-after": String(retryAfter),
                        "x-ratelimit-limit": String(result.limit),
                        "x-ratelimit-remaining": "0",
                        "x-ratelimit-reset": String(result.reset),
                    },
                }
            );
        }
    }

    const match = matchRoute(pathParts, routes);

    if (!match) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isMutation = method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
    const routePath = pathParts.join("/");
    const csrfExempt = routePath.startsWith("webhook") || routePath.startsWith("cron/") || routePath === "payments/webhook" || routePath === "webhooks/waha";
    if (isMutation && !csrfExempt && !passesMutationCsrfGuard(req)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }

    const handler = await match.loader();
    const fn = handler[method];

    if (!isHandlerFn(fn)) {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    return (
      (await fn(req, { params: Promise.resolve(match.params) })) ??
      NextResponse.json({ error: "Handler returned no response" }, { status: 500 })
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    logError("[api-dispatch] unhandled error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export function createCatchAllHandlers(
  routes: RouteEntry[],
  options?: { rateLimit?: DispatcherRateLimitConfig }
) {
  const rl = options?.rateLimit;

  // Sort routes: static segments before dynamic ones (more specific first)
  const sorted = [...routes].sort(([a], [b]) => {
    const aParts = a.split("/");
    const bParts = b.split("/");

    // Longer patterns are more specific
    if (aParts.length !== bParts.length) {
      return bParts.length - aParts.length;
    }

    // Static segments before dynamic
    for (let i = 0; i < aParts.length; i++) {
      const aIsDynamic = aParts[i].startsWith(":");
      const bIsDynamic = bParts[i].startsWith(":");

      if (!aIsDynamic && bIsDynamic) return -1;
      if (aIsDynamic && !bIsDynamic) return 1;
    }

    return a.localeCompare(b);
  });

  async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "GET", path, sorted, rl);
  }

  async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "POST", path, sorted, rl);
  }

  async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "PATCH", path, sorted, rl);
  }

  async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "PUT", path, sorted, rl);
  }

  async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "DELETE", path, sorted, rl);
  }

  async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
    return new NextResponse(null, {
      status: 204,
      headers: {
        Allow: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
      },
    });
  }

  return { GET, POST, PATCH, PUT, DELETE, OPTIONS };
}
