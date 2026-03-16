import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from "@/lib/api/response";
import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import { createClient as createServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/observability/logger";

export const maxDuration = 60;

function isMockSocialExtractionEnabled(): boolean {
  const explicit = process.env.SOCIAL_EXTRACT_MOCK_ENABLED?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV !== "production";
}

const extractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    destination: { type: SchemaType.STRING },
    price: { type: SchemaType.STRING },
    offer: { type: SchemaType.STRING },
    season: { type: SchemaType.STRING },
    contactNumber: { type: SchemaType.STRING },
    companyName: { type: SchemaType.STRING },
  },
  required: ['destination', 'price'],
};

export async function POST(req: NextRequest) {
  try {
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const rl = await enforceRateLimit({
      identifier: user.id,
      limit: 20,
      windowMs: 60_000,
      prefix: "api:social:extract",
    });
    if (!rl.success) {
      return apiError("Too many requests", 429);
    }

    const { image } = await req.json(); // base64 image

    if (!image) {
      return apiError("No image provided", 400);
    }

    if (typeof image !== "string" || image.length > 10_000_000) {
      return apiError("Image too large (max 10MB base64)", 413);
    }

    const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

    if (!geminiApiKey) {
      if (!isMockSocialExtractionEnabled()) {
        return NextResponse.json(
          {
            error:
              "AI extraction provider is not configured. Set SOCIAL_EXTRACT_MOCK_ENABLED=true only for test/dev.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        destination: "Dubai Desert Safari & City",
        price: "$499",
        offer: "Buy 1 Get 1 Free",
        season: "Summer Special",
        contactNumber: "+91 9876543210",
        companyName: "Travel Pro"
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema as ResponseSchema,
      },
    });

    const prompt = "Extract travel package details from this marketing poster. Return JSON with destination, price, offer, season, contact number, and company name if present.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image.split(',')[1], // remove data:image/png;base64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = JSON.parse(result.response.text());
    return apiSuccess(response);

  } catch (error) {
    logError("Extraction Error", error);
    return apiError("Failed to extract content", 500);
  }
}
