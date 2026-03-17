/* ------------------------------------------------------------------
 * Next.js Edge Middleware
 *
 * Runs on every matched request before the page/route handler.
 * Responsibilities:
 *   1. Handle locale routing and detection (next-intl).
 *   2. Refresh Supabase session cookies (updateSession) on all routes.
 *   3. Redirect unauthenticated users away from protected prefixes.
 *   4. Redirect users who have not completed onboarding away from
 *      protected routes to /onboarding.
 *   5. Redirect onboarding-complete users away from /onboarding back
 *      to their intended destination.
 *
 * Previously split across middleware.ts + proxy.ts — merged to satisfy
 * Next.js 16 / Turbopack requirement that only one edge entry file exists.
 *
 * Locale handling chained before auth checks to ensure all redirects
 * preserve the user's selected locale.
 * ------------------------------------------------------------------ */

import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { locales, defaultLocale } from "@/i18n";

const PROTECTED_PREFIXES = [
    "/admin",
    "/god",
    "/planner",
    "/trips",
    "/settings",
    "/proposals",
    "/reputation",
    "/social",
    "/support",
    "/clients",
    "/drivers",
    "/inbox",
    "/add-ons",
    "/analytics",
    "/calendar",
];

const MARKETING_PATHS = ["/", "/pricing", "/about", "/blog", "/demo", "/solutions"];

// Create next-intl middleware for locale handling.
// localeDetection: true enables automatic browser locale detection via Accept-Language header.
// This is critical for the traveler portal — when travelers visit /portal/[token] without
// a locale prefix, the middleware detects their browser language and redirects to
// /[locale]/portal/[token] with the best matching supported locale.
const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: "always",
    localeDetection: true,
});

/**
 * Strip locale prefix from pathname to get the actual path.
 * E.g., "/en/admin" → "/admin", "/hi/settings" → "/settings"
 */
function stripLocalePrefix(pathname: string): string {
    for (const locale of locales) {
        if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
            return pathname.slice(locale.length + 1) || "/";
        }
    }
    return pathname;
}

/**
 * Get current locale from pathname.
 * E.g., "/en/admin" → "en", "/hi/settings" → "hi"
 */
function getLocaleFromPathname(pathname: string): string {
    for (const locale of locales) {
        if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
            return locale;
        }
    }
    return defaultLocale;
}

function isProtectedPath(pathname: string): boolean {
    const withoutLocale = stripLocalePrefix(pathname);
    return PROTECTED_PREFIXES.some(
        (prefix) => withoutLocale === prefix || withoutLocale.startsWith(`${prefix}/`)
    );
}

function isOnboardingPath(pathname: string): boolean {
    const withoutLocale = stripLocalePrefix(pathname);
    return withoutLocale === "/onboarding" || withoutLocale.startsWith("/onboarding/");
}

function isMarketingPath(pathname: string): boolean {
    const withoutLocale = stripLocalePrefix(pathname);
    return MARKETING_PATHS.some(
        (p) => withoutLocale === p || withoutLocale.startsWith(`${p}/`)
    );
}

function buildAuthRedirect(request: NextRequest, nextPath: string): URL {
    const locale = getLocaleFromPathname(request.nextUrl.pathname);
    const destination = new URL(`/${locale}/auth`, request.url);
    destination.searchParams.set("next", nextPath);
    return destination;
}

function isOnboardingComplete(profile: {
    organization_id: string | null;
    role: string | null;
    onboarding_step: number | null;
} | null): boolean {
    if (!profile) return false;
    if (profile.role === "super_admin") return true;
    // Client and driver accounts are created by admins — they never self-onboard.
    if (profile.role === "client" || profile.role === "driver") {
        return !!profile.organization_id;
    }
    return (
        !!profile.organization_id &&
        profile.role === "admin" &&
        Number(profile.onboarding_step ?? 0) >= 2
    );
}

export async function middleware(request: NextRequest) {
    // Step 1: Handle locale routing via next-intl middleware.
    // This ensures all URLs have proper locale prefixes and handles locale detection.
    const intlResponse = intlMiddleware(request);

    // If next-intl is redirecting (e.g., adding locale prefix), copy session cookies
    // onto the redirect response so the browser preserves auth state.
    if (intlResponse.status === 307 || intlResponse.status === 308) {
        const { response: sessionResponse } = await updateSession(request);
        // Copy session cookies to the intl redirect (preserving its status code)
        for (const cookie of sessionResponse.headers.getSetCookie()) {
            intlResponse.headers.append("Set-Cookie", cookie);
        }
        return intlResponse;
    }

    // Step 2: Update Supabase session cookies on all non-redirect requests.
    const { response: sessionResponse, user, supabase } = await updateSession(request);

    const pathname = request.nextUrl.pathname;
    const locale = getLocaleFromPathname(pathname);
    const protectedPath = isProtectedPath(pathname);
    const onboardingPath = isOnboardingPath(pathname);

    // Authenticated users on marketing pages → redirect to dashboard.
    if (user && isMarketingPath(pathname)) {
        return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
    }

    if (!protectedPath && !onboardingPath) {
        return sessionResponse;
    }

    if (!user) {
        if (protectedPath || onboardingPath) {
            const requested = `${pathname}${request.nextUrl.search}`;
            return NextResponse.redirect(buildAuthRedirect(request, requested));
        }
        return sessionResponse;
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id, role, onboarding_step")
        .eq("id", user.id)
        .maybeSingle();

    // Fail-open by design: when Supabase auth/profile lookup fails (e.g. during
    // an outage), we allow the request through rather than locking out all users.
    // This trades a small security window (unauthenticated access during outage)
    // for availability. Downstream route handlers perform their own auth checks.
    if (profileError) {
        return sessionResponse;
    }

    const onboardingComplete = isOnboardingComplete(profile);

    if (!onboardingComplete && protectedPath) {
        const destination = new URL(`/${locale}/onboarding`, request.url);
        destination.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(destination);
    }

    if (onboardingComplete && onboardingPath) {
        const requestedNext = request.nextUrl.searchParams.get("next");
        const safeNext =
            requestedNext &&
            requestedNext.startsWith("/") &&
            !requestedNext.startsWith("//")
                ? requestedNext
                : `/${locale}/admin`;
        return NextResponse.redirect(new URL(safeNext, request.url));
    }

    return sessionResponse;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|icons/|sw\\.js|manifest|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
