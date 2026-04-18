import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const requireSuperAdminMock = vi.fn();
const listAccountsMock = vi.fn();
const loadGodWorkItemsMock = vi.fn();
const runtimeProbeMock = vi.fn();

vi.mock("@/lib/auth/require-super-admin", () => ({
  requireSuperAdmin: (...args: unknown[]) => requireSuperAdminMock(...args),
}));

vi.mock("@/lib/platform/god-accounts", () => ({
  listAccounts: (...args: unknown[]) => listAccountsMock(...args),
  loadGodWorkItems: (...args: unknown[]) => loadGodWorkItemsMock(...args),
}));

vi.mock("@/lib/platform/runtime-probes", () => ({
  checkDatabaseRuntime: (...args: unknown[]) => runtimeProbeMock(...args),
  checkFirebaseFcmRuntime: (...args: unknown[]) => runtimeProbeMock(...args),
  checkPosthogRuntime: (...args: unknown[]) => runtimeProbeMock(...args),
  checkRedisRuntime: (...args: unknown[]) => runtimeProbeMock(...args),
  checkSentryRuntime: (...args: unknown[]) => runtimeProbeMock(...args),
  checkWhatsappRuntime: (...args: unknown[]) => runtimeProbeMock(...args),
}));

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    constructor() {}
  },
}));

function makeQueryResult(data: unknown = [], count = 0) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    gt: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn(() => query),
    limit: vi.fn(() => query),
    or: vi.fn(() => query),
    not: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, count }),
    then: (resolve: (value: { data: unknown; count: number }) => unknown) => Promise.resolve({ data, count }).then(resolve),
    catch: (reject: (reason: unknown) => unknown) => Promise.resolve({ data, count }).catch(reject),
  };
  return query;
}

async function loadRoute() {
  vi.resetModules();
  return import("../../../src/app/api/_handlers/superadmin/overview/route");
}

beforeEach(() => {
  vi.clearAllMocks();
  requireSuperAdminMock.mockResolvedValue({
    ok: true,
    userId: "user-1",
    adminClient: {
      from: vi.fn(() => makeQueryResult()),
    },
  });
  listAccountsMock.mockResolvedValue({ accounts: [], total: 0, page: 0, pages: 1 });
  loadGodWorkItemsMock.mockResolvedValue([]);
  runtimeProbeMock.mockResolvedValue({ status: "healthy", detail: "ok", configured: true });
});

it("returns an executive overview payload with data-quality metadata", async () => {
  const { GET } = await loadRoute();
  const response = await GET(new NextRequest("http://localhost/api/superadmin/overview"));
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(payload.meta.data_quality.completeness).toBe("partial");
  expect(Array.isArray(payload.meta.data_quality.notes)).toBe(true);
});
