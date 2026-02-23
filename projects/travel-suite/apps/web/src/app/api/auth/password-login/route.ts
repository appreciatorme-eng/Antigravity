import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const LoginSchema = z.object({
  email: z.string().min(3).max(320),
  password: z.string().min(6).max(256),
});

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

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

function enforceLocalRateLimit(request: NextRequest, email: string): RateLimitResult {
  const now = Date.now();
  const key = `${getRequestIp(request)}:${email}`;
  const existing = loginAttempts.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    loginAttempts.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX - 1,
      reset: resetAt,
    };
  }

  const nextCount = existing.count + 1;
  loginAttempts.set(key, { count: nextCount, resetAt: existing.resetAt });

  const success = nextCount <= RATE_LIMIT_MAX;
  return {
    success,
    limit: RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - nextCount),
    reset: existing.resetAt,
  };
}

function withRateLimitHeaders(response: NextResponse, limiter: RateLimitResult) {
  response.headers.set("x-ratelimit-limit", String(limiter.limit));
  response.headers.set("x-ratelimit-remaining", String(limiter.remaining));
  response.headers.set("x-ratelimit-reset", String(limiter.reset));
  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = sanitizeEmail(parsed.data.email);
  const password = parsed.data.password;
  if (!email) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const rateLimit = enforceLocalRateLimit(request, email);
  if (!rateLimit.success) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rateLimit.reset - Date.now()) / 1000)
    );
    const response = NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
    response.headers.set("retry-after", String(retryAfterSeconds));
    return withRateLimitHeaders(response, rateLimit);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    const response = NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
    return withRateLimitHeaders(response, rateLimit);
  }

  const response = NextResponse.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email || email,
    },
  });

  return withRateLimitHeaders(response, rateLimit);
}
