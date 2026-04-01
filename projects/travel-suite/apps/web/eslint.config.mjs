import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}", "e2e/**/*.{ts,tsx}", "tailwind.config.ts"],
    rules: {
      // Legacy debt is tracked in REMEDIATION_TRACKER; keep these visible while
      // preventing release-blocking failures during phased remediation.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-require-imports": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "prefer-const": "error",
      // Prevent bare fetch() for mutations — must use authedFetch() to avoid CSRF errors.
      // This catches: fetch("/api/...", { method: "POST" }) and similar patterns.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.name='fetch'][arguments.1.properties] > ObjectExpression > Property[key.name='method'][value.value=/^(POST|PUT|PATCH|DELETE)$/i]",
          message: "Use authedFetch() from @/lib/api/authed-fetch instead of bare fetch() for mutations. Bare fetch() will fail CSRF validation.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // Test artifacts
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
    // One-off local scripts used for migration/debugging.
    "apply-rag-migrations.mjs",
    "fix-env.js",
    "test-anon.js",
    "test-local.js",
    "test-query.js",
  ]),
]);

export default eslintConfig;
