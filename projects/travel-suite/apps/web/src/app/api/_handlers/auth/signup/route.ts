import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit, type RateLimitResult } from "@/lib/security/rate-limit";
import { logError, logEvent } from "@/lib/observability/logger";
import { LEGAL_VERSIONS } from "@/lib/legal/versions";

/**
 * Signup endpoint that atomically creates the user AND records the
 * versioned click-wrap acceptance. The caller is an unauthenticated
 * visitor on the /auth signup form, so this route is CSRF-exempt (the
 * dispatcher exempts pre-auth routes; protection is via rate-limit +
 * explicit schema validation + server-side creation).
 *
 * Flow:
 *   1. Validate body.
 *   2. Rate-limit per IP+email.
 *   3. Create user with admin client (email NOT auto-confirmed — Supabase
 *      sends a confirmation email as with the client SDK path).
 *   4. Call `record_signup_acceptance` RPC to write terms+privacy rows
 *      and bump profile flags, transactionally.
 *   5. If RPC fails — rollback (delete the auth user) and return 500.
 *   6. On success — return `success:true` so the client can sign-in and
 *      redirect into the app.
 */

const SignupSchema = z.object({
    email: z.string().email().max(320),
    password: z.string().min(8).max(256),
    full_name: z.string().trim().min(1).max(160),
    terms_version: z.string().min(1).max(40),
    privacy_version: z.string().min(1).max(40),
    terms_accepted: z.literal(true),
    privacy_accepted: z.literal(true),
    age_confirmed: z.literal(true),
});

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function sanitizeEmail(input: string): string | null {
    const email = input.trim().toLowerCase();
    if (!email || email.length > 320) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return email;
}

function getRequestIp(request: NextRequest): string {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
        const first = xff.split(",")[0]?.trim();
        if (first) return first;
    }
    const realIp = request.headers.get("x-real-ip")?.trim();
    return realIp || "unknown";
}

function withRateLimitHeaders(response: NextResponse, limiter: RateLimitResult) {
    response.headers.set("x-ratelimit-limit", String(limiter.limit));
    response.headers.set("x-ratelimit-reset", String(limiter.reset));
    return response;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        const parsed = SignupSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "You must accept the Terms, Privacy Policy, and confirm you are 18+ to create an account.",
                    details: parsed.error.flatten(),
                },
                { status: 400 },
            );
        }

        const email = sanitizeEmail(parsed.data.email);
        if (!email) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        // Reject stale client versions so we never record an out-of-date
        // acceptance row for a brand-new user.
        if (parsed.data.terms_version !== LEGAL_VERSIONS.terms) {
            return NextResponse.json(
                {
                    error: "Our Terms of Service have been updated. Please refresh the page and try again.",
                    code: "STALE_TERMS_VERSION",
                },
                { status: 409 },
            );
        }
        if (parsed.data.privacy_version !== LEGAL_VERSIONS.privacy) {
            return NextResponse.json(
                {
                    error: "Our Privacy Policy has been updated. Please refresh the page and try again.",
                    code: "STALE_PRIVACY_VERSION",
                },
                { status: 409 },
            );
        }

        const ip = getRequestIp(request);
        const userAgent = request.headers.get("user-agent") || "";

        const rateLimit = await enforceRateLimit({
            identifier: `${ip}:${email}`,
            limit: RATE_LIMIT_MAX,
            windowMs: RATE_LIMIT_WINDOW_MS,
            prefix: "auth:signup",
        });
        if (!rateLimit.success) {
            const retryAfterSeconds = Math.max(
                1,
                Math.ceil((rateLimit.reset - Date.now()) / 1000),
            );
            const response = NextResponse.json(
                { error: "Too many signup attempts. Please try again later." },
                { status: 429 },
            );
            response.headers.set("retry-after", String(retryAfterSeconds));
            return withRateLimitHeaders(response, rateLimit);
        }

        const admin = createAdminClient();

        const { data: created, error: createError } = await admin.auth.admin.createUser({
            email,
            password: parsed.data.password,
            email_confirm: false,
            user_metadata: { full_name: parsed.data.full_name },
        });

        if (createError || !created.user) {
            logError("[/api/auth/signup:POST] createUser failed", createError);
            const message =
                createError?.message && /already registered|already exists/i.test(createError.message)
                    ? "An account with this email already exists. Please sign in instead."
                    : "Could not create your account. Please try again.";
            const response = NextResponse.json({ error: message }, { status: 409 });
            return withRateLimitHeaders(response, rateLimit);
        }

        const userId = created.user.id;

        // Atomically record acceptance. If this fails we must roll back
        // the auth user so we never leave a user without a valid,
        // legally binding acceptance record.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: rpcError } = await (admin as any).rpc("record_signup_acceptance", {
            p_user_id: userId,
            p_terms_version: parsed.data.terms_version,
            p_privacy_version: parsed.data.privacy_version,
            p_ip_address: ip !== "unknown" ? ip : null,
            p_user_agent: userAgent.slice(0, 1000) || null,
            p_method: "signup_checkbox",
        });

        if (rpcError) {
            logError(
                "[/api/auth/signup:POST] record_signup_acceptance failed — rolling back user",
                rpcError,
                { userId },
            );
            await admin.auth.admin.deleteUser(userId).catch((rollbackErr) => {
                logError(
                    "[/api/auth/signup:POST] rollback deleteUser failed — manual cleanup required",
                    rollbackErr,
                    { userId },
                );
            });
            const response = NextResponse.json(
                {
                    error: "Could not finalize your signup. No account was created. Please try again.",
                },
                { status: 500 },
            );
            return withRateLimitHeaders(response, rateLimit);
        }

        logEvent("info", "[/api/auth/signup:POST] account created", {
            userId,
            email,
            terms_version: parsed.data.terms_version,
            privacy_version: parsed.data.privacy_version,
        });

        const response = NextResponse.json({
            success: true,
            user: { id: userId, email },
        });
        return withRateLimitHeaders(response, rateLimit);
    } catch (error) {
        logError("[/api/auth/signup:POST] Unhandled error", error);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 },
        );
    }
}
