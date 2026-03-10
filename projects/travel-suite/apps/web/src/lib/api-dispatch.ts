import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandlerModule = Record<string, any>;
type RouteEntry = [string, () => Promise<HandlerModule>];

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

async function dispatch(
  req: NextRequest,
  method: string,
  pathParts: string[],
  routes: RouteEntry[]
): Promise<NextResponse> {
  try {
    const match = matchRoute(pathParts, routes);

    if (!match) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const handler = await match.loader();
    const fn = handler[method];

    if (typeof fn !== "function") {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    return fn(req, { params: Promise.resolve(match.params) });
  } catch (error) {
    console.error("[api-dispatch] unhandled error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export function createCatchAllHandlers(routes: RouteEntry[]) {
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
    return dispatch(req, "GET", path, sorted);
  }

  async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "POST", path, sorted);
  }

  async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "PATCH", path, sorted);
  }

  async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "PUT", path, sorted);
  }

  async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "DELETE", path, sorted);
  }

  async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    const { path } = await ctx.params;
    return dispatch(req, "OPTIONS", path, sorted);
  }

  return { GET, POST, PATCH, PUT, DELETE, OPTIONS };
}
