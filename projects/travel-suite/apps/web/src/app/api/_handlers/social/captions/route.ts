import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createClient as createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const captionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    instagram: { type: SchemaType.STRING },
    linkedin: { type: SchemaType.STRING },
    hashtags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['instagram', 'linkedin', 'hashtags'],
};

export async function POST(req: NextRequest) {
  try {
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateData } = await req.json();

    const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json({
         instagram: "Sun, sand, and absolute luxury! 🌊✨ My trip to " + templateData.destination + " was truly a dream. " + templateData.offer + " is still on! #Travel #Adventure",
         linkedin: "Delighted to share our latest " + templateData.destination + " package. At " + templateData.companyName + ", we prioritize your comfort. Book now: " + templateData.contactNumber,
         hashtags: ["travel", "luxury", "vacation"]
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: captionSchema as any,
      },
    });

    const prompt = `Generate engaging social media captions for a travel package:
    Destination: ${templateData.destination}
    Price: ${templateData.price}
    Offer: ${templateData.offer}
    Company: ${templateData.companyName}
    
    Provide:
    1. A catchy Instagram caption with emojis.
    2. A professional LinkedIn post focusing on value and trust.
    3. Relevant hashtags.`;

    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    return NextResponse.json(response);

  } catch (error) {
    console.error("Caption Error:", error);
    return NextResponse.json({ error: "Failed to generate captions" }, { status: 500 });
  }
}
