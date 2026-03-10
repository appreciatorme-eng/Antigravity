// Unit tests for requireAdmin — auth gate for admin API routes.
// All external dependencies (supabase, rate-limit, platform settings) are mocked.

import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockAdminClient = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

const mockIsMaintenanceMode = vi.fn().mockResolvedValue(false);
const mockIsOrgSuspended = vi.fn().mockResolvedValue(false);

vi.mock("@/lib/platform/settings", () => ({
  isMaintenanceMode: (...args: unknown[]) => mockIsMaintenanceMode(...args),
  isOrgSuspended: (...args: unknown[]) => mockIsOrgSuspended(...args),
}));

const mockNormalizeBearerToken = vi.fn();
const mockParseRole = vi.fn();
const mockShouldRecordAuthFailure = vi.fn().mockReturnValue(false);

vi.mock("@/lib/auth/admin-helpers", () => ({
  normalizeBearerToken: (...args: unknown[]) =>
    mockNormalizeBearerToken(...args),
  parseRole: (...args: unknown[]) => mockParseRole(...args),
  shouldRecordAuthFailure: (...args: unknown[]) =>
    mockShouldRecordAuthFailure(...args),
}));

import { requireAdmin } from "../../../src/lib/auth/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string): NextRequest {
  return new NextRequest(url);
}

function setupAuth(userId: string | null) {
  mockNormalizeBearerToken.mockReturnValue(null);
  if (userId === null) {
    vi.mocked(createServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never);
  } else {
    vi.mocked(createServerClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: userId } } }),
      },
    } as never);
  }
}

function setupProfile(
  profile: {
    id: string;
    role: string | null;
    organization_id: string | null;
  } | null,
  error?: Error,
) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: profile, error: error ?? null }),
      }),
    }),
    insert: vi.fn().mockResolvedValue({ error: null }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockIsMaintenanceMode.mockResolvedValue(false);
  mockIsOrgSuspended.mockResolvedValue(false);
  mockShouldRecordAuthFailure.mockReturnValue(false);
  mockNormalizeBearerToken.mockReturnValue(null);
  vi.mocked(createServerClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  } as never);
});

describe("requireAdmin", () => {
  it("returns 401 when no user is authenticated", async () => {
    setupAuth(null);
    setupProfile(null);

    const result = await requireAdmin(
      makeRequest("http://localhost/api/admin/x"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 403 when profile is not found", async () => {
    setupAuth("user-1");
    setupProfile(null);
    mockParseRole.mockReturnValue("admin");

    const result = await requireAdmin(
      makeRequest("http://localhost/api/admin/x"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("returns 403 when role is not an admin role", async () => {
    setupAuth("user-1");
    setupProfile({ id: "user-1", role: "user", organization_id: "org-1" });
    mockParseRole.mockReturnValue(null);

    const result = await requireAdmin(
      makeRequest("http://localhost/api/admin/x"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("returns 400 when organization is missing for non-super-admin", async () => {
    setupAuth("user-1");
    setupProfile({ id: "user-1", role: "admin", organization_id: null });
    mockParseRole.mockReturnValue("admin");

    const result = await requireAdmin(
      makeRequest("http://localhost/api/admin/x"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toContain("organization not configured");
    }
  });

  it("allows super_admin without organization", async () => {
    setupAuth("user-1");
    setupProfile({ id: "user-1", role: "super_admin", organization_id: null });
    mockParseRole.mockReturnValue("super_admin");

    const result = await requireAdmin(
      makeRequest("http://localhost/api/admin/x"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isSuperAdmin).toBe(true);
    }
  });

  it("returns 503 during maintenance mode for regular routes", async () => {
    setupAuth("user-1");
    setupProfile({ id: "user-1", role: "admin", organization_id: "org-1" });
    mockParseRole.mockReturnValue("admin");
    mockIsMaintenanceMode.mockResolvedValue(true);

    const result = await requireAdmin(
      makeRequest("http://localhost/api/admin/x"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(503);
    }
  });

  it("bypasses maintenance check for /api/superadmin routes", async () => {
    setupAuth("user-1");
    setupProfile({ id: "user-1", role: "admin", organization_id: "org-1" });
    mockParseRole.mockReturnValue("admin");
    mockIsMaintenanceMode.mockResolvedValue(true);

    const result = await requireAdmin(
      makeRequest("http://localhost/api/superadmin/overview"),
    );

    expect(result.ok).toBe(true);
  });

  it("returns 403 when organization is suspended", async () => {
    setupAuth("user-1");
    setupProfile({ id: "user-1", role: "admin", organization_id: "org-1" });
    mockParseRole.mockReturnValue("admin");
    mockIsOrgSuspended.mockResolvedValue(true);

    const result = await requireAdmin(
      makeRequest("http://localhost/api/admin/x"),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("bypasses suspension check for super_admin on /api/superadmin routes", async () => {
    setupAuth("user-1");
    setupProfile({
      id: "user-1",
      role: "super_admin",
      organization_id: "org-1",
    });
    mockParseRole.mockReturnValue("super_admin");
    mockIsOrgSuspended.mockResolvedValue(true);

    const result = await requireAdmin(
      makeRequest("http://localhost/api/superadmin/x"),
    );

    expect(result.ok).toBe(true);
  });

  it("returns ok:true with correct shape on success", async () => {
    setupAuth("user-1");
    setupProfile({
      id: "user-1",
      role: "admin",
      organization_id: "org-123",
    });
    mockParseRole.mockReturnValue("admin");

    const result = await requireAdmin(
      makeRequest("http://localhost/api/admin/x"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userId).toBe("user-1");
      expect(result.organizationId).toBe("org-123");
      expect(result.isSuperAdmin).toBe(false);
      expect(result.role).toBe("admin");
      expect(result.adminClient).toBe(mockAdminClient);
    }
  });

  it("extracts userId from bearer token", async () => {
    mockNormalizeBearerToken.mockReturnValue("valid-token");
    mockGetUser.mockResolvedValue({
      data: { user: { id: "token-user" } },
      error: null,
    });
    setupProfile({
      id: "token-user",
      role: "admin",
      organization_id: "org-1",
    });
    mockParseRole.mockReturnValue("admin");

    const result = await requireAdmin(
      makeRequest("http://localhost/api/admin/x"),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userId).toBe("token-user");
    }
  });
});
