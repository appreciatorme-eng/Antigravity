import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = new Set(["/", "/auth", "/offline"]);

const PUBLIC_PREFIXES = [
    "/auth/",
    "/live/",
    "/p/",
    "/portal/",
    "/share/",
    "/api/",
    "/_next/",
    "/icons/",
    "/sw.js",
    "/manifest",
    "/favicon",
];

function isPublicPath(pathname: string): boolean {
    if (PUBLIC_PATHS.has(pathname)) return true;
    return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const sessionResponse = await updateSession(request);

    if (isPublicPath(pathname)) {
        return sessionResponse;
    }

    const supabaseSessionCookie =
        sessionResponse.cookies.get("sb-access-token") ??
        request.cookies.get("sb-access-token");

    const hasSession =
        supabaseSessionCookie !== undefined ||
        [...request.cookies.getAll()].some(
            (c) =>
                c.name.startsWith("sb-") &&
                (c.name.endsWith("-auth-token") || c.name.endsWith("-auth-token.0"))
        );

    if (!hasSession) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/auth";
        redirectUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    return sessionResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|icons/|sw\\.js|manifest|offline).*)",
    ],
};
