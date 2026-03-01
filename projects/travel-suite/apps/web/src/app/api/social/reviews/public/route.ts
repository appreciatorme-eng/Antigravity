import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/sanitize";
import { enforceRateLimit, type RateLimitResult } from "@/lib/security/rate-limit";

const SHARE_TOKEN_REGEX = /^[A-Za-z0-9_-]{8,200}$/;
function parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

const REVIEW_RATE_LIMIT_MAX = parsePositiveInt(process.env.PUBLIC_REVIEW_RATE_LIMIT_MAX, 8);
const REVIEW_RATE_LIMIT_WINDOW_MS = parsePositiveInt(
    process.env.PUBLIC_REVIEW_RATE_LIMIT_WINDOW_MS,
    15 * 60_000
);

const PublicReviewSchema = z.object({
    token: z.string().min(8).max(200).regex(SHARE_TOKEN_REGEX),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(2).max(2000),
    reviewer_name: z.string().min(2).max(120),
    trip_name: z.string().max(160).optional(),
    destination: z.string().max(120).optional(),
});

function getRequestIp(request: NextRequest): string {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
        const first = xff.split(",")[0]?.trim();
        if (first) return first;
    }

    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;

    return "unknown";
}

function withRateLimitHeaders(response: NextResponse, limiter: RateLimitResult) {
    response.headers.set("x-ratelimit-limit", String(limiter.limit));
    response.headers.set("x-ratelimit-remaining", String(limiter.remaining));
    response.headers.set("x-ratelimit-reset", String(limiter.reset));
    return response;
}

function isExpired(expiresAt: string | null | undefined): boolean {
    if (!expiresAt) return false;
    const ts = new Date(expiresAt).getTime();
    return Number.isFinite(ts) && ts <= Date.now();
}

async function resolveOrganizationIdFromToken(
    supabaseAdmin: ReturnType<typeof createAdminClient>,
    token: string
): Promise<string | null> {
    const nowIso = new Date().toISOString();

    const { data: sharedItinerary } = await supabaseAdmin
        .from("shared_itineraries")
        .select("itinerary_id, expires_at")
        .eq("share_code", token)
        .maybeSingle();

    if (sharedItinerary?.itinerary_id && !isExpired(sharedItinerary.expires_at)) {
        const { data: itinerary } = await supabaseAdmin
            .from("itineraries")
            .select("user_id")
            .eq("id", sharedItinerary.itinerary_id)
            .maybeSingle();

        if (itinerary?.user_id) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("organization_id")
                .eq("id", itinerary.user_id)
                .maybeSingle();

            if (profile?.organization_id) {
                return profile.organization_id;
            }
        }
    }

    const { data: proposal } = await supabaseAdmin
        .from("proposals")
        .select("organization_id, expires_at")
        .eq("share_token", token)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .maybeSingle();

    if (proposal?.organization_id && !isExpired(proposal.expires_at)) {
        return proposal.organization_id;
    }

    return null;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        const parsed = PublicReviewSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Invalid review payload",
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const token = sanitizeText(parsed.data.token, { maxLength: 200 });
        if (!token || !SHARE_TOKEN_REGEX.test(token)) {
            return NextResponse.json({ error: "Invalid review token" }, { status: 400 });
        }

        const limiter = await enforceRateLimit({
            identifier: `${getRequestIp(req)}:${token}`,
            limit: REVIEW_RATE_LIMIT_MAX,
            windowMs: REVIEW_RATE_LIMIT_WINDOW_MS,
            prefix: "social:reviews:public",
        });

        if (!limiter.success) {
            const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
            const response = NextResponse.json(
                { error: "Too many review attempts. Please try again later." },
                { status: 429 }
            );
            response.headers.set("retry-after", String(retryAfterSeconds));
            return withRateLimitHeaders(response, limiter);
        }

        const supabaseAdmin = createAdminClient();

        const organizationId = await resolveOrganizationIdFromToken(supabaseAdmin, token);
        if (!organizationId) {
            const unauthorizedResponse = NextResponse.json(
                { error: "Invalid or expired review token" },
                { status: 401 }
            );
            return withRateLimitHeaders(unauthorizedResponse, limiter);
        }

        const reviewerName = sanitizeText(parsed.data.reviewer_name, { maxLength: 120 }) || "Guest";
        const comment = sanitizeText(parsed.data.comment, { maxLength: 2000, preserveNewlines: true });
        const tripName = sanitizeText(parsed.data.trip_name || "", { maxLength: 160 }) || null;
        const destination = sanitizeText(parsed.data.destination || "", { maxLength: 120 }) || null;
        const rating = parsed.data.rating;

        // Soft idempotency to prevent duplicate submissions from retries.
        const duplicateCutoffIso = new Date(Date.now() - 15 * 60_000).toISOString();
        const { data: duplicateReview } = await supabaseAdmin
            .from("social_reviews")
            .select("id")
            .eq("organization_id", organizationId)
            .eq("reviewer_name", reviewerName)
            .eq("rating", rating)
            .eq("comment", comment)
            .gte("created_at", duplicateCutoffIso)
            .limit(1)
            .maybeSingle();

        if (duplicateReview?.id) {
            const duplicateResponse = NextResponse.json(
                {
                    success: true,
                    duplicate: true,
                    review: { id: duplicateReview.id },
                },
                { status: 200 }
            );
            return withRateLimitHeaders(duplicateResponse, limiter);
        }

        const { data: review, error } = await supabaseAdmin
            .from("social_reviews")
            .insert({
                organization_id: organizationId,
                reviewer_name: reviewerName,
                trip_name: tripName,
                destination,
                rating,
                comment,
                source: "client_portal",
            })
            .select()
            .single();

        if (error) throw error;

        if (rating >= 4) {
            const reviewTemplateIds = ["social_review_1", "social_review_2"];
            const template_id = reviewTemplateIds[Math.floor(Math.random() * reviewTemplateIds.length)];

            const template_data = {
                rating,
                reviewerName,
                reviewText: comment,
                tripName,
                destination,
            };

            const { error: postError } = await supabaseAdmin.from("social_posts").insert({
                organization_id: organizationId,
                template_id,
                template_data,
                source: "auto_review",
                status: "draft",
            });

            if (postError) {
                console.error("Failed to auto-generate post for review:", postError);
            }
        }

        const response = NextResponse.json({ success: true, review });
        return withRateLimitHeaders(response, limiter);
    } catch (error: any) {
        console.error("Error submitting public review:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
