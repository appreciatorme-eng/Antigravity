import { test as authTest, expect } from "../fixtures/auth";

authTest.describe("Admin cost overview cache contracts", () => {
  authTest(
    "serves stale fallback when live query fails in test mode",
    async ({ adminPage }) => {
      const warm = await adminPage.request.get(
        "/api/admin/cost/overview?days=7",
      );
      expect([200, 400, 403]).toContain(warm.status());
      if (warm.status() !== 200) return;

      const warmJson = await warm.json();
      expect(warmJson?.cache?.status).toBeTruthy();

      const stale = await adminPage.request.get(
        "/api/admin/cost/overview?days=7",
        {
          headers: {
            "x-test-cost-overview-force-failure": "1",
          },
        },
      );

      expect(stale.status()).toBe(200);
      const staleJson = await stale.json();
      expect(staleJson?.cache?.status).toBe("stale_fallback");
    },
  );
});
