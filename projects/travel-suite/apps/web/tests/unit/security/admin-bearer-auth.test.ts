import { beforeEach, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

async function loadModule() {
  vi.resetModules();
  return import("../../../src/lib/security/admin-bearer-auth");
}

beforeEach(() => {
  vi.clearAllMocks();
  maybeSingleMock.mockResolvedValue({ data: { role: "admin" }, error: null });
  createAdminClientMock.mockReturnValue({
    auth: {
      getUser: getUserMock,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: maybeSingleMock,
        })),
      })),
    })),
  });
});

it("rejects missing or malformed bearer headers", async () => {
  const { isAdminBearerToken } = await loadModule();

  await expect(isAdminBearerToken(null)).resolves.toBe(false);
  await expect(isAdminBearerToken("Basic token")).resolves.toBe(false);
});

it("rejects unknown users", async () => {
  getUserMock.mockResolvedValueOnce({ data: { user: null }, error: null });

  const { isAdminBearerToken } = await loadModule();

  await expect(isAdminBearerToken("Bearer token-123")).resolves.toBe(false);
});

it("rejects non-admin roles", async () => {
  getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
  maybeSingleMock.mockResolvedValueOnce({ data: { role: "user" }, error: null });

  const { isAdminBearerToken } = await loadModule();

  await expect(isAdminBearerToken("Bearer token-123")).resolves.toBe(false);
});

it("accepts admin and super_admin roles", async () => {
  getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });

  const { isAdminBearerToken } = await loadModule();
  await expect(isAdminBearerToken("Bearer token-123")).resolves.toBe(true);

  maybeSingleMock.mockResolvedValueOnce({ data: { role: "super_admin" }, error: null });
  getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-2" } }, error: null });
  await expect(isAdminBearerToken("Bearer token-456")).resolves.toBe(true);
});
