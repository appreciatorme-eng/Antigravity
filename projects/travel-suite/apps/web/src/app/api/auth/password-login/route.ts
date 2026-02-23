import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeEmail } from "@/lib/security/sanitize";

const LoginSchema = z.object({
  email: z.string().min(3).max(320),
  password: z.string().min(6).max(256),
});

const RATE_LIMIT_CONFIG = {
  namespace: "auth-password-login",
  max: 8,
  window: "10 m" as const,
};

function withRateLimitHeaders(
  response: NextResponse,
  limiter: Awaited<ReturnType<typeof enforceRateLimit>> | null
) {
  if (!limiter) return response;
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

  const rateLimit = await enforceRateLimit(request, email, RATE_LIMIT_CONFIG);
  if (rateLimit && !rateLimit.success) {
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
