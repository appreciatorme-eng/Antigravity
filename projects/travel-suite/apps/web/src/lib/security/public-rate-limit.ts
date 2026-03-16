import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { enforceRateLimit, type RateLimitResult } from "@/lib/security/rate-limit";

type PublicRouteRateLimitOptions = {
  identifier: string;
  limit: number;
  windowMs: number;
  prefix: string;
  message: string;
};

export function getRequestIp(request: Pick<Request, "headers">): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export function withRateLimitHeaders(response: NextResponse, limiter: RateLimitResult) {
  response.headers.set("x-ratelimit-limit", String(limiter.limit));
  response.headers.set("x-ratelimit-reset", String(limiter.reset));
  return response;
}

export async function enforcePublicRouteRateLimit(
  request: Request,
  options: PublicRouteRateLimitOptions,
) {
  const limiter = await enforceRateLimit({
    identifier: `${getRequestIp(request)}:${options.identifier}`,
    limit: options.limit,
    windowMs: options.windowMs,
    prefix: options.prefix,
  });

  if (limiter.success) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
  const response = apiError(options.message, 429);
  response.headers.set("retry-after", String(retryAfterSeconds));
  return withRateLimitHeaders(response, limiter);
}
