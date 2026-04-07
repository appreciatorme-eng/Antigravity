import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/response";
import { importTripDraftFromText } from "@/lib/import/trip-import";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeErrorMessage } from "@/lib/security/safe-error";

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
      prefix: "auth:import:text",
    });
    if (!rateLimitResult.success) {
      return apiError("Too many import requests. Please try again later.", 429);
    }

    const parsedBody = await req.json().catch(() => null);
    const text = typeof parsedBody?.text === "string" ? parsedBody.text : "";

    const result = await importTripDraftFromText(text, {
      source: "text",
    });

    if (!result.success || !result.draft) {
      const message = result.error || "Failed to parse text";
      const status =
        message.includes("at least") || message.includes("too long")
          ? 400
          : 422;
      return apiError(message, status);
    }

    return NextResponse.json({
      success: true,
      draft: result.draft,
      warnings: result.draft.warnings,
      missing_sections: result.draft.missing_sections,
      source_meta: result.draft.source_meta,
    });
  } catch (error: unknown) {
    const message = safeErrorMessage(error, "Request failed");
    return apiError(message, 500);
  }
}
