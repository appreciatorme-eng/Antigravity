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
        trip_title: customTitle || (template as any).title,
        destination: customDestination || (template as any).destination,
        duration_days: (template as any).duration_days,
        raw_data: (template as any).template_data || { days: [] },
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
    const { error: forkError } = await (admin.adminClient as any)
      .from("template_forks")
      .insert({
        template_id: (template as any).id,
        itinerary_id: itinerary.id,
        organization_id: admin.organizationId,
      });

    if (forkError) {
      // Log error but don't fail the request - fork tracking is non-critical
      console.error("Failed to create template_fork record:", safeErrorMessage(forkError));
    }

    // Increment template usage_count
    // itinerary_templates table not yet in generated types - using type assertion
    const { error: updateError } = await (admin.adminClient as any)
      .from("itinerary_templates")
      .update({
        usage_count: ((template as any).usage_count || 0) + 1,
      })
      .eq("id", (template as any).id);

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
