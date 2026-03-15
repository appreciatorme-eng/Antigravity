// seed-demo — one-shot idempotent demo data seeder.
// POST /api/admin/seed-demo  →  inserts GoBuddy Adventures (Demo) org + all records.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import type { SupabaseClient } from "@supabase/supabase-js";
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
    return apiError("Not available in production", 403);
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
    return apiError("CSRF validation failed for admin mutation", 403);
  }

  const expectedCronSecret = process.env.ADMIN_CRON_SECRET?.trim();
  const providedCronSecret = request.headers.get("x-cron-secret")?.trim();
  if (!hasValidSeedDemoCronSecret(expectedCronSecret, providedCronSecret)) {
    return apiError("Forbidden", 403);
  }

  try {
  const supabase = admin.adminClient;

  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", DEMO_ORG_ID)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, message: "Demo org already seeded — skipping." });
  }

  // Fixture data may include columns (e.g. external_drivers.name) that exist in the
  // live DB but are not yet reflected in the generated Database types. Use an untyped
  // SupabaseClient for seed inserts to avoid false type errors.
  const seedClient = supabase as unknown as SupabaseClient;
  await seedClient.from("organizations").insert(buildOrganization());
  await seedClient.from("profiles").insert(buildProfiles());
  await seedClient.from("itineraries").insert(buildItineraries());
  await seedClient.from("trips").insert(buildTrips());
  await seedClient.from("trip_service_costs").insert(buildServiceCosts());
  await seedClient.from("monthly_overhead_expenses").insert(buildOverheadExpenses());
  await seedClient.from("external_drivers").insert(buildExternalDrivers());
  await seedClient.from("workflow_stage_events").insert(buildWorkflowStageEvents());

  return NextResponse.json({ ok: true, message: "Demo organization seeded successfully with ~150 records." });
  } catch (error) {
    console.error("[admin/seed-demo] Failed to seed demo organization", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
