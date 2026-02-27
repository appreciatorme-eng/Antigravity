import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { createClient as createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image } = await req.json(); // base64 image

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

    if (!geminiApiKey) {
      console.warn('⚠️ No AI keys configured. Returning mock extraction.');
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
        responseSchema: extractionSchema as any,
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
    return NextResponse.json(response);

  } catch (error) {
    console.error("Extraction Error:", error);
    return NextResponse.json({ error: "Failed to extract content" }, { status: 500 });
  }
}
