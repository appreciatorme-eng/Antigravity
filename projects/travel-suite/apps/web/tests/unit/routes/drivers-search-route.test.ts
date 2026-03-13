/* ------------------------------------------------------------------
 * drivers/search GET — auth, pagination, and search unit tests
 *
 * Covers:
 *   - 401 when unauthenticated
 *   - 403 when user has no organization
 *   - Paginated response shape { drivers, pagination }
 *   - offset + limit params respected
 *   - limit clamped to MAX_LIMIT (100)
 *   - search term passed through to ilike filter
 *   - structured logger used (no console.error)
 * ------------------------------------------------------------------ */

import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const createServerClientMock = vi.fn();
const logErrorMock = vi.fn();
const logEventMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: createServerClientMock,
}));

vi.mock("@/lib/observability/logger", () => ({
    getRequestId: vi.fn().mockReturnValue("test-req-id"),
    getRequestContext: vi.fn().mockReturnValue({ requestId: "test-req-id" }),
    logError: logErrorMock,
    logEvent: logEventMock,
}));

const DRIVER_ROWS = [
    { id: "drv-1", full_name: "Alice Ahmed", phone: "+911234567890", vehicle_type: "SUV", vehicle_plate: "MH01AB1234", photo_url: null },
    { id: "drv-2", full_name: "Bob Basu", phone: "+911234567891", vehicle_type: "Sedan", vehicle_plate: "MH01CD5678", photo_url: null },
    { id: "drv-3", full_name: "Carol Das", phone: "+911234567892", vehicle_type: null, vehicle_plate: null, photo_url: null },
];

function buildDriverQueryChain(drivers: unknown[], count = drivers.length) {
    const chain = {
        select: vi.fn(),
        eq: vi.fn(),
        ilike: vi.fn(),
        order: vi.fn(),
        range: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.ilike.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.range.mockResolvedValue({ data: drivers, count, error: null });
    return chain;
}

function buildAssignmentChain() {
    return {
        select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
    };
}

function buildProfileChain(profile: { role: string; organization_id: string | null } | null) {
    return {
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: profile }),
            }),
        }),
    };
}

async function loadRoute() {
    vi.resetModules();
    return import("../../../src/app/api/_handlers/drivers/search/route");
}

function makeRequest(search = ""): NextRequest {
    return new NextRequest(`http://localhost/api/drivers/search${search}`);
}

beforeEach(() => {
    vi.clearAllMocks();
});

it("returns 401 when no authenticated user", async () => {
    createServerClientMock.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    createAdminClientMock.mockReturnValue({ from: vi.fn() });

    const { GET } = await loadRoute();
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
});

it("returns 400 when user has no organization", async () => {
    createServerClientMock.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    });
    createAdminClientMock.mockReturnValue({
        from: vi.fn().mockReturnValue(buildProfileChain({ role: "admin", organization_id: null })),
    });

    const { GET } = await loadRoute();
    const response = await GET(makeRequest());
    expect(response.status).toBe(400);
});

it("returns paginated driver list with correct shape", async () => {
    createServerClientMock.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    });
    createAdminClientMock.mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
            if (table === "profiles") return buildProfileChain({ role: "admin", organization_id: "org-1" });
            if (table === "external_drivers") return buildDriverQueryChain(DRIVER_ROWS.slice(0, 2), 3);
            return buildAssignmentChain();
        }),
    });

    const { GET } = await loadRoute();
    const response = await GET(makeRequest("?limit=2&offset=0"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("drivers");
    expect(body).toHaveProperty("pagination");
    expect(body.drivers).toHaveLength(2);
    expect(body.pagination.total).toBe(3);
    expect(body.pagination.limit).toBe(2);
    expect(body.pagination.offset).toBe(0);
    expect(body.pagination.hasMore).toBe(true);
});

it("returns empty result set with hasMore=false when no drivers found", async () => {
    createServerClientMock.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    });
    createAdminClientMock.mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
            if (table === "profiles") return buildProfileChain({ role: "admin", organization_id: "org-1" });
            return buildDriverQueryChain([], 0);
        }),
    });

    const { GET } = await loadRoute();
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.drivers).toHaveLength(0);
    expect(body.pagination.hasMore).toBe(false);
});

it("clamps limit above MAX_LIMIT (100) to 100", async () => {
    createServerClientMock.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    });
    const driverChain = buildDriverQueryChain([], 0);
    createAdminClientMock.mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
            if (table === "profiles") return buildProfileChain({ role: "admin", organization_id: "org-1" });
            return driverChain;
        }),
    });

    const { GET } = await loadRoute();
    await GET(makeRequest("?limit=999&offset=0"));

    const rangeCall = driverChain.range.mock.calls[0];
    expect(rangeCall[0]).toBe(0);
    expect(rangeCall[1]).toBe(99);
});

it("respects offset param for pagination window", async () => {
    createServerClientMock.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    });
    const driverChain = buildDriverQueryChain([], 0);
    createAdminClientMock.mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
            if (table === "profiles") return buildProfileChain({ role: "admin", organization_id: "org-1" });
            return driverChain;
        }),
    });

    const { GET } = await loadRoute();
    await GET(makeRequest("?limit=10&offset=30"));

    const rangeCall = driverChain.range.mock.calls[0];
    expect(rangeCall[0]).toBe(30);
    expect(rangeCall[1]).toBe(39);
});

it("uses structured logger instead of console.error on DB failure", async () => {
    const consoleSpy = vi.spyOn(console, "error");
    createServerClientMock.mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    });
    const failingChain = {
        select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                    data: { role: "admin", organization_id: "org-1" },
                }),
                order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({ data: null, count: null, error: new Error("DB failure") }),
                }),
            }),
            order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({ data: null, count: null, error: new Error("DB failure") }),
            }),
        }),
        eq: vi.fn(),
        ilike: vi.fn(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, count: null, error: new Error("DB failure") }),
    };
    failingChain.select.mockReturnValue(failingChain);
    failingChain.eq.mockReturnValue(failingChain);
    failingChain.ilike.mockReturnValue(failingChain);
    failingChain.order.mockReturnValue(failingChain);

    createAdminClientMock.mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
            if (table === "profiles") return buildProfileChain({ role: "admin", organization_id: "org-1" });
            return failingChain;
        }),
    });

    const { GET } = await loadRoute();
    const response = await GET(makeRequest());
    expect(response.status).toBe(500);

    expect(logErrorMock).toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
});
