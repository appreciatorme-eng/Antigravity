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

import { createServerClient } from "@supabase/ssr";
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
];

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

function isOnboardingPath(pathname: string): boolean {
    return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
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
    return (
        !!profile.organization_id &&
        profile.role === "admin" &&
        Number(profile.onboarding_step || 0) >= 2
    );
}

export async function middleware(request: NextRequest) {
    const sessionResponse = await updateSession(request);

    const pathname = request.nextUrl.pathname;
    const protectedPath = isProtectedPath(pathname);
    const onboardingPath = isOnboardingPath(pathname);

    if (!protectedPath && !onboardingPath) {
        return sessionResponse;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        return sessionResponse;
    }

    let authResponse = sessionResponse;
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                authResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    authResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        if (protectedPath || onboardingPath) {
            const requested = `${pathname}${request.nextUrl.search}`;
            return NextResponse.redirect(buildAuthRedirect(request, requested));
        }
        return authResponse;
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

    return authResponse;
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|icons/|sw\\.js|manifest|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
