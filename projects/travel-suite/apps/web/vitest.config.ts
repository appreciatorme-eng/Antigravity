import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const testDir = fileURLToPath(new URL("./tests", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": srcDir,
      "server-only": `${testDir}/shims/server-only.ts`,
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      all: true,
      include: [
        "src/lib/auth/admin-helpers.ts",
        "src/lib/api/response.ts",
        "src/lib/security/admin-mutation-csrf.ts",
        "src/lib/security/cron-auth.ts",
        "src/lib/security/rate-limit.ts",
        "src/lib/security/safe-equal.ts",
        "src/lib/security/safe-error.ts",
        "src/lib/security/sanitize.ts",
        "src/lib/security/whatsapp-webhook-config.ts",
        "src/app/api/_handlers/admin/seed-demo/guards.ts",
        "src/app/api/_handlers/webhooks/waha/secret.ts",
        "src/app/api/_handlers/share/[token]/public-share.ts",
        "src/app/api/_handlers/notifications/process-queue/batch.ts",
        "src/middleware.ts",
        "src/app/api/_handlers/marketplace/route.ts",
        "src/app/api/_handlers/drivers/search/route.ts",
      ],
      reporter: ["text", "json-summary"],
      thresholds: {
        lines: 80,
      },
    },
  },
});
