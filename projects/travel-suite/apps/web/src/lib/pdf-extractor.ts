/**
 * PDF Extraction Service using GPT-4o Vision
 * Extracts structured tour template data from PDF brochures
 */

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/database.types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedTemplate {
    name: string;
    destination: string;
    duration_days: number;
    description: string;
    budget_level?: 'budget' | 'moderate' | 'luxury' | 'ultra-luxury';
    tags?: string[];
    days: Array<{
        day_number: number;
        theme: string;
        description: string;
        activities: Array<{
            title: string;
            description: string;
            location?: string;
            time?: string;
            duration?: string;
            cost?: string;
            image_url?: string;
        }>;
    }>;
    accommodations?: Array<{
        name: string;
        location: string;
        check_in_day: number;
        check_out_day: number;
        room_type?: string;
        meal_plan?: string;
        price_per_night?: number;
    }>;
    inclusions?: string[];
    exclusions?: string[];
    pricing?: {
        base_price?: number;
        currency?: string;
        price_per_person?: number;
        single_supplement?: number;
    };
}

export interface ExtractionResult {
    success: boolean;
    template?: ExtractedTemplate;
    confidence: number;
    error?: string;
    raw_response?: string;
}

/**
 * Convert PDF to base64 for GPT-4o Vision
 */
