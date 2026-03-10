import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isServiceRoleBearer } from "../../../src/lib/security/service-role-auth";

const TEST_SERVICE_KEY = "test-service-role-key-abc123";

describe("isServiceRoleBearer", () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
        originalEnv = process.env.SUPABASE_SERVICE_ROLE_KEY;
        process.env.SUPABASE_SERVICE_ROLE_KEY = TEST_SERVICE_KEY;
    });

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        } else {
            process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv;
        }
    });

    it("returns false when auth header is null", () => {
        expect(isServiceRoleBearer(null)).toBe(false);
    });

    it("returns false when auth header is empty", () => {
        expect(isServiceRoleBearer("")).toBe(false);
    });

    it("returns false when SUPABASE_SERVICE_ROLE_KEY is not set", () => {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        expect(isServiceRoleBearer(`Bearer ${TEST_SERVICE_KEY}`)).toBe(false);
    });

    it("returns false when SUPABASE_SERVICE_ROLE_KEY is empty string", () => {
        process.env.SUPABASE_SERVICE_ROLE_KEY = "";
        expect(isServiceRoleBearer(`Bearer ${TEST_SERVICE_KEY}`)).toBe(false);
    });

    it("returns false when SUPABASE_SERVICE_ROLE_KEY is whitespace only", () => {
        process.env.SUPABASE_SERVICE_ROLE_KEY = "   ";
        expect(isServiceRoleBearer(`Bearer ${TEST_SERVICE_KEY}`)).toBe(false);
    });

    it("returns false when auth header does not start with 'Bearer '", () => {
        expect(isServiceRoleBearer(TEST_SERVICE_KEY)).toBe(false);
        expect(isServiceRoleBearer(`Token ${TEST_SERVICE_KEY}`)).toBe(false);
        expect(isServiceRoleBearer(`Basic ${TEST_SERVICE_KEY}`)).toBe(false);
    });

    it("returns false when bearer token does not match service role key", () => {
        expect(isServiceRoleBearer("Bearer wrong-key")).toBe(false);
        expect(isServiceRoleBearer("Bearer ")).toBe(false);
        expect(isServiceRoleBearer(`Bearer ${TEST_SERVICE_KEY}x`)).toBe(false);
    });

    it("returns true when bearer token matches service role key", () => {
        expect(isServiceRoleBearer(`Bearer ${TEST_SERVICE_KEY}`)).toBe(true);
    });

    it("handles 'bearer' vs 'Bearer' case sensitivity correctly", () => {
        expect(isServiceRoleBearer(`bearer ${TEST_SERVICE_KEY}`)).toBe(false);
        expect(isServiceRoleBearer(`BEARER ${TEST_SERVICE_KEY}`)).toBe(false);
        expect(isServiceRoleBearer(`Bearer ${TEST_SERVICE_KEY}`)).toBe(true);
    });

    it("trims whitespace from the service role key env var", () => {
        process.env.SUPABASE_SERVICE_ROLE_KEY = `  ${TEST_SERVICE_KEY}  `;
        expect(isServiceRoleBearer(`Bearer ${TEST_SERVICE_KEY}`)).toBe(true);
    });
});
