import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError, logEvent } from "@/lib/observability/logger";
import { LEGAL_VERSIONS } from "@/lib/legal/versions";

/**
 * Records an acceptance for an already-authenticated user. Used by:
 *   - the OAuth first-login interstitial at /auth/accept-terms
 *   - the re-acceptance modal when terms/privacy version changes
 *
 * Unlike /api/auth/signup, this route runs AFTER authentication, so the
 * user must present a valid Supabase session cookie. We verify that the
 * session user matches the insertion target and then call the same RPC
 * that signup uses.
 */

const RecordSchema = z.object({
    terms_accepted: z.literal(true),
    privacy_accepted: z.literal(true),
    age_confirmed: z.literal(true),
    method: z.enum(["oauth_interstitial", "reacceptance_modal"]),
});

function getRequestIp(request: NextRequest): string {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
        const first = xff.split(",")[0]?.trim();
        if (first) return first;
    }
    const realIp = request.headers.get("x-real-ip")?.trim();
    return realIp || "unknown";
}

export async function POST(request: NextRequest) {
    try {
        const server = await createClient();
        const {
            data: { user },
            error: authError,
        } = await server.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const ip = getRequestIp(request);
        const rateLimit = await enforceRateLimit({
            identifier: `${ip}:${user.id}`,
            limit: 10,
            windowMs: 10 * 60 * 1000,
            prefix: "auth:record-acceptance",
        });
        if (!rateLimit.success) {
            return NextResponse.json({ error: "Too many attempts. Try again soon." }, { status: 429 });
        }

        const body = await request.json().catch(() => null);
        const parsed = RecordSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "You must confirm the Terms, Privacy Policy, and age to continue.",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const userAgent = request.headers.get("user-agent") || "";

        const admin = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: rpcError } = await (admin as any).rpc("record_signup_acceptance", {
            p_user_id: user.id,
            p_terms_version: LEGAL_VERSIONS.terms,
            p_privacy_version: LEGAL_VERSIONS.privacy,
            p_ip_address: ip !== "unknown" ? ip : null,
            p_user_agent: userAgent.slice(0, 1000) || null,
            p_method: parsed.data.method,
        });

        if (rpcError) {
            logError("[/api/auth/record-acceptance:POST] RPC failed", rpcError, {
                userId: user.id,
            });
            return NextResponse.json(
                { error: "Could not record your acceptance. Please try again." },
                { status: 500 },
            );
        }

        logEvent("info", "[/api/auth/record-acceptance:POST] acceptance recorded", {
            userId: user.id,
            method: parsed.data.method,
            terms_version: LEGAL_VERSIONS.terms,
            privacy_version: LEGAL_VERSIONS.privacy,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logError("[/api/auth/record-acceptance:POST] Unhandled error", error);
        return NextResponse.json(
            { error: "An unexpected error occurred." },
            { status: 500 },
        );
    }
}