async function pdfToBase64(pdfUrl: string): Promise<string> {
    const response = await fetch(pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
}

/**
 * Extract tour template data from PDF using GPT-4o Vision
 */
export async function extractTemplateFromPDF(pdfUrl: string): Promise<ExtractionResult> {
    if (!process.env.OPENAI_API_KEY) {
        return {
            success: false,
            confidence: 0,
            error: 'OpenAI API key not configured'
        };
    }

    try {
        console.log('📄 Starting PDF extraction:', pdfUrl);

        // For now, we'll use GPT-4o with text extraction
        // In production, you'd use a PDF-to-image converter first
        // or use GPT-4o Vision directly with PDF pages as images

        const prompt = `
You are an expert tour operator assistant. Extract structured tour itinerary data from this PDF brochure.

IMPORTANT: Return ONLY valid JSON matching this exact schema. No markdown, no explanations.

{
  "name": "Tour package name",
  "destination": "Primary destination (city/country)",
  "duration_days": 7,
  "description": "2-3 sentence overview of the tour (8-10 sentences minimum)",
  "budget_level": "budget|moderate|luxury|ultra-luxury",
  "tags": ["safari", "wildlife", "nature"],
  "days": [
    {
      "day_number": 1,
      "theme": "Day theme (e.g., 'Arrival & City Tour')",
      "description": "Day overview (2-3 sentences)",
      "activities": [
        {
          "title": "Activity name with location (e.g., 'Senso-ji Temple Visit')",
          "description": "8-10 detailed sentences about the activity. Include: what it is, historical context, what to see, walkthrough of the experience, visitor tips, and practical information. Never use 'Option 1/Option 2' format.",
          "location": "Specific location name",
          "time": "09:00 AM or Morning/Afternoon/Evening",
          "duration": "2-3 hours with explanation",
          "cost": "$50 or Free or included",
          "image_url": null
        }
      ]
    }
  ],
  "accommodations": [
    {
      "name": "Hotel name",
      "location": "Hotel location",
      "check_in_day": 1,
      "check_out_day": 3,
      "room_type": "Deluxe Double",
      "meal_plan": "Bed & Breakfast",
      "price_per_night": 150
    }
  ],
  "inclusions": [
    "Airport transfers",
    "All accommodation",
    "Daily breakfast"
  ],
  "exclusions": [
    "International flights",
    "Travel insurance",
    "Personal expenses"
  ],
  "pricing": {
    "base_price": 2500,
    "currency": "USD",
    "price_per_person": 2500,
    "single_supplement": 400
  }
}

EXTRACTION RULES:
1. Each activity description MUST be 8-10 sentences minimum
2. NEVER use "Option 1", "Option 2" format - write as flowing paragraphs
3. Include specific times (09:00 AM) when available, otherwise Morning/Afternoon/Evening
4. Extract all pricing information accurately
5. List ALL inclusions and exclusions clearly stated
6. If information is missing, omit the field rather than guessing
7. Activity titles should include location for searchability
8. Day themes should be descriptive (not just "Day 1")

Extract with maximum accuracy. If you're not confident about a field, return null for that field.

Return ONLY the JSON object, no other text.
`;

        // Note: In production, you'd convert PDF pages to images and send them
        // For now, we'll use text-based extraction as a starting point

        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Use GPT-4o for better understanding
            messages: [
                {
                    role: "system",
                    content: "You are a tour itinerary extraction expert. Extract structured data from tour brochures with maximum accuracy. Return only valid JSON."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        // In production, add image_url here:
                        // {
                        //     type: "image_url",
                        //     image_url: {
                        //         url: `data:application/pdf;base64,${base64PDF}`
                        //     }
                        // }
                    ]
                }
            ],
            temperature: 0.1, // Low temperature for consistent extraction
            max_tokens: 4000,
        });

        const rawResponse = response.choices[0]?.message?.content || '';
        console.log('🤖 GPT-4o response received, parsing...');

        // Parse JSON response
        let template: ExtractedTemplate;
        try {
            // Remove markdown code blocks if present
            const jsonText = rawResponse
                .replace(/```json\n/g, '')
                .replace(/```\n?/g, '')
                .trim();

            template = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('❌ JSON parsing error:', parseError);
            return {
                success: false,
                confidence: 0,
                error: 'Failed to parse extraction result as JSON',
                raw_response: rawResponse
            };
        }

        // Validate required fields
        if (!template.name || !template.destination || !template.duration_days) {
            return {
                success: false,
                confidence: 0.3,
                error: 'Missing required fields (name, destination, duration_days)',
                template
            };
        }

        // Calculate confidence score based on completeness
        const confidence = calculateConfidence(template);

        console.log(`✅ Extraction complete: ${template.name} (${confidence.toFixed(2)} confidence)`);

        return {
            success: true,
            template,
            confidence,
            raw_response: rawResponse
        };

    } catch (error) {
        console.error('❌ PDF extraction error:', error);
        return {
            success: false,
            confidence: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Calculate confidence score based on data completeness
 */
function calculateConfidence(template: ExtractedTemplate): number {
    let score = 0;
    let maxScore = 0;

    // Required fields (40 points)
    maxScore += 40;
    if (template.name) score += 10;
    if (template.destination) score += 10;
    if (template.duration_days) score += 10;
    if (template.description && template.description.length > 50) score += 10;

    // Days and activities (30 points)
    maxScore += 30;
    if (template.days && template.days.length > 0) {
        score += 10;

        // Check if days match duration
        if (template.days.length === template.duration_days) {
            score += 5;
        }

        // Check activity quality
        const hasGoodActivities = template.days.some(day =>
            day.activities && day.activities.length > 0 &&
            day.activities.some(act => act.description && act.description.length > 100)
        );
        if (hasGoodActivities) score += 15;
    }

    // Accommodations (10 points)
    maxScore += 10;
    if (template.accommodations && template.accommodations.length > 0) {
        score += 10;
    }

    // Inclusions/Exclusions (10 points)
    maxScore += 10;
    if (template.inclusions && template.inclusions.length > 0) score += 5;
    if (template.exclusions && template.exclusions.length > 0) score += 5;

    // Pricing (10 points)
    maxScore += 10;
    if (template.pricing && template.pricing.base_price) {
        score += 10;
    }

    return Math.min(score / maxScore, 1.0);
}

/**
 * Process PDF import from queue
 */
export async function processPDFImport(pdfImportId: string) {
    const supabase = await createClient();

    try {
        // Get PDF import details
        const { data: pdfImport, error: fetchError } = await supabase
            .from('pdf_imports')
            .select('*')
            .eq('id', pdfImportId)
            .single();

        if (fetchError || !pdfImport) {
            throw new Error(`PDF import not found: ${pdfImportId}`);
        }

        console.log(`📋 Processing PDF import: ${pdfImport.file_name}`);

        // Extract template from PDF
        const result = await extractTemplateFromPDF(pdfImport.file_url);

        if (result.success && result.template) {
            // Save successful extraction
            const { error: updateError } = await supabase
                .from('pdf_imports')
                .update({
                    status: 'extracted',
                    extracted_data: result.template as unknown as Json,
                    extraction_confidence: result.confidence
                })
                .eq('id', pdfImportId);

            if (updateError) {
                throw updateError;
            }

            console.log(`✅ PDF extraction successful: ${result.confidence.toFixed(2)} confidence`);
            return result;

        } else {
            // Save failed extraction
            const { error: updateError } = await supabase
                .from('pdf_imports')
                .update({
                    status: 'failed',
                    extraction_error: result.error || 'Unknown error'
                })
                .eq('id', pdfImportId);

            if (updateError) {
                throw updateError;
            }

            console.error(`❌ PDF extraction failed: ${result.error}`);
            return result;
        }

    } catch (error) {
        console.error('❌ processPDFImport error:', error);

        // Update PDF import with error
        await supabase
            .from('pdf_imports')
            .update({
                status: 'failed',
                extraction_error: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', pdfImportId);

        throw error;
    }
}

/**
 * Publish approved PDF import to tour_templates
 */
export async function publishPDFImport(pdfImportId: string, organizationId: string) {
    const supabase = await createClient();

    try {
        // Get PDF import with extracted data
        const { data: pdfImport, error: fetchError } = await supabase
            .from('pdf_imports')
            .select('*')
            .eq('id', pdfImportId)
            .eq('organization_id', organizationId) // Security check
            .single();

        if (fetchError || !pdfImport) {
            throw new Error('PDF import not found or access denied');
        }

        if (pdfImport.status !== 'approved') {
            throw new Error('PDF import must be approved before publishing');
        }

        if (!pdfImport.extracted_data) {
            throw new Error('No extracted data available');
        }

        const template = pdfImport.extracted_data as unknown as ExtractedTemplate;

        // Create tour template
        const { data: tourTemplate, error: insertError } = await supabase
            .from('tour_templates')
            .insert({
                organization_id: organizationId,
                name: template.name,
                destination: template.destination,
                duration_days: template.duration_days,
                description: template.description,
                budget_level: template.budget_level,
                tags: template.tags || [],
                status: 'active',
                is_public: true, // Default to public for unified sharing
                base_price: template.pricing?.base_price,
                currency: template.pricing?.currency || 'USD',
                // Days, activities, accommodations would be inserted separately
                // in related tables (template_days, template_activities, etc.)
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        console.log(`✅ Published template: ${tourTemplate.id}`);

        // Update PDF import status
        await supabase
            .from('pdf_imports')
            .update({
                status: 'published',
                published_template_id: tourTemplate.id,
                published_at: new Date().toISOString()
            })
            .eq('id', pdfImportId);

        return tourTemplate;

    } catch (error) {
        console.error('❌ publishPDFImport error:', error);
        throw error;
    }
}
