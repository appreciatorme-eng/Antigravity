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
        "src/lib/**/*.ts",
        "src/middleware.ts",
        "src/app/api/_handlers/**/*.ts",
      ],
      exclude: [
        "src/lib/**/*.d.ts",
        "src/lib/**/types.ts",
        "src/lib/**/index.ts",
      ],
      reporter: ["text", "json-summary"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
  },
});
