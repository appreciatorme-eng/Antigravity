// Unit tests for demo-org-resolver.ts — full branch coverage.
// Tests resolveDemoOrg, blockDemoMutation, and resolveScopedOrgWithDemo.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    resolveDemoOrg,
    blockDemoMutation,
    resolveScopedOrgWithDemo,
} from "../../../src/lib/auth/demo-org-resolver";

const FALLBACK_DEMO_ORG_ID = "d0000000-0000-4000-8000-000000000001";

function makeRequest(method: string, demoOrgId?: string): Request {
    const headers: Record<string, string> = {};
    if (demoOrgId !== undefined) {
        headers["X-Demo-Org-Id"] = demoOrgId;
    }
    return new Request("http://localhost/api/test", { method, headers });
}

describe("resolveDemoOrg", () => {
    beforeEach(() => {
        delete process.env.NEXT_PUBLIC_DEMO_ORG_ID;
    });

    afterEach(() => {
        delete process.env.NEXT_PUBLIC_DEMO_ORG_ID;
    });

    it("returns isDemoMode=true when header matches DEMO_ORG_ID fallback", () => {
        const req = makeRequest("GET", FALLBACK_DEMO_ORG_ID);
        const result = resolveDemoOrg(req);
        expect(result.isDemoMode).toBe(true);
        expect(result.demoOrgId).toBe(FALLBACK_DEMO_ORG_ID);
    });

    it("returns isDemoMode=false when header is a different org id", () => {
        const req = makeRequest("GET", "aaaaaaaa-0000-4000-8000-000000000099");
        const result = resolveDemoOrg(req);
        expect(result.isDemoMode).toBe(false);
        expect(result.demoOrgId).toBeNull();
    });

    it("returns isDemoMode=false when no X-Demo-Org-Id header is present", () => {
        const req = makeRequest("GET");
        const result = resolveDemoOrg(req);
        expect(result.isDemoMode).toBe(false);
        expect(result.demoOrgId).toBeNull();
    });

    it("uses NEXT_PUBLIC_DEMO_ORG_ID env var when set", async () => {
        const customId = "eeeeeeee-0000-4000-8000-000000000002";
        process.env.NEXT_PUBLIC_DEMO_ORG_ID = customId;
        vi.resetModules();

        const { resolveDemoOrg: freshResolve } = await import(
            "../../../src/lib/auth/demo-org-resolver"
        );

        const req = makeRequest("GET", customId);
        const result = freshResolve(req);
        expect(result.isDemoMode).toBe(true);
        expect(result.demoOrgId).toBe(customId);
    });
});

describe("blockDemoMutation", () => {
    it("returns null for GET requests even in demo mode", () => {
        const req = makeRequest("GET", FALLBACK_DEMO_ORG_ID);
        expect(blockDemoMutation(req)).toBeNull();
    });

    it("returns null for OPTIONS requests even in demo mode", () => {
        const req = makeRequest("OPTIONS", FALLBACK_DEMO_ORG_ID);
        expect(blockDemoMutation(req)).toBeNull();
    });

    it("returns 403 for POST requests in demo mode", async () => {
        const req = makeRequest("POST", FALLBACK_DEMO_ORG_ID);
        const response = blockDemoMutation(req);
        expect(response).not.toBeNull();
        expect(response!.status).toBe(403);
        const body = await response!.json();
        expect(body.error).toContain("Demo Mode");
    });

    it("returns 403 for PATCH requests in demo mode", async () => {
        const req = makeRequest("PATCH", FALLBACK_DEMO_ORG_ID);
        const response = blockDemoMutation(req);
        expect(response).not.toBeNull();
        expect(response!.status).toBe(403);
    });

    it("returns 403 for DELETE requests in demo mode", async () => {
        const req = makeRequest("DELETE", FALLBACK_DEMO_ORG_ID);
        const response = blockDemoMutation(req);
        expect(response).not.toBeNull();
        expect(response!.status).toBe(403);
    });

    it("returns null for POST requests when NOT in demo mode", () => {
        const req = makeRequest("POST");
        expect(blockDemoMutation(req)).toBeNull();
    });

    it("returns null for POST requests with wrong demo org id", () => {
        const req = makeRequest("POST", "wrong-org-id");
        expect(blockDemoMutation(req)).toBeNull();
    });
});

describe("resolveScopedOrgWithDemo", () => {
    it("returns demoOrgId when request is in demo mode", () => {
        const req = makeRequest("GET", FALLBACK_DEMO_ORG_ID);
        const result = resolveScopedOrgWithDemo(req, "real-org-id");
        expect(result).toBe(FALLBACK_DEMO_ORG_ID);
    });

    it("returns adminOrgId when request is NOT in demo mode", () => {
        const req = makeRequest("GET");
        const result = resolveScopedOrgWithDemo(req, "real-org-id");
        expect(result).toBe("real-org-id");
    });

    it("returns null adminOrgId when not demo and adminOrgId is null", () => {
        const req = makeRequest("GET");
        const result = resolveScopedOrgWithDemo(req, null);
        expect(result).toBeNull();
    });

    it("returns demoOrgId (not null adminOrgId) when in demo mode", () => {
        const req = makeRequest("GET", FALLBACK_DEMO_ORG_ID);
        const result = resolveScopedOrgWithDemo(req, null);
        expect(result).toBe(FALLBACK_DEMO_ORG_ID);
    });
});
