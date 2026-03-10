/* ------------------------------------------------------------------
 * middleware.ts — redirect behaviour unit tests
 *
 * Tests the four middleware invariants:
 *   1. Non-protected routes pass through without any DB call.
 *   2. Unauthenticated requests to protected/onboarding paths → /auth.
 *   3. Authenticated but incomplete-onboarding users → /onboarding.
 *   4. Onboarding-complete users visiting /onboarding → /admin (or safe next).
 * ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const updateSessionMock = vi.fn();
const profileSelectMock = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
    updateSession: updateSessionMock,
}));

function makeRequest(pathname: string, search = ""): NextRequest {
    return new NextRequest(`http://localhost${pathname}${search}`);
}

function buildProfileChain(profile: {
    organization_id: string | null;
    role: string | null;
    onboarding_step: number | null;
} | null) {
    return {
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile }),
            }),
        }),
    };
}

function mockUpdateSession(
    user: { id: string } | null,
    profile: {
        organization_id: string | null;
        role: string | null;
        onboarding_step: number | null;
    } | null = null
) {
    updateSessionMock.mockImplementation(async (req: NextRequest) => ({
        response: NextResponse.next({ request: req }),
        user,
        supabase: {
            from: vi.fn().mockReturnValue(buildProfileChain(profile)),
        },
    }));
}

async function loadMiddleware() {
    vi.resetModules();
    return import("../../../src/middleware");
}

beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSession(null);
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("passes public routes through without hitting the DB", async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/"));
    expect(response.status).toBe(200);
});

it("passes /auth route through without hitting the DB", async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/auth"));
    expect(response.status).toBe(200);
});

it("redirects unauthenticated request to /admin to /auth with next param", async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/admin/dashboard"));
    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/auth");
    expect(location).toContain("next=%2Fadmin%2Fdashboard");
});

it("redirects unauthenticated request to /trips to /auth", async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/trips"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth");
});

it("redirects unauthenticated request to /onboarding to /auth", async () => {
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/onboarding"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth");
});

it("redirects incomplete-onboarding user from /admin to /onboarding", async () => {
    mockUpdateSession(
        { id: "user-1" },
        { organization_id: null, role: "admin", onboarding_step: 0 }
    );
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/admin/trips"));
    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/onboarding");
    expect(location).toContain("next=%2Fadmin%2Ftrips");
});

it("redirects user with no organization from /planner to /onboarding", async () => {
    mockUpdateSession(
        { id: "user-1" },
        { organization_id: null, role: "admin", onboarding_step: 1 }
    );
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/planner"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/onboarding");
});

it("allows onboarding-complete admin user through to /admin", async () => {
    mockUpdateSession(
        { id: "user-1" },
        { organization_id: "org-1", role: "admin", onboarding_step: 2 }
    );
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/admin/trips"));
    expect(response.status).toBe(200);
});

it("redirects onboarding-complete user away from /onboarding to /admin", async () => {
    mockUpdateSession(
        { id: "user-1" },
        { organization_id: "org-1", role: "admin", onboarding_step: 2 }
    );
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/onboarding"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin");
});

it("redirects onboarding-complete user to safe next param from /onboarding", async () => {
    mockUpdateSession(
        { id: "user-1" },
        { organization_id: "org-1", role: "admin", onboarding_step: 2 }
    );
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/onboarding", "?next=%2Ftrips"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/trips");
});

it("blocks open-redirect: //evil.com next param falls back to /admin", async () => {
    mockUpdateSession(
        { id: "user-1" },
        { organization_id: "org-1", role: "admin", onboarding_step: 2 }
    );
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/onboarding", "?next=%2F%2Fevil.com"));
    const location = response.headers.get("location") ?? "";
    expect(location).not.toContain("evil.com");
    expect(location).toContain("/admin");
});

it("super_admin bypasses onboarding check for /god routes", async () => {
    mockUpdateSession(
        { id: "super-1" },
        { organization_id: null, role: "super_admin", onboarding_step: null }
    );
    const { middleware } = await loadMiddleware();
    const response = await middleware(makeRequest("/god/panel"));
    expect(response.status).toBe(200);
});
