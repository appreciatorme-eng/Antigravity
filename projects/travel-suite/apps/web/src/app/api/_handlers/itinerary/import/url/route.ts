import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/response";
import { importTripDraftFromUrl } from "@/lib/import/trip-import";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeErrorMessage } from "@/lib/security/safe-error";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const rateLimitResult = await enforceRateLimit({
      identifier: user.id,
      limit: 10,
      windowMs: 60 * 1000,
      prefix: "auth:import:url",
    });
    if (!rateLimitResult.success) {
      return apiError("Too many import requests. Please try again later.", 429);
    }

    const parsedBody = await req.json().catch(() => null);
    const url = typeof parsedBody?.url === "string" ? parsedBody.url.trim() : "";

    if (!url) {
      return apiError("Valid URL is required", 400);
    }

    const result = await importTripDraftFromUrl(url);
    if (!result.success || !result.draft) {
      const message = result.error || "Failed to import from URL";
      const status =
        message.includes("invalid") ||
        message.includes("supported") ||
        message.includes("required") ||
        message.includes("allowed")
          ? 400
          : message.includes("too long")
            ? 408
            : 422;
      return apiError(message, status);
    }

    return NextResponse.json({
      success: true,
      draft: result.draft,
      warnings: result.draft.warnings,
      missing_sections: result.draft.missing_sections,
      source_meta: result.draft.source_meta,
      originalUrl: result.originalUrl ?? url,
    });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    return apiError(message, 500);
  }
}
