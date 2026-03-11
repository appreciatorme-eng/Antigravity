// Unit tests for require-super-admin.ts — tests the super_admin role guard.

import { describe, it, expect, vi } from "vitest";

const requireAdminMock = vi.fn();

vi.mock("@/lib/auth/admin", () => ({
    requireAdmin: (...args: unknown[]) => requireAdminMock(...args),
}));

const { requireSuperAdmin } = await import("@/lib/auth/require-super-admin");

function makeRequest(headers: Record<string, string> = {}): Request {
    return new Request("http://localhost/api/superadmin/me", {
        method: "GET",
        headers,
    });
}

describe("requireSuperAdmin", () => {
    it("passes through failure from requireAdmin unchanged", async () => {
        const failResponse = new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        requireAdminMock.mockResolvedValue({ ok: false, response: failResponse });

        const result = await requireSuperAdmin(makeRequest());

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.response.status).toBe(401);
        }
    });

    it("returns 403 when admin is authenticated but not super_admin", async () => {
        requireAdminMock.mockResolvedValue({
            ok: true,
            isSuperAdmin: false,
            user: { id: "user-1" },
            profile: { role: "admin" },
        });

        const result = await requireSuperAdmin(makeRequest({ authorization: "Bearer token" }));

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.response.status).toBe(403);
            const body = await result.response.json();
            expect(body.error).toContain("super_admin");
        }
    });

    it("returns success when user has super_admin role", async () => {
        const successPayload = {
            ok: true,
            isSuperAdmin: true,
            user: { id: "super-1" },
            profile: { role: "super_admin" },
        };
        requireAdminMock.mockResolvedValue(successPayload);

        const result = await requireSuperAdmin(makeRequest({ authorization: "Bearer token" }));

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.isSuperAdmin).toBe(true);
        }
    });
});
