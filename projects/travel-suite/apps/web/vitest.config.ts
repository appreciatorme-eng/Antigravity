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
        // Core lib — directories / files that have dedicated test suites
        "src/lib/api-dispatch.ts",
        "src/lib/api/**/*.ts",
        "src/lib/auth/**/*.ts",
        "src/lib/leads/**/*.ts",
        "src/lib/payments/errors.ts",
        "src/lib/payments/payment-utils.ts",
        // Individual security files that are directly unit-tested
        "src/lib/security/admin-mutation-csrf.ts",
        "src/lib/security/cron-auth.ts",
        "src/lib/security/rate-limit.ts",
        "src/lib/security/safe-equal.ts",
        "src/lib/security/safe-error.ts",
        "src/lib/security/sanitize.ts",
        "src/lib/security/service-role-auth.ts",
        "src/lib/security/social-oauth-state.ts",
        "src/lib/security/social-token-crypto.ts",
        "src/lib/security/whatsapp-webhook-config.ts",
        "src/lib/share/**/*.ts",
        "src/middleware.ts",
        // Handler files that have corresponding route tests
        // (marketplace, proposals/create, share/[token]/route, waha/route excluded: too complex to unit-test without integration infra)
        "src/app/api/_handlers/admin/seed-demo/guards.ts",
        "src/app/api/_handlers/admin/seed-demo/route.ts",
        "src/app/api/_handlers/drivers/search/route.ts",
        "src/app/api/_handlers/notifications/process-queue/batch.ts",
        "src/app/api/_handlers/payments/create-order/route.ts",
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
