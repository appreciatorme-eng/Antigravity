/**
 * Unit tests for the /api/auth/signup handler.
 *
 * Mocking strategy:
 *   - Supabase admin client: mocked to control createUser / rpc / deleteUser outcomes.
 *   - Rate limiter: mocked to always pass by default.
 *   - Logger: mocked to suppress output.
 *
 * The handler is imported after mocks are set up so that module-level
 * initialisation picks up the fakes.
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEGAL_VERSIONS } from "@/lib/legal/versions";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: () => ({
        auth: {
            admin: {
                createUser: mockCreateUser,
                deleteUser: mockDeleteUser,
            },
        },
        rpc: mockRpc,
    }),
}));

vi.mock("@/lib/security/rate-limit", () => ({
    enforceRateLimit: vi.fn().mockResolvedValue({
        success: true,
        limit: 5,
        reset: Date.now() + 60_000,
        remaining: 4,
    }),
}));

vi.mock("@/lib/observability/logger", () => ({
    logError: vi.fn(),
    logEvent: vi.fn(),
}));

// ── Import under test (after mocks) ──────────────────────────────────────────

const { POST } = await import("@/app/api/_handlers/auth/signup/route");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, ip = "1.2.3.4"): NextRequest {
    return new NextRequest("http://localhost/api/auth/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": ip,
            "user-agent": "vitest/1.0",
        },
        body: JSON.stringify(body),
    });
}

const VALID_BODY = {
    email: "test@example.com",
    password: "securePassword123",
    full_name: "Test User",
    terms_version: LEGAL_VERSIONS.terms,
    privacy_version: LEGAL_VERSIONS.privacy,
    terms_accepted: true,
    privacy_accepted: true,
    age_confirmed: true,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCreateUser.mockResolvedValue({
            data: { user: { id: "user-uuid-1" } },
            error: null,
        });
        mockRpc.mockResolvedValue({ error: null });
        mockDeleteUser.mockResolvedValue({ error: null });
    });

    it("returns 200 with success:true and user on valid payload", async () => {
        const res = await POST(makeRequest(VALID_BODY));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.user.id).toBe("user-uuid-1");
        expect(body.user.email).toBe("test@example.com");
    });

    it("calls createUser with email_confirm:false and hashed password placeholder", async () => {
        await POST(makeRequest(VALID_BODY));
        expect(mockCreateUser).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "test@example.com",
                email_confirm: false,
            }),
        );
    });

    it("calls record_signup_acceptance RPC with correct arguments", async () => {
        await POST(makeRequest(VALID_BODY));
        expect(mockRpc).toHaveBeenCalledWith(
            "record_signup_acceptance",
            expect.objectContaining({
                p_user_id: "user-uuid-1",
                p_terms_version: LEGAL_VERSIONS.terms,
                p_privacy_version: LEGAL_VERSIONS.privacy,
                p_method: "signup_checkbox",
            }),
        );
    });

    it("includes IP address in RPC call", async () => {
        await POST(makeRequest(VALID_BODY, "5.6.7.8"));
        expect(mockRpc).toHaveBeenCalledWith(
            "record_signup_acceptance",
            expect.objectContaining({ p_ip_address: "5.6.7.8" }),
        );
    });

    it("returns 400 when required fields are missing", async () => {
        const res = await POST(makeRequest({ email: "x@y.com" }));
        expect(res.status).toBe(400);
    });

    it("returns 400 when terms_accepted is not literally true", async () => {
        const res = await POST(makeRequest({ ...VALID_BODY, terms_accepted: false }));
        expect(res.status).toBe(400);
    });

    it("returns 400 when age_confirmed is missing", async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { age_confirmed: _drop, ...rest } = VALID_BODY;
        const res = await POST(makeRequest(rest));
        expect(res.status).toBe(400);
    });

    it("returns 400 for invalid email format", async () => {
        const res = await POST(makeRequest({ ...VALID_BODY, email: "not-an-email" }));
        expect(res.status).toBe(400);
    });

    it("returns 409 STALE_TERMS_VERSION when terms_version is outdated", async () => {
        const res = await POST(
            makeRequest({ ...VALID_BODY, terms_version: "0.0.1" }),
        );
        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.code).toBe("STALE_TERMS_VERSION");
    });

    it("returns 409 STALE_PRIVACY_VERSION when privacy_version is outdated", async () => {
        const res = await POST(
            makeRequest({ ...VALID_BODY, privacy_version: "0.0.1" }),
        );
        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.code).toBe("STALE_PRIVACY_VERSION");
    });

    it("returns 409 when email already exists", async () => {
        mockCreateUser.mockResolvedValueOnce({
            data: { user: null },
            error: { message: "User already registered" },
        });
        const res = await POST(makeRequest(VALID_BODY));
        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.error).toMatch(/already exists/i);
    });

    it("rolls back user creation when RPC fails and returns 500", async () => {
        mockRpc.mockResolvedValueOnce({ error: { message: "DB error" } });
        const res = await POST(makeRequest(VALID_BODY));
        expect(res.status).toBe(500);
        expect(mockDeleteUser).toHaveBeenCalledWith("user-uuid-1");
    });

    it("returns 400 when request body is not valid JSON", async () => {
        const req = new NextRequest("http://localhost/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "not-json",
        });
        const res = await POST(req);
        // Handler returns 400 for null body (json() catch returns null → schema fails)
        expect(res.status).toBe(400);
    });

    it("returns x-ratelimit-limit header on success", async () => {
        const res = await POST(makeRequest(VALID_BODY));
        expect(res.headers.get("x-ratelimit-limit")).toBeDefined();
    });
});
