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
  return auth.toLowerCase().startsWith("bearer ");
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

  if (!configuredToken && process.env.NODE_ENV === "production") {
    // Warn once per cold start — origin-only trust is weaker than token-based CSRF protection.
    // Set ADMIN_MUTATION_CSRF_TOKEN to enforce strict token validation on all admin mutations.
    logError(
      "[csrf] ADMIN_MUTATION_CSRF_TOKEN not set — falling back to same-origin check. " +
      "Set the env var for stronger CSRF protection in production.",
      null,
    );
  }

  if (configuredToken) {
    const providedToken = (req.headers.get("x-admin-csrf") || "").trim();
    if (!providedToken) {
      return false;
    }
    return safeEqual(providedToken, configuredToken);
  }

  return hasTrustedSameOrigin(req);
}
