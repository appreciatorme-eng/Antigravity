# Commit-Ready Codex Web Fixes

This file captures the exact verification and commit commands for the web-fix set only.

## 1) Verification commands (run from this repo root)

```bash
cd "projects/travel-suite/apps/web"
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
node -v
npm -v

# Fast syntax/transpile safety check for changed source files
node - <<'NODE'
const fs = require('fs');
const ts = require('typescript');
const path = require('path');
const files = [
  'src/lib/integrations.ts',
  'src/app/api/proposals/send-pdf/route.ts',
  'src/app/api/itinerary/share/route.ts',
  'src/app/api/payments/create-order/route.ts',
  'src/app/api/subscriptions/route.ts',
  'src/app/api/subscriptions/cancel/route.ts',
  'src/app/api/invoices/route.ts',
  'src/app/api/invoices/[id]/pay/route.ts',
  'src/app/api/payments/webhook/route.ts',
  'src/components/CreateTripModal.tsx',
  'src/components/itinerary-templates/TemplateSwitcher.tsx',
  'src/app/admin/layout.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/trips/page.tsx',
  'src/app/admin/clients/page.tsx',
  'src/app/admin/drivers/page.tsx',
  'src/app/admin/kanban/page.tsx',
  'src/app/admin/notifications/page.tsx',
  'src/app/admin/trips/[id]/page.tsx',
  'src/app/admin/planner/page.tsx',
  'src/app/admin/activity/page.tsx',
];
let failed = false;
for (const file of files) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`Missing: ${file}`);
    failed = true;
    continue;
  }
  const source = fs.readFileSync(abs, 'utf8');
  const result = ts.transpileModule(source, {
    fileName: abs,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      isolatedModules: true,
    },
  });
  if ((result.diagnostics || []).length) {
    failed = true;
    console.error(`Diagnostics found in ${file}`);
  }
}
if (failed) process.exit(1);
console.log('Transpile check passed for target files.');
NODE

# Full checks (run in your normal dev/CI runtime)
NEXT_TELEMETRY_DISABLED=1 npm run lint
NEXT_TELEMETRY_DISABLED=1 npm run build
```

## 2) Stage only the codex web-fix files

```bash
cd "/Users/justforfun/Documents/New project/Antigravity-codex-fix2"
git add \
  "projects/travel-suite/COMMIT_READY_CODEX_WEB_FIXES.md" \
  "projects/travel-suite/apps/web/.gitignore" \
  "projects/travel-suite/apps/web/.env.example" \
  "projects/travel-suite/apps/web/next.config.mjs" \
  "projects/travel-suite/apps/web/src/lib/integrations.ts" \
  "projects/travel-suite/apps/web/src/app/api/proposals/send-pdf/route.ts" \
  "projects/travel-suite/apps/web/src/app/api/itinerary/share/route.ts" \
  "projects/travel-suite/apps/web/src/app/api/payments/create-order/route.ts" \
  "projects/travel-suite/apps/web/src/app/api/subscriptions/route.ts" \
  "projects/travel-suite/apps/web/src/app/api/subscriptions/cancel/route.ts" \
  "projects/travel-suite/apps/web/src/app/api/invoices/route.ts" \
  "projects/travel-suite/apps/web/src/app/api/invoices/[id]/pay/route.ts" \
  "projects/travel-suite/apps/web/src/app/api/payments/webhook/route.ts" \
  "projects/travel-suite/apps/web/src/components/CreateTripModal.tsx" \
  "projects/travel-suite/apps/web/src/components/itinerary-templates/TemplateSwitcher.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/layout.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/settings/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/trips/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/clients/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/drivers/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/kanban/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/notifications/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/trips/[id]/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/planner/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/activity/page.tsx" \
  "projects/travel-suite/apps/web/src/app/admin/trips/[id]/page-old.tsx.backup" \
  "projects/travel-suite/apps/web/src/app/admin/analytics/templates/page-old.tsx.backup" \
  "projects/travel-suite/apps/web/src/app/admin/clients/[id]/page-old.tsx.backup" \
  "projects/travel-suite/apps/web/src/app/admin/drivers/[id]/page-old.tsx.backup" \
  "projects/travel-suite/apps/web/src/app/admin/proposals/[id]/page-old.tsx.backup" \
  "projects/travel-suite/apps/web/src/app/admin/proposals/page-old.tsx.backup" \
  "projects/travel-suite/apps/web/src/app/admin/revenue/page-old.tsx.backup" \
  "projects/travel-suite/apps/web/src/app/admin/settings/notifications/page-old.tsx.backup" \
  "projects/travel-suite/apps/web/src/app/admin/tour-templates/page-old.tsx.backup" \
  "projects/travel-suite/apps/web/next.config.ts"
```

## 3) Commit command

```bash
git commit -m "refactor(web): remove mock admin paths and gate optional integrations for dev"
```
