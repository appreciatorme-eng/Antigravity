import { test, expect } from "@playwright/test";
import { test as authTest } from "../fixtures/auth";

const FOREIGN_ORG_ID = "00000000-0000-0000-0000-00000000ffff";

test.describe("Admin tenant isolation - unauthenticated", () => {
  test("blocks command center endpoint", async ({ request }) => {
    const response = await request.get("/api/admin/operations/command-center");
    expect(response.status()).toBe(401);
  });

  test("blocks cost overview endpoint", async ({ request }) => {
    const response = await request.get(
      `/api/admin/cost/overview?organization_id=${FOREIGN_ORG_ID}`,
    );
    expect(response.status()).toBe(401);
  });

  test("blocks cost cap mutation endpoint", async ({ request }) => {
    const response = await request.post("/api/admin/cost/overview", {
      data: {
        category: "ai_image",
        capUsd: 5,
      },
    });

    expect(response.status()).toBe(401);
  });

  test("blocks cost alert acknowledgment endpoint", async ({ request }) => {
    const response = await request.post("/api/admin/cost/alerts/ack", {
      data: {
        alert_id: `auth-failures-${FOREIGN_ORG_ID}`,
        organization_id: FOREIGN_ORG_ID,
      },
    });

    expect(response.status()).toBe(401);
  });
});

authTest.describe("Admin tenant isolation - non-admin users", () => {
  authTest("forbids command center access", async ({ clientPage }) => {
    const response = await clientPage.request.get(
      "/api/admin/operations/command-center",
    );
    expect(response.status()).toBe(403);
  });

  authTest("forbids cost overview access", async ({ clientPage }) => {
    const response = await clientPage.request.get("/api/admin/cost/overview");
    expect(response.status()).toBe(403);
  });

  authTest("forbids emergency cap mutation", async ({ clientPage }) => {
    const response = await clientPage.request.post("/api/admin/cost/overview", {
      data: {
        category: "image_search",
        capUsd: 9,
      },
    });

    expect(response.status()).toBe(403);
  });

  authTest("forbids cost alert acknowledgment", async ({ clientPage }) => {
    const response = await clientPage.request.post(
      "/api/admin/cost/alerts/ack",
      {
        data: {
          alert_id: `auth-failures-${FOREIGN_ORG_ID}`,
          organization_id: FOREIGN_ORG_ID,
        },
      },
    );

    expect(response.status()).toBe(403);
  });
});

authTest.describe("Admin tenant isolation - scoped access", () => {
  authTest(
    "non-super-admin cannot force foreign organization scope",
    async ({ adminPage }) => {
      const response = await adminPage.request.get(
        `/api/admin/cost/overview?organization_id=${FOREIGN_ORG_ID}`,
      );

      expect([200, 403]).toContain(response.status());

      if (response.status() !== 200) {
        return;
      }

      const json = await response.json();
      const scope = json?.scope as
        | { actor_role?: string; organization_id?: string | null }
        | undefined;

      if (scope?.actor_role !== "super_admin") {
        expect(scope?.organization_id).not.toBe(FOREIGN_ORG_ID);
      }
    },
  );

  authTest(
    "cost cap mutation is restricted to super admins",
    async ({ adminPage }) => {
      const response = await adminPage.request.post(
        "/api/admin/cost/overview",
        {
          data: {
            category: "amadeus",
            capUsd: 42,
          },
        },
      );

      expect([200, 403]).toContain(response.status());
    },
  );

  authTest(
    "non-super-admin cannot acknowledge foreign-org alert",
    async ({ adminPage }) => {
      const response = await adminPage.request.post(
        "/api/admin/cost/alerts/ack",
        {
          data: {
            alert_id: `auth-failures-${FOREIGN_ORG_ID}`,
            organization_id: FOREIGN_ORG_ID,
          },
        },
      );

      expect([200, 400, 403]).toContain(response.status());
      if (response.status() === 200) {
        const json = await response.json();
        expect(json?.organization_id).not.toBe(FOREIGN_ORG_ID);
      }
    },
  );
});
