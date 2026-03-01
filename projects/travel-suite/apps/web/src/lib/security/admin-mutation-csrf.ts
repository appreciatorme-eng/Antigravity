import { timingSafeEqual } from "node:crypto";

type HeaderLike = {
  get(name: string): string | null;
};

type RequestLike = {
  headers: HeaderLike;
  url: string;
};

function safeHeaderEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

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
  if (configuredToken) {
    const providedToken = (req.headers.get("x-admin-csrf") || "").trim();
    if (!providedToken) {
      return false;
    }
    return safeHeaderEqual(providedToken, configuredToken);
  }

  return hasTrustedSameOrigin(req);
}
