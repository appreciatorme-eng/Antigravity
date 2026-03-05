import { NextRequest, NextResponse } from "next/server";
import {
  guardCostEndpoint,
  withCostGuardHeaders,
} from "@/lib/security/cost-endpoint-guard";
import { renderPoster } from "@/lib/social/poster-renderer";
import { selectBestTemplate } from "@/lib/social/template-selector";
import { generateBackgroundPrompt } from "@/lib/social/ai-prompts";
import type { AspectRatio } from "@/lib/social/types";
import type { AiImageStyle } from "@/lib/social/ai-prompts";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const guard = await guardCostEndpoint(req, "ai_image");
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return withCostGuardHeaders(
        NextResponse.json({ error: "prompt is required" }, { status: 400 }),
        guard.context
      );
    }

    const aspectRatio = (body?.aspectRatio || "square") as AspectRatio;
    const style = (body?.style || "cinematic") as AiImageStyle;
    const format = (body?.format || "png") as "png" | "jpeg";

    // Step 1: Generate content via Gemini
    let content = {
      destination: prompt,
      price: body?.price || "",
      offer: body?.offer || "",
      season: body?.season || "",
      services: [] as string[],
      bulletPoints: [] as string[],
    };

    try {
      const geminiApiKey =
        process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
      if (geminiApiKey) {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const geminiResult = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Generate travel poster content for: ${prompt}. Return JSON with: destination, price (in INR with symbol), offer, season, services (array of 4-6 items like "Flights", "Hotels", "Sightseeing"), bulletPoints (array of 3-4 selling points). Make it compelling for a travel agency marketing poster.`,
                },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        });

        const parsed = JSON.parse(geminiResult.response.text());
        content = { ...content, ...parsed };
      }
    } catch (err) {
      console.warn(
        "[smart-poster] Gemini content generation failed, using prompt as destination:",
        err
      );
    }

    // Step 2: Select best template
    const template = selectBestTemplate(content, { aspectRatio, style });

    // Step 3: Generate background via FAL.ai
    let backgroundUrl: string | undefined;
    try {
      const bgPrompt = generateBackgroundPrompt(content, style);
      const falKey = process.env.FAL_KEY;
      if (falKey) {
        const { fal } = await import("@fal-ai/client");
        fal.config({ credentials: falKey });
        const falResult = await fal.subscribe("fal-ai/flux/schnell", {
          input: {
            prompt: bgPrompt,
            image_size: {
              width: 1080,
              height:
                aspectRatio === "story"
                  ? 1920
                  : aspectRatio === "portrait"
                    ? 1350
                    : 1080,
            },
            num_images: 1,
            enable_safety_checker: false,
          },
        });
        backgroundUrl = (falResult.data as { images?: { url: string }[] })
          ?.images?.[0]?.url;
      }
    } catch (err) {
      console.warn("[smart-poster] FAL.ai background generation failed:", err);
    }

    // Step 4: Compose poster via Satori+Sharp
    const templateData = {
      companyName: body?.companyName || "",
      destination: content.destination || prompt,
      price: content.price || "",
      offer: content.offer || "",
      season: content.season || "",
      contactNumber: body?.contactNumber || "",
      email: body?.email || "",
      website: body?.website || "",
      logoUrl: body?.logoUrl,
      services: content.services,
      bulletPoints: content.bulletPoints,
    };

    const result = await renderPoster({
      templateData,
      layoutType: template.layout,
      backgroundUrl,
      aspectRatio,
      format,
      quality: 95,
    });

    return withCostGuardHeaders(
      NextResponse.json({
        poster: {
          image: `data:${result.contentType};base64,${result.buffer.toString("base64")}`,
          width: result.width,
          height: result.height,
        },
        templateId: template.id,
        templateName: template.name,
        templateData,
        backgroundUrl: backgroundUrl || null,
        content,
      }),
      guard.context
    );
  } catch (err: unknown) {
    console.error("[smart-poster] Error:", err);
    return withCostGuardHeaders(
      NextResponse.json({ error: "Smart poster generation failed" }, { status: 500 }),
      guard.context
    );
  }
}
