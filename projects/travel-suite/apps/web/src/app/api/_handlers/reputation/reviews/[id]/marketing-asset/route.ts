import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { ZodError, z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { safeErrorMessage } from "@/lib/security/safe-error";
import {
  ensureReviewMarketingAsset,
  scheduleReviewMarketingAsset,
} from "@/lib/reputation/review-marketing.server";

const requestSchema = z.object({
  action: z.enum(["generate", "schedule"]).default("generate"),
  templateId: z
    .enum(["review_stars_minimal", "review_dark_quote", "review_elegant_1"])
    .optional(),
  platforms: z.array(z.enum(["instagram", "facebook"])).min(1).optional(),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const body = requestSchema.parse(await req.json().catch(() => ({})));

    if (body.action === "schedule") {
      const result = await scheduleReviewMarketingAsset({
        supabase,
        reviewId: id,
        userId: user.id,
        templateId: body.templateId,
        platforms: body.platforms ?? ["instagram"],
        scheduledFor: body.scheduledFor,
      });

      return NextResponse.json({
        success: true,
        message: "Review asset scheduled for manual review",
        data: result,
      });
    }

    const result = await ensureReviewMarketingAsset({
      supabase,
      reviewId: id,
      userId: user.id,
      templateId: body.templateId,
    });

    return NextResponse.json({
      success: true,
      message: "Review asset generated",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const message = safeErrorMessage(error, "Request failed");
    const status =
      message === "Unauthorized"
        ? 401
        : message === "Review not found"
          ? 404
          : message === "No organization found" ||
              message === "Organization not found" ||
              message === "Only strong reviews with comment text can become marketing assets" ||
              message === "No connected social platforms found"
            ? 400
            : 500;

    console.error("Error processing review marketing asset:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
