/**
 * Receipt OCR Service using GPT-4o Vision
 * Extracts amount, currency, and confidence from receipt images
 */

import OpenAI from 'openai';
import { logEvent, logError } from '@/lib/observability/logger';

let cachedOpenAiClient: OpenAI | null | undefined;

function getOpenAiClient(): OpenAI | null {
    if (cachedOpenAiClient !== undefined) {
        return cachedOpenAiClient;
    }
    const key = process.env.OPENAI_API_KEY;
    cachedOpenAiClient = key ? new OpenAI({ apiKey: key }) : null;
    return cachedOpenAiClient;
}

export interface ReceiptExtractionResult {
    amount: number;
    currency: string;
    confidence: number;
    raw_response: string;
}

/**
 * Extract total amount and currency from receipt image using GPT-4o Vision
 */
export async function extractAmountFromReceipt(
    imageUrl: string
): Promise<ReceiptExtractionResult> {
    const openai = getOpenAiClient();
    if (!openai) {
        throw new Error('OpenAI API key not configured');
    }

    try {
        logEvent('info', 'Starting receipt OCR extraction', { imageUrl });

        const prompt = `
You are an expert receipt analyzer. Extract the total amount and currency from this receipt image.

IMPORTANT: Return ONLY valid JSON matching this exact schema. No markdown, no explanations.

{
  "amount": 1234.56,
  "currency": "USD",
  "confidence": 0.95
}

EXTRACTION RULES:
1. Extract the TOTAL/GRAND TOTAL amount (not subtotals or individual items)
2. Return amount as a number (e.g., 1234.56, not "1,234.56" or "$1234.56")
3. Currency should be the 3-letter ISO code (USD, EUR, INR, GBP, etc.)
4. Confidence should be 0.0 to 1.0 based on image clarity and text readability
   - 0.9-1.0: Crystal clear, high certainty
   - 0.7-0.89: Good quality, reasonable certainty
   - 0.5-0.69: Moderate quality, some uncertainty
   - Below 0.5: Poor quality or ambiguous
5. If multiple currencies appear, extract the one associated with the total
6. Look for keywords: "Total", "Grand Total", "Amount Due", "Payment"
7. If no clear total is visible, return the largest amount with lower confidence

Return ONLY the JSON object, no other text.
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a receipt OCR expert. Extract total amount and currency with maximum accuracy. Return only valid JSON."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                                detail: "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300,
            temperature: 0.1 // Low temperature for deterministic extraction
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
            throw new Error('Empty response from OpenAI');
        }

        logEvent('info', 'Receipt OCR raw response', { content });

        // Parse JSON response
        let parsedData: { amount: number; currency: string; confidence: number };
        try {
            // Remove markdown code blocks if present
            const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            parsedData = JSON.parse(jsonStr);
        } catch (parseError) {
            logError('Receipt OCR JSON parse failed', parseError as Error, { content });
            throw new Error('Failed to parse OpenAI response as JSON');
        }

        // Validate extracted data
        if (
            typeof parsedData.amount !== 'number' ||
            typeof parsedData.currency !== 'string' ||
            typeof parsedData.confidence !== 'number'
        ) {
            throw new Error('Invalid extraction result structure');
        }

        if (parsedData.amount < 0) {
            throw new Error('Invalid amount: negative value');
        }

        if (parsedData.confidence < 0 || parsedData.confidence > 1) {
            throw new Error('Invalid confidence: must be between 0 and 1');
        }

        if (parsedData.currency.length !== 3) {
            throw new Error('Invalid currency: must be 3-letter ISO code');
        }

        logEvent('info', 'Receipt OCR extraction successful', {
            amount: parsedData.amount,
            currency: parsedData.currency,
            confidence: parsedData.confidence
        });

        return {
            amount: parsedData.amount,
            currency: parsedData.currency.toUpperCase(),
            confidence: parsedData.confidence,
            raw_response: content
        };
    } catch (error) {
        logError('Receipt OCR extraction failed', error as Error, { imageUrl });
        throw error;
    }
}
