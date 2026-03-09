/* ------------------------------------------------------------------
 * marketplace GET — pagination + auth unit tests
 *
 * Auth flow: no Bearer token → createServerClient() for user, then
 * supabaseAdmin.from("profiles") for profile. Both must be mocked.
 *
 * Covers:
 *   - 401 when unauthenticated
 *   - 400 when organization not configured
 *   - Paginated response shape { items, pagination }
 *   - page/limit params clamp correctly
 *   - hasMore flag accuracy
 * ------------------------------------------------------------------ */

import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const createAdminClientMock = vi.fn();
const createServerClientMock = vi.fn();
const logEventMock = vi.fn();
const logErrorMock = vi.fn();
const captureOperationalMetricMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: createServerClientMock,
}));

vi.mock("@/lib/observability/logger", () => ({
    getRequestId: vi.fn().mockReturnValue("test-request-id"),
    getRequestContext: vi.fn().mockReturnValue({ requestId: "test-request-id" }),
    logEvent: logEventMock,
    logError: logErrorMock,
}));

vi.mock("@/lib/observability/metrics", () => ({
    captureOperationalMetric: captureOperationalMetricMock,
}));

function buildMarketplaceQueryChain(rows: unknown[]) {
    const finalOrder = { order: vi.fn().mockResolvedValue({ data: rows, error: null }) };
    const chain = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        or: vi.fn(),
        order: vi.fn().mockReturnValue(finalOrder),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.contains.mockReturnValue(chain);
    chain.or.mockReturnValue(chain);
    return chain;
}

function makeServerClient(userId: string | null) {
    return {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
        },
    };
}

function makeAdminClient(rows: unknown[], orgId: string | null = "org-1") {
    return {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn().mockImplementation((table: string) => {
            if (table === "marketplace_profiles") return buildMarketplaceQueryChain(rows);
            return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: { role: "admin", organization_id: orgId },
                        }),
                    }),
                }),
            };
        }),
    };
}

async function loadRoute() {
    vi.resetModules();
    return import("../../../src/app/api/_handlers/marketplace/route");
}

function makeRequest(search = ""): NextRequest {
    return new NextRequest(`http://localhost/api/marketplace${search}`, {
        headers: { "content-type": "application/json" },
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    captureOperationalMetricMock.mockResolvedValue(undefined);
    createServerClientMock.mockResolvedValue(makeServerClient("user-1"));
    createAdminClientMock.mockReturnValue(makeAdminClient([]));
});

it("returns 401 when no authenticated user", async () => {
    createServerClientMock.mockResolvedValue(makeServerClient(null));
    createAdminClientMock.mockReturnValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
        from: vi.fn(),
    });

    const { GET } = await loadRoute();
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
});

it("returns 400 when the user has no organization", async () => {
    createAdminClientMock.mockReturnValue(makeAdminClient([], null));

    const { GET } = await loadRoute();
    const response = await GET(makeRequest());
    expect(response.status).toBe(400);
});

it("returns paginated { items, pagination } shape on success", async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
        id: `mp-${i}`,
        organization_id: "org-1",
        description: "desc",
        service_regions: [],
        specialties: [],
        gallery_urls: [],
        rate_card: [],
        compliance_documents: [],
        margin_rate: null,
        updated_at: new Date().toISOString(),
        is_verified: false,
        is_featured: false,
        featured_until: null,
        boost_score: 0,
        listing_tier: "free",
        verification_status: "none",
        organization: { name: `Org ${i}`, logo_url: null },
        reviews: [],
    }));

    createAdminClientMock.mockReturnValue(makeAdminClient(rows));

    const { GET } = await loadRoute();
    const response = await GET(makeRequest("?page=1&limit=2"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("pagination");
    expect(body.items).toHaveLength(2);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(2);
    expect(body.pagination.total).toBe(5);
    expect(body.pagination.hasMore).toBe(true);
});

it("returns page 3 with last remaining item", async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
        id: `mp-${i}`,
        organization_id: "org-1",
        description: "desc",
        service_regions: [],
        specialties: [],
        gallery_urls: [],
        rate_card: [],
        compliance_documents: [],
        margin_rate: null,
        updated_at: new Date().toISOString(),
        is_verified: false,
        is_featured: false,
        featured_until: null,
        boost_score: 0,
        listing_tier: "free",
        verification_status: "none",
        organization: { name: `Org ${i}`, logo_url: null },
        reviews: [],
    }));

    createAdminClientMock.mockReturnValue(makeAdminClient(rows));

    const { GET } = await loadRoute();
    const response = await GET(makeRequest("?page=3&limit=2"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.items).toHaveLength(1);
    expect(body.pagination.page).toBe(3);
    expect(body.pagination.hasMore).toBe(false);
});

it("clamps limit to a maximum of 100", async () => {
    const { GET } = await loadRoute();
    const response = await GET(makeRequest("?page=1&limit=999"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.pagination.limit).toBe(100);
});

it("clamps negative page to page 1", async () => {
    const { GET } = await loadRoute();
    const response = await GET(makeRequest("?page=-5"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.pagination.page).toBe(1);
});

it("returns empty items with hasMore=false for an empty dataset", async () => {
    const { GET } = await loadRoute();
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.items).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
    expect(body.pagination.hasMore).toBe(false);
});
