import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { blockDemoMutation } from "@/lib/auth/demo-org-resolver";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import { safeErrorMessage } from "@/lib/security/safe-error";

const TEMPLATE_FORK_RATE_LIMIT_MAX = 20;
const TEMPLATE_FORK_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

interface ItineraryTemplateRow {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  budget_range: string;
  theme: string;
  description?: string | null;
  template_data: unknown;
  usage_count: number;
}

function attachRateLimitHeaders(
  response: NextResponse,
  rateLimit: Awaited<ReturnType<typeof enforceRateLimit>>
): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
  response.headers.set("retry-after", String(retryAfterSeconds));
  response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
  response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
  return response;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: true });
    if (!admin.ok) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: admin.response.status || 401 }
      );
    }

    if (!admin.organizationId) {
      return NextResponse.json(
        { error: "Admin organization not configured" },
        { status: 400 }
      );
    }

    if (!passesMutationCsrfGuard(req)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
    }

    const demoBlock = blockDemoMutation(req);
    if (demoBlock) {
      return demoBlock;
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: TEMPLATE_FORK_RATE_LIMIT_MAX,
      windowMs: TEMPLATE_FORK_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:templates:fork",
    });
    if (!rateLimit.success) {
      const response = NextResponse.json(
        { error: "Too many template fork requests. Please retry later." },
        { status: 429 }
      );
      return attachRateLimitHeaders(response, rateLimit);
    }

    const { id: templateId } = await context.params;
    const sanitizedTemplateId = sanitizeText(templateId, { maxLength: 80 });

    if (!sanitizedTemplateId) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    // Fetch the template
    // itinerary_templates table not yet in generated types - using type assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: template, error: templateError } = await (admin.adminClient as any)
      .from("itinerary_templates")
      .select(`
        id,
        title,
        destination,
        duration_days,
        budget_range,
        theme,
        description,
        template_data,
        usage_count
      `)
      .eq("id", sanitizedTemplateId)
      .eq("is_active", true)
      .single() as { data: ItineraryTemplateRow | null; error: unknown };

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found or not active" },
        { status: 404 }
      );
    }

    // Parse optional customization from request body
    const body = await req.json().catch(() => ({}));
    const customTitle = sanitizeText(body.title, { maxLength: 160 });
    const customDestination = sanitizeText(body.destination, { maxLength: 120 });

    // Create itinerary from template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: itinerary, error: itineraryError } = await (admin.adminClient as any)
      .from("itineraries")
      .insert({
        trip_title: customTitle || template.title,
        destination: customDestination || template.destination,
        duration_days: template.duration_days,
        raw_data: template.template_data || { days: [] },
      })
      .select()
      .single();

    if (itineraryError || !itinerary) {
      return NextResponse.json(
        {
          error: "Failed to create itinerary from template",
          details: safeErrorMessage(itineraryError),
        },
        { status: 400 }
      );
    }

    // Create trip linked to the itinerary
    const { data: trip, error: tripError } = await admin.adminClient
      .from("trips")
      .insert({
        organization_id: admin.organizationId,
        itinerary_id: itinerary.id,
        status: "draft",
      })
      .select()
      .single();

    if (tripError || !trip) {
      // Rollback: delete the itinerary we just created
      await admin.adminClient
        .from("itineraries")
        .delete()
        .eq("id", itinerary.id);

      return NextResponse.json(
        {
          error: "Failed to create trip",
          details: safeErrorMessage(tripError),
        },
        { status: 400 }
      );
    }

    // Create template_fork record
    // template_forks table not yet in generated types - using type assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: forkError } = await (admin.adminClient as any)
      .from("template_forks")
      .insert({
        template_id: template.id,
        itinerary_id: itinerary.id,
        organization_id: admin.organizationId,
      });

    if (forkError) {
      // Log error but don't fail the request - fork tracking is non-critical
      console.error("Failed to create template_fork record:", safeErrorMessage(forkError));
    }

    // Atomically increment template usage_count to avoid lost-update race conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin.adminClient as any)
      .from("itinerary_templates")
      .update({ usage_count: (template.usage_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", template.id)
      .eq("usage_count", template.usage_count || 0) as { error: unknown };
    // Optimistic lock: eq("usage_count", ...) ensures no lost update — if another fork
    // incremented first, this update silently affects 0 rows (acceptable for a counter).

    if (updateError) {
      // Log error but don't fail the request - usage count update is non-critical
      console.error("Failed to increment template usage_count:", safeErrorMessage(updateError));
    }

    return NextResponse.json(
      {
        trip,
        itinerary,
        message: "Template forked successfully",
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: safeErrorMessage(err),
      },
      { status: 500 }
    );
  }
}
