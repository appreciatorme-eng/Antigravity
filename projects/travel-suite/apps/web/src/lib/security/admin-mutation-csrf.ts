import { safeEqual } from "./safe-equal";
import { logError } from "@/lib/observability/logger";

type HeaderLike = {
  get(name: string): string | null;
};

type RequestLike = {
  headers: HeaderLike;
  url: string;
};

export function isBearerRequest(req: RequestLike): boolean {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return false;
  // Validate token is non-empty and has reasonable minimum length
  const token = auth.slice(7).trim();
  return token.length >= 10;
}

export function hasTrustedSameOrigin(req: RequestLike): boolean {
  const host = req.headers.get("host");
  if (!host) return false;

  const requestUrl = new URL(req.url);
  const expectedOrigin = `${requestUrl.protocol}//${host}`;
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!origin && !referer) return false;

  if (origin && origin !== expectedOrigin) {
    return false;
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== expectedOrigin) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

export function passesMutationCsrfGuard(req: RequestLike): boolean {
  if (isBearerRequest(req)) {
    return true;
  }

  const configuredToken = process.env.ADMIN_MUTATION_CSRF_TOKEN?.trim();

  // In production, ADMIN_MUTATION_CSRF_TOKEN must be set. Without it,
  // reject all non-bearer mutations to prevent CSRF via origin-only trust.
  if (!configuredToken && process.env.NODE_ENV === "production") {
    logError(
      "[csrf] ADMIN_MUTATION_CSRF_TOKEN not set in production — blocking mutation.",
      null,
    );
    return false;
  }

  if (configuredToken) {
    const providedToken = (req.headers.get("x-admin-csrf") || "").trim();
    if (!providedToken) {
      return false;
    }
    return safeEqual(providedToken, configuredToken);
  }

  // Development/test fallback: allow if same-origin.
  return hasTrustedSameOrigin(req);
}
