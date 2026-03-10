import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

import { createCatchAllHandlers } from "../../../src/lib/api-dispatch";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeRequest(method: string, url = "http://localhost") {
  return new NextRequest(url, { method });
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

  it.each(["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"] as const)(
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
});
