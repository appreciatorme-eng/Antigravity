import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/config/env";

const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

export function getGeminiModel(model = DEFAULT_GEMINI_MODEL) {
  const apiKey = env.google.geminiApiKey;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model });
}

export function cleanGeminiJson(rawText: string): string {
  return rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

export function parseGeminiJson<T>(rawText: string): T {
  return JSON.parse(cleanGeminiJson(rawText)) as T;
}

