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
      all: false,
      include: [
        // Core lib
        "src/lib/api-dispatch.ts",
        "src/lib/api/**/*.ts",
        "src/lib/auth/**/*.ts",
        "src/lib/leads/**/*.ts",
        "src/lib/payments/errors.ts",
        "src/lib/payments/payment-links.server.ts",
        "src/lib/payments/payment-utils.ts",
        "src/lib/security/**/*.ts",
        "src/lib/share/**/*.ts",
        "src/middleware.ts",
        // Catch-all dispatchers
        "src/app/api/[...path]/route.ts",
        "src/app/api/admin/[...path]/route.ts",
        // Handler families
        "src/app/api/_handlers/admin/seed-demo/guards.ts",
        "src/app/api/_handlers/admin/seed-demo/route.ts",
        "src/app/api/_handlers/cron/**/*.ts",
        "src/app/api/_handlers/drivers/search/route.ts",
        "src/app/api/_handlers/notifications/process-queue/batch.ts",
        "src/app/api/_handlers/payments/**/*.ts",
        "src/app/api/_handlers/share/public-share.ts",
        "src/app/api/_handlers/webhooks/waha/secret.ts",
      ],
      exclude: [
        "src/lib/**/*.d.ts",
        "src/lib/**/types.ts",
        "src/lib/**/index.ts",
      ],
      reporter: ["text", "json-summary"],
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 75,
      },
    },
  },
});
