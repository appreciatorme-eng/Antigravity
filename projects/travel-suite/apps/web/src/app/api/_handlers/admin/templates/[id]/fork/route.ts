import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";
import { resolveDemoOrg, blockDemoMutation } from "@/lib/auth/demo-org-resolver";
import { passesMutationCsrfGuard } from "@/lib/security/admin-mutation-csrf";
import { safeErrorMessage } from "@/lib/security/safe-error";

const TEMPLATE_FORK_RATE_LIMIT_MAX = 20;
const TEMPLATE_FORK_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

type AdminContext = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;

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

    const csrfCheck = passesMutationCsrfGuard(req);
    if (!csrfCheck.ok) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    const demoBlock = blockDemoMutation(req);
    if (demoBlock.blocked) {
      return NextResponse.json(
        { error: "Demo mode does not allow template forking" },
        { status: 403 }
      );
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
    const { data: template, error: templateError } = await admin.adminClient
      .from("itinerary_templates")
      .select(`
        id,
        title,
        destination,
        duration_days,
        budget_range,
        theme,
        description,
        daily_plans,
        usage_count
      `)
      .eq("id", sanitizedTemplateId)
      .eq("is_active", true)
      .single();

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
    const { data: itinerary, error: itineraryError } = await admin.adminClient
      .from("itineraries")
      .insert({
        organization_id: admin.organizationId,
        trip_title: customTitle || template.title,
        destination: customDestination || template.destination,
        duration_days: template.duration_days,
        theme: template.theme || "general",
        description: template.description,
        daily_plans: template.daily_plans || [],
        estimated_budget: null,
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
    const { error: forkError } = await admin.adminClient
      .from("template_forks")
      .insert({
        template_id: template.id,
        itinerary_id: trip.id,
        organization_id: admin.organizationId,
        forked_at: new Date().toISOString(),
        trip_completed: false,
      });

    if (forkError) {
      // Log error but don't fail the request - fork tracking is non-critical
      console.error("Failed to create template_fork record:", safeErrorMessage(forkError));
    }

    // Increment template usage_count
    const { error: updateError } = await admin.adminClient
      .from("itinerary_templates")
      .update({
        usage_count: (template.usage_count || 0) + 1,
      })
      .eq("id", template.id);

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
