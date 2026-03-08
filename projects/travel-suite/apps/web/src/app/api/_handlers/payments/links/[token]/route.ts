import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPaymentLinkByToken,
  recordPaymentLinkEvent,
} from "@/lib/payments/payment-links.server";
import { enforcePublicRouteRateLimit } from "@/lib/security/public-rate-limit";

const tokenSchema = z.string().min(8).max(200);
const PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_MAX || "30"
);
const PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_WINDOW_MS || 60_000
);
const PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_MAX = Number(
  process.env.PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_MAX || "10"
);
const PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_WINDOW_MS || 60_000
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const parsedToken = tokenSchema.safeParse(token);
    if (!parsedToken.success) {
      return apiError("Invalid payment link token", 400);
    }

    const rateLimitResponse = await enforcePublicRouteRateLimit(request, {
      identifier: parsedToken.data,
      limit: PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_MAX,
      windowMs: PUBLIC_PAYMENT_LINK_READ_RATE_LIMIT_WINDOW_MS,
      prefix: "public:payment-link:read",
      message: "Too many requests. Please try again later.",
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const admin = createAdminClient();
    const link = await getPaymentLinkByToken(admin, parsedToken.data, new URL(request.url).origin);
    if (!link) {
      return apiError("Payment link not found", 404);
    }

    return apiSuccess({ link });
  } catch (error) {
    console.error("[payments/links/:token] load failed:", error);
    return apiError("Failed to load payment link", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const parsedToken = tokenSchema.safeParse(token);
    if (!parsedToken.success) {
      return apiError("Invalid payment link token", 400);
    }

    const rateLimitResponse = await enforcePublicRouteRateLimit(request, {
      identifier: parsedToken.data,
      limit: PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_MAX,
      windowMs: PUBLIC_PAYMENT_LINK_WRITE_RATE_LIMIT_WINDOW_MS,
      prefix: "public:payment-link:write",
      message: "Too many requests. Please try again later.",
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json().catch(() => null);
    const event = typeof body?.event === "string" ? body.event : "";
    const metadata =
      body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? Object.fromEntries(
            Object.entries(body.metadata as Record<string, unknown>).flatMap(([key, value]) =>
              typeof value === "string" && value.trim() ? [[key, value]] : [],
            ),
          )
        : undefined;

    if (event !== "viewed" && event !== "sent" && event !== "reminder_sent" && event !== "expired") {
      return apiError("Unsupported payment link event", 400);
    }

    const admin = createAdminClient();
    const link = await recordPaymentLinkEvent(admin, {
      token: parsedToken.data,
      event,
      metadata,
      baseUrl: new URL(request.url).origin,
    });

    if (!link) {
      return apiError("Payment link not found", 404);
    }

    return apiSuccess({ link });
  } catch (error) {
    console.error("[payments/links/:token] event failed:", error);
    return apiError("Failed to update payment link", 500);
  }
}
