/* ------------------------------------------------------------------
 * Voice message transcription using OpenAI Whisper API.
 * Converts base64 audio → text transcript + optional intent extraction.
 * ------------------------------------------------------------------ */

import "server-only";
import OpenAI from "openai";
import { logError, logEvent } from "@/lib/observability/logger";

let cachedClient: OpenAI | null | undefined;

function getOpenAiClient(): OpenAI | null {
    if (cachedClient !== undefined) return cachedClient;
    const key = process.env.OPENAI_API_KEY;
    cachedClient = key ? new OpenAI({ apiKey: key }) : null;
    return cachedClient;
}

export interface TranscriptionResult {
    readonly text: string;
    readonly language: string | null;
    readonly durationSeconds: number | null;
    readonly intent: TripIntent | null;
}

export interface TripIntent {
    readonly destination: string | null;
    readonly dates: string | null;
    readonly paxCount: number | null;
    readonly budget: string | null;
    readonly summary: string;
}

/**
 * Transcribe a base64-encoded audio file using OpenAI Whisper.
 * Returns the transcribed text and detected language.
 */
export async function transcribeVoiceMessage(
    base64Audio: string,
    mimeType: string = "audio/ogg",
): Promise<TranscriptionResult | null> {
    const client = getOpenAiClient();
    if (!client) {
        logError("[voice-transcription] OpenAI client not configured", undefined);
        return null;
    }

    try {
        // Strip data URI prefix if present
        const raw = base64Audio.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(raw, "base64");

        // Determine file extension from MIME type
        const extMap: Record<string, string> = {
            "audio/ogg": "ogg",
            "audio/mpeg": "mp3",
            "audio/mp4": "m4a",
            "audio/wav": "wav",
            "audio/webm": "webm",
        };
        const ext = extMap[mimeType] ?? "ogg";

        // Create a File object for the API
        const file = new File([buffer], `voice.${ext}`, { type: mimeType });

        logEvent("info", `[voice-transcription] Transcribing ${buffer.length} bytes (${mimeType})`);

        const transcription = await client.audio.transcriptions.create({
            model: "whisper-1",
            file,
            response_format: "verbose_json",
        });

        const text = transcription.text?.trim() ?? "";
        if (!text) return null;

        // Extract trip intent from transcribed text
        const intent = await extractTripIntent(client, text);

        return {
            text,
            language: transcription.language ?? null,
            durationSeconds: transcription.duration ?? null,
            intent,
        };
    } catch (error) {
        logError("[voice-transcription] Transcription failed", error);
        return null;
    }
}

/**
 * Extract trip booking intent from transcribed voice message text.
 * Returns null if no trip-related intent is detected.
 */
async function extractTripIntent(
    client: OpenAI,
    text: string,
): Promise<TripIntent | null> {
    // Skip short messages unlikely to contain trip details
    if (text.length < 20) return null;

    try {
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0,
            max_tokens: 200,
            messages: [
                {
                    role: "system",
                    content: `You extract trip booking intent from customer messages for an Indian tour operator.
If the message contains travel intent, return JSON with these fields:
- destination: string or null
- dates: string or null (e.g. "next month", "December 15-20")
- paxCount: number or null
- budget: string or null (e.g. "1 lakh", "50000")
- summary: one-line summary of what the customer wants

If the message has NO travel intent (greetings, complaints, general questions), return exactly: null`,
                },
                { role: "user", content: text },
            ],
        });

        const raw = response.choices[0]?.message?.content?.trim() ?? "";
        if (!raw || raw === "null") return null;

        const parsed = JSON.parse(raw) as TripIntent;
        return parsed;
    } catch {
        // Intent extraction is best-effort — don't fail the transcription
        return null;
    }
}
