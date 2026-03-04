import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderPoster } from "@/lib/social/poster-renderer";
import type { LayoutType, AspectRatio } from "@/lib/social/types";

/**
 * POST /api/social/render-poster
 *
 * Server-side poster rendering via Satori + Sharp.
 * This is a CPU-only operation (no external AI calls) so it is FREE —
 * no spend-guardrail metering, no rate-limit cost bucket.
 * Auth is still required to prevent abuse.
 */

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
  // Auth-only guard — no cost metering for CPU-only rendering
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate layoutType
    const layoutType = body?.layoutType as LayoutType;
    if (!layoutType || !VALID_LAYOUTS.has(layoutType)) {
      return NextResponse.json({ error: "Invalid layoutType" }, { status: 400 });
    }

    // Validate aspectRatio
    const aspectRatio = (body?.aspectRatio || "square") as AspectRatio;
    if (!VALID_ASPECTS.has(aspectRatio)) {
      return NextResponse.json({ error: "Invalid aspectRatio" }, { status: 400 });
    }

    // Validate format
    const format = (body?.format || "png") as "png" | "jpeg" | "webp";
    if (!VALID_FORMATS.has(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
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
      return NextResponse.json({
        image: `data:${result.contentType};base64,${result.buffer.toString("base64")}`,
        width: result.width,
        height: result.height,
        contentType: result.contentType,
      });
    }

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Length": String(result.buffer.byteLength),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Render failed";
    console.error("[render-poster] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
