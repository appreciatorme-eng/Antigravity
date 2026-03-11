import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { createCatchAllHandlers } from "../../../src/lib/api-dispatch";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeRequest(method: string, url = "http://localhost") {
  const headers: Record<string, string> = {};
  if (method !== "GET" && method !== "OPTIONS") {
    headers["authorization"] = "Bearer test-csrf-bypass";
  }
  return new NextRequest(url, { method, headers });
}

/** A handler module that echoes back the method it was invoked with. */
function echoModule(methods: string[]) {
  const mod: Record<string, (...args: unknown[]) => unknown> = {};
  for (const m of methods) {
    mod[m] = async (
      _req: NextRequest,
      ctx: { params: Promise<Record<string, string>> },
    ) => {
      const params = await ctx.params;
      return Response.json({ method: m, params });
    };
  }
  return mod;
}

/* ------------------------------------------------------------------ */
/*  matchRoute + dispatch (tested through createCatchAllHandlers)      */
/* ------------------------------------------------------------------ */

describe("createCatchAllHandlers", () => {
  /* ---------- basic routing ---------- */

  it("returns 404 when no routes match the path", async () => {
    const { GET } = createCatchAllHandlers([
      ["users", () => Promise.resolve(echoModule(["GET"]))],
    ]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["orders"] }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("routes a simple static segment correctly", async () => {
    const { GET } = createCatchAllHandlers([
      ["users", () => Promise.resolve(echoModule(["GET"]))],
    ]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["users"] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.method).toBe("GET");
  });

  it("routes multi-segment static paths", async () => {
    const { POST } = createCatchAllHandlers([
      ["users/profile", () => Promise.resolve(echoModule(["POST"]))],
    ]);

    const res = await POST(makeRequest("POST"), {
      params: Promise.resolve({ path: ["users", "profile"] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.method).toBe("POST");
  });

  /* ---------- dynamic segments ---------- */

  it("extracts dynamic parameters from :param segments", async () => {
    const { GET } = createCatchAllHandlers([
      ["users/:id", () => Promise.resolve(echoModule(["GET"]))],
    ]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["users", "42"] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.params).toEqual({ id: "42" });
  });

  it("extracts multiple dynamic parameters", async () => {
    const { GET } = createCatchAllHandlers([
      [
        "orgs/:orgId/members/:memberId",
        () => Promise.resolve(echoModule(["GET"])),
      ],
    ]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["orgs", "acme", "members", "jane"] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.params).toEqual({ orgId: "acme", memberId: "jane" });
  });

  /* ---------- method validation ---------- */

  it("returns 405 when the handler module lacks the requested method", async () => {
    const { POST } = createCatchAllHandlers([
      ["items", () => Promise.resolve(echoModule(["GET"]))],
    ]);

    const res = await POST(makeRequest("POST"), {
      params: Promise.resolve({ path: ["items"] }),
    });

    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.error).toBe("Method not allowed");
  });

  it("returns 405 when handler exports a non-function for the method", async () => {
    const { PATCH } = createCatchAllHandlers([
      [
        "items",
        () => Promise.resolve({ PATCH: "not-a-function", GET: () => {} }),
      ],
    ]);

    const res = await PATCH(makeRequest("PATCH"), {
      params: Promise.resolve({ path: ["items"] }),
    });

    expect(res.status).toBe(405);
  });

  /* ---------- all HTTP methods ---------- */

  it.each(["GET", "POST", "PATCH", "PUT", "DELETE"] as const)(
    "dispatches %s method correctly",
    async (method) => {
      const handlers = createCatchAllHandlers([
        ["test", () => Promise.resolve(echoModule([method]))],
      ]);

      const fn = handlers[method];
      const res = await fn(makeRequest(method), {
        params: Promise.resolve({ path: ["test"] }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.method).toBe(method);
    },
  );

  it("OPTIONS returns 204 with CORS headers (intercepted by dispatcher)", async () => {
    const handlers = createCatchAllHandlers([
      ["test", () => Promise.resolve(echoModule(["OPTIONS"]))],
    ]);

    const res = await handlers.OPTIONS(makeRequest("OPTIONS"), {
      params: Promise.resolve({ path: ["test"] }),
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("OPTIONS");
  });

  /* ---------- route sorting / priority ---------- */

  it("prefers static routes over dynamic ones at the same position", async () => {
    const staticModule = {
      GET: async () => Response.json({ source: "static" }),
    };
    const dynamicModule = {
      GET: async () => Response.json({ source: "dynamic" }),
    };

    const { GET } = createCatchAllHandlers([
      [":id", () => Promise.resolve(dynamicModule)],
      ["admin", () => Promise.resolve(staticModule)],
    ]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["admin"] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("static");
  });

  it("prefers longer (more specific) routes over shorter ones", async () => {
    const shortModule = {
      GET: async () => Response.json({ source: "short" }),
    };
    const longModule = {
      GET: async () => Response.json({ source: "long" }),
    };

    const { GET } = createCatchAllHandlers([
      ["a", () => Promise.resolve(shortModule)],
      ["a/b", () => Promise.resolve(longModule)],
    ]);

    // Path ["a", "b"] should match the longer route
    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["a", "b"] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("long");
  });

  /* ---------- edge cases ---------- */

  it("returns 404 when path has more segments than any route", async () => {
    const { GET } = createCatchAllHandlers([
      ["users", () => Promise.resolve(echoModule(["GET"]))],
    ]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["users", "42", "extra"] }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 when path has fewer segments than any route", async () => {
    const { GET } = createCatchAllHandlers([
      ["users/:id", () => Promise.resolve(echoModule(["GET"]))],
    ]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["users"] }),
    });

    expect(res.status).toBe(404);
  });

  it("handles an empty route list gracefully (always 404)", async () => {
    const { GET } = createCatchAllHandlers([]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["anything"] }),
    });

    expect(res.status).toBe(404);
  });

  it("passes the original NextRequest to the handler", async () => {
    let capturedReq: NextRequest | null = null;
    const mod = {
      GET: async (req: NextRequest) => {
        capturedReq = req;
        return Response.json({ ok: true });
      },
    };

    const { GET } = createCatchAllHandlers([
      ["ping", () => Promise.resolve(mod)],
    ]);

    const originalReq = makeRequest("GET", "http://localhost/api/ping");
    await GET(originalReq, {
      params: Promise.resolve({ path: ["ping"] }),
    });

    expect(capturedReq).toBe(originalReq);
  });

  it("dynamic param value can contain special characters", async () => {
    const { GET } = createCatchAllHandlers([
      ["items/:id", () => Promise.resolve(echoModule(["GET"]))],
    ]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["items", "hello%20world"] }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.params).toEqual({ id: "hello%20world" });
  });

  /* ---------- error handling in handlers ---------- */

  it("returns 500 when the handler throws a generic error", async () => {
    const errorModule = {
      GET: () => {
        throw new Error("something went wrong");
      },
    };
    const { GET } = createCatchAllHandlers([
      ["boom", () => Promise.resolve(errorModule)],
    ]);

    const res = await GET(makeRequest("GET"), {
      params: Promise.resolve({ path: ["boom"] }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });

  it("returns 400 when the handler throws a SyntaxError", async () => {
    const syntaxErrorModule = {
      POST: () => {
        throw new SyntaxError("Unexpected token");
      },
    };
    const { POST } = createCatchAllHandlers([
      ["parse", () => Promise.resolve(syntaxErrorModule)],
    ]);

    const res = await POST(makeRequest("POST"), {
      params: Promise.resolve({ path: ["parse"] }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON in request body");
  });
});

/* ------------------------------------------------------------------ */
/*  Rate limiting via DispatcherRateLimitConfig                        */
/* ------------------------------------------------------------------ */

const enforceRateLimitMock = vi.fn();

vi.mock("../../../src/lib/security/rate-limit", () => ({
  enforceRateLimit: (...args: unknown[]) => enforceRateLimitMock(...args),
}));

describe("createCatchAllHandlers with rateLimit option", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the request when rate limit allows it", async () => {
    enforceRateLimitMock.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60_000,
    });

    const { GET } = createCatchAllHandlers(
      [["ping", () => Promise.resolve(echoModule(["GET"]))]],
      { rateLimit: { limit: 100, windowMs: 60_000, prefix: "test" } },
    );

    const res = await GET(
      new NextRequest("http://localhost/api/ping", {
        method: "GET",
        headers: { authorization: "Bearer fake.jwt.token" },
      }),
      { params: Promise.resolve({ path: ["ping"] }) },
    );

    expect(res.status).toBe(200);
    expect(enforceRateLimitMock).toHaveBeenCalledOnce();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    enforceRateLimitMock.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 30_000,
    });

    const { POST } = createCatchAllHandlers(
      [["action", () => Promise.resolve(echoModule(["POST"]))]],
      { rateLimit: { limit: 5, windowMs: 30_000, prefix: "test-rl" } },
    );

    const res = await POST(
      new NextRequest("http://localhost/api/action", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
      }),
      { params: Promise.resolve({ path: ["action"] }) },
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
    expect(res.headers.get("retry-after")).toBeTruthy();
    expect(res.headers.get("x-ratelimit-limit")).toBe("5");
    expect(res.headers.get("x-ratelimit-remaining")).toBe("0");
  });

  it("uses x-real-ip as identifier when no authorization header", async () => {
    enforceRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });

    const { GET } = createCatchAllHandlers(
      [["check", () => Promise.resolve(echoModule(["GET"]))]],
      { rateLimit: { limit: 10, windowMs: 60_000, prefix: "ip-test" } },
    );

    await GET(
      new NextRequest("http://localhost/api/check", {
        method: "GET",
        headers: { "x-real-ip": "10.0.0.1" },
      }),
      { params: Promise.resolve({ path: ["check"] }) },
    );

    const callArg = enforceRateLimitMock.mock.calls[0][0];
    expect(callArg.identifier).toBe("ip:10.0.0.1");
  });

  it("falls back to 'unknown' identifier when no IP headers are present", async () => {
    enforceRateLimitMock.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60_000,
    });

    const { GET } = createCatchAllHandlers(
      [["check2", () => Promise.resolve(echoModule(["GET"]))]],
      { rateLimit: { limit: 10, windowMs: 60_000, prefix: "unknown-test" } },
    );

    await GET(
      new NextRequest("http://localhost/api/check2", { method: "GET" }),
      { params: Promise.resolve({ path: ["check2"] }) },
    );

    const callArg = enforceRateLimitMock.mock.calls[0][0];
    expect(callArg.identifier).toBe("ip:unknown");
  });
});
