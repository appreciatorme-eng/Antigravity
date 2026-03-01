import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function safeEqual(left: string, right: string): boolean {
    const leftBuf = Buffer.from(left, "utf8");
    const rightBuf = Buffer.from(right, "utf8");
    if (leftBuf.length !== rightBuf.length) return false;
    return timingSafeEqual(leftBuf, rightBuf);
}

function extractBearerToken(authorization: string | null): string | null {
    if (!authorization?.startsWith("Bearer ")) return null;
    const value = authorization.slice("Bearer ".length).trim();
    return value || null;
}

function extractDiagnosticsToken(request: Request): string | null {
    const fromHeader =
        request.headers.get("x-healthcheck-token")?.trim() ||
        request.headers.get("x-diagnostics-token")?.trim();
    if (fromHeader) return fromHeader;

    return extractBearerToken(request.headers.get("authorization"));
}

export function isDiagnosticsTokenAuthorized(request: Request): boolean {
    const configuredToken = process.env.HEALTHCHECK_TOKEN?.trim();
    if (!configuredToken) {
        return false;
    }

    const providedToken = extractDiagnosticsToken(request);
    if (!providedToken) {
        return false;
    }

    return safeEqual(providedToken, configuredToken);
}

export function diagnosticsUnauthorizedResponse() {
    return NextResponse.json(
        {
            error: "Unauthorized",
            message: "Provide a valid healthcheck token to access diagnostics endpoints.",
        },
        { status: 401 }
    );
}
