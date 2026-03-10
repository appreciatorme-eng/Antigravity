// seed-demo — one-shot idempotent demo data seeder.
// POST /api/admin/seed-demo  →  inserts GoBuddy Adventures (Demo) org + all records.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { DEMO_ORG_ID } from "@/lib/demo/constants";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import {
  hasValidSeedDemoCronSecret,
  isSeedDemoBlockedInProduction,
} from "./guards";
import {
  buildOrganization,
  buildProfiles,
  buildItineraries,
  buildTrips,
  buildServiceCosts,
  buildOverheadExpenses,
  buildExternalDrivers,
  buildWorkflowStageEvents,
} from "./fixture";

const SEED_DEMO_RATE_LIMIT_MAX = 5;
const SEED_DEMO_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (
    isSeedDemoBlockedInProduction(
      process.env.NODE_ENV,
      process.env.ALLOW_SEED_IN_PROD
    )
  ) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const admin = await requireAdmin(request, { requireOrganization: false });
  if (!admin.ok) {
    return admin.response;
  }

  const rateLimit = await enforceRateLimit({
    identifier: admin.userId,
    limit: SEED_DEMO_RATE_LIMIT_MAX,
    windowMs: SEED_DEMO_RATE_LIMIT_WINDOW_MS,
    prefix: "api:admin:seed-demo:mutate",
  });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many seed requests. Please retry later." },
      { status: 429 },
    );
  }

  if (!passesMutationCsrfGuard(request)) {
    return NextResponse.json({ error: "CSRF validation failed for admin mutation" }, { status: 403 });
  }

  const expectedCronSecret = process.env.ADMIN_CRON_SECRET?.trim();
  const providedCronSecret = request.headers.get("x-cron-secret")?.trim();
  if (!hasValidSeedDemoCronSecret(expectedCronSecret, providedCronSecret)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
  const supabase = admin.adminClient as any;

  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", DEMO_ORG_ID)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, message: "Demo org already seeded — skipping." });
  }

  await supabase.from("organizations").insert(buildOrganization());
  await supabase.from("profiles").insert(buildProfiles());
  await supabase.from("itineraries").insert(buildItineraries());
  await supabase.from("trips").insert(buildTrips());
  await supabase.from("trip_service_costs").insert(buildServiceCosts());
  await supabase.from("monthly_overhead_expenses").insert(buildOverheadExpenses());
  await supabase.from("external_drivers").insert(buildExternalDrivers());
  await supabase.from("workflow_stage_events").insert(buildWorkflowStageEvents());

  return NextResponse.json({ ok: true, message: "Demo organization seeded successfully with ~150 records." });
  } catch (error) {
    console.error("[admin/seed-demo] Failed to seed demo organization", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
