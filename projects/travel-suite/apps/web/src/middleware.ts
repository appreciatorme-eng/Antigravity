/* ------------------------------------------------------------------
 * Next.js Edge Middleware
 *
 * Runs on every matched request before the page/route handler.
 * Responsibilities:
 *   1. Refresh Supabase session cookies (updateSession) on all routes.
 *   2. Redirect unauthenticated users away from protected prefixes.
 *   3. Redirect users who have not completed onboarding away from
 *      protected routes to /onboarding.
 *   4. Redirect onboarding-complete users away from /onboarding back
 *      to their intended destination.
 *
 * Previously split across middleware.ts + proxy.ts — merged to satisfy
 * Next.js 16 / Turbopack requirement that only one edge entry file exists.
 * ------------------------------------------------------------------ */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

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

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

function isOnboardingPath(pathname: string): boolean {
    return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

function isMarketingPath(pathname: string): boolean {
    return MARKETING_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
}

function buildAuthRedirect(request: NextRequest, nextPath: string): URL {
    const destination = new URL("/auth", request.url);
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
    const { response: sessionResponse, user, supabase } = await updateSession(request);

    const pathname = request.nextUrl.pathname;
    const protectedPath = isProtectedPath(pathname);
    const onboardingPath = isOnboardingPath(pathname);

    // Authenticated users on marketing pages → redirect to dashboard.
    if (user && isMarketingPath(pathname)) {
        return NextResponse.redirect(new URL("/admin", request.url));
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

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id, role, onboarding_step")
        .eq("id", user.id)
        .maybeSingle();

    const onboardingComplete = isOnboardingComplete(profile);

    if (!onboardingComplete && protectedPath) {
        const destination = new URL("/onboarding", request.url);
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
                : "/admin";
        return NextResponse.redirect(new URL(safeNext, request.url));
    }

    return sessionResponse;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|icons/|sw\\.js|manifest|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
