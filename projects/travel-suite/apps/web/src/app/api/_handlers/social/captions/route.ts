import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from "@/lib/api-response";
import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import { createClient as createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type CaptionPlatform = "instagram" | "facebook" | "linkedin" | "whatsapp";

const PLATFORM_INSTRUCTIONS: Record<CaptionPlatform, string> = {
  instagram:
    "Short, punchy caption (max 200 characters). Include emojis throughout. After the caption, add a separate block of 20-30 relevant hashtags.",
  facebook:
    "Longer narrative caption (300-500 characters). Include a clear call-to-action (e.g. 'Book now', 'Learn more'). End with 3-5 relevant hashtags. Emojis are okay but keep it moderate.",
  linkedin:
    "Professional and polished tone (200-400 characters). Focus on value, trust, and industry expertise. Use industry-relevant hashtags (5-8). No emojis at all.",
  whatsapp:
    "Informal and friendly (max 150 characters). Use emojis liberally. End with a contact CTA like 'Reply to book!' or 'DM us now!'. No hashtags needed.",
};

const captionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    instagram: { type: SchemaType.STRING },
    facebook: { type: SchemaType.STRING },
    linkedin: { type: SchemaType.STRING },
    whatsapp: { type: SchemaType.STRING },
    hashtags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['instagram', 'facebook', 'linkedin', 'whatsapp', 'hashtags'],
};

function buildFallbackCaptions(templateData: Record<string, string>): Record<string, unknown> {
  const dest = templateData.destination || "an amazing destination";
  const offer = templateData.offer || "Special offer available";
  const company = templateData.companyName || "Our Agency";
  const contact = templateData.contactNumber || "";

  return {
    instagram:
      `Sun, sand, and absolute luxury! \u{1F30A}\u{2728} My trip to ${dest} was truly a dream. ${offer} is still on! \u{2708}\u{FE0F}\u{1F334}`,
    facebook:
      `Dreaming of ${dest}? We just got back and it was absolutely incredible! From stunning sunsets to world-class hospitality, every moment was unforgettable. ${company} is offering ${offer} right now - don't miss out! Book your dream vacation today and create memories that last a lifetime. \u{1F31F}`,
    linkedin:
      `Excited to announce our latest ${dest} travel package at ${company}. We have curated an exceptional experience combining luxury, comfort, and value. With ${offer}, this is the perfect time for corporate retreats and incentive travel. Contact us: ${contact}`,
    whatsapp:
      `Hey! \u{1F44B} Check out our ${dest} package! ${offer} \u{1F525} Reply to book! \u{1F4F2}`,
    hashtags: [
      "travel", "luxury", "vacation", "wanderlust", "travelgram",
      "explore", "holiday", "tourism", "travelblogger", "instatravel",
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const { templateData, tone, platform } = await req.json();

    const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(buildFallbackCaptions(templateData));
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: captionSchema as ResponseSchema,
      },
    });

    const toneInstruction = tone ? `Use a "${tone}" tone throughout all captions.` : "";
    const platformFocus = platform && platform in PLATFORM_INSTRUCTIONS
      ? `The user is primarily targeting ${platform}, so make that caption especially strong.`
      : "";

    const platformGuide = Object.entries(PLATFORM_INSTRUCTIONS)
      .map(([key, instruction]) => `- ${key}: ${instruction}`)
      .join("\n    ");

    const prompt = `Generate engaging social media captions for a travel package.
    ${toneInstruction}
    ${platformFocus}

    Travel package details:
    - Destination: ${templateData.destination}
    - Price: ${templateData.price}
    - Offer: ${templateData.offer}
    - Company: ${templateData.companyName}
    - Contact: ${templateData.contactNumber || ""}
    - Services: ${(templateData.services || []).join(", ")}

    Generate captions for ALL four platforms following these guidelines:
    ${platformGuide}

    Also provide 15-25 relevant hashtags (without the # symbol) covering broad travel, niche, and destination-specific tags.`;

    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    return apiSuccess(response);

  } catch (error) {
    console.error("Caption Error:", error);
    return apiError("Failed to generate captions", 500);
  }
}
