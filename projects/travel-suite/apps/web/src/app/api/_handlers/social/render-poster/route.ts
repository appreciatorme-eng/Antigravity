import { NextRequest, NextResponse } from "next/server";
import {
  guardCostEndpoint,
  withCostGuardHeaders,
} from "@/lib/security/cost-endpoint-guard";
import { renderPoster } from "@/lib/social/poster-renderer";
import type { LayoutType, AspectRatio } from "@/lib/social/types";

export const maxDuration = 30;

const VALID_LAYOUTS = new Set<LayoutType>([
  "CenterLayout",
  "SplitLayout",
  "BottomLayout",
  "ElegantLayout",
  "ReviewLayout",
  "CarouselSlideLayout",
  "ServiceShowcaseLayout",
  "HeroServicesLayout",
  "InfoSplitLayout",
  "GradientHeroLayout",
  "DiagonalSplitLayout",
  "MagazineCoverLayout",
  "DuotoneLayout",
  "BoldTypographyLayout",
]);

const VALID_ASPECTS = new Set<AspectRatio>(["square", "portrait", "story"]);
const VALID_FORMATS = new Set(["png", "jpeg", "webp"]);

export async function POST(req: NextRequest) {
  // Use ai_image category since poster_render does not exist in cost guardrails
  const guard = await guardCostEndpoint(req, "ai_image");
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();

    // Validate layoutType
    const layoutType = body?.layoutType as LayoutType;
    if (!layoutType || !VALID_LAYOUTS.has(layoutType)) {
      return withCostGuardHeaders(
        NextResponse.json({ error: "Invalid layoutType" }, { status: 400 }),
        guard.context
      );
    }

    // Validate aspectRatio
    const aspectRatio = (body?.aspectRatio || "square") as AspectRatio;
    if (!VALID_ASPECTS.has(aspectRatio)) {
      return withCostGuardHeaders(
        NextResponse.json({ error: "Invalid aspectRatio" }, { status: 400 }),
        guard.context
      );
    }

    // Validate format
    const format = (body?.format || "png") as "png" | "jpeg" | "webp";
    if (!VALID_FORMATS.has(format)) {
      return withCostGuardHeaders(
        NextResponse.json({ error: "Invalid format" }, { status: 400 }),
        guard.context
      );
    }

    const result = await renderPoster({
      templateData: body.templateData || {},
      layoutType,
      backgroundUrl: body.backgroundUrl,
      aspectRatio,
      format,
      quality: body.quality,
    });

    // Return as base64 JSON or binary based on query param
    const outputMode = req.nextUrl.searchParams.get("output");
    if (outputMode === "base64") {
      return withCostGuardHeaders(
        NextResponse.json({
          image: `data:${result.contentType};base64,${result.buffer.toString("base64")}`,
          width: result.width,
          height: result.height,
          contentType: result.contentType,
        }),
        guard.context
      );
    }

    return withCostGuardHeaders(
      new NextResponse(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          "Content-Type": result.contentType,
          "Content-Length": String(result.buffer.byteLength),
          "Cache-Control": "private, max-age=3600",
        },
      }),
      guard.context
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Render failed";
    console.error("[render-poster] Error:", err);
    return withCostGuardHeaders(
      NextResponse.json({ error: message }, { status: 500 }),
      guard.context
    );
  }
}
