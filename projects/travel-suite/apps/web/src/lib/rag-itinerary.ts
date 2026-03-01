/**
 * RAG-Based Itinerary Generation
 * Uses vector search to find matching templates and assembles them into custom itineraries
 */

import { generateEmbedding } from './embeddings';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import type { ItineraryResult } from '@/types/itinerary';

let cachedOpenAiClient: OpenAI | null | undefined;

function getOpenAiClient(): OpenAI | null {
    if (cachedOpenAiClient !== undefined) {
        return cachedOpenAiClient;
    }
    const key = process.env.OPENAI_API_KEY;
    cachedOpenAiClient = key ? new OpenAI({ apiKey: key }) : null;
    return cachedOpenAiClient;
}

export interface RAGItineraryRequest {
    destination: string;
    days: number;
    budget?: string;
    interests?: string[];
    requestingOrgId?: string;
}

interface RAGTemplateMatch {
    template_id: string;
    name: string;
    combined_rank: number | string;
    similarity: number | string;
    quality_score: number | string | null;
}

interface TemplateActivityRow {
    time?: string | null;
    title: string;
    description?: string | null;
    location?: string | null;
    price?: number | null;
    duration?: string | null;
    transport?: string | null;
    image_url?: string | null;
}

interface TemplateDayRow {
    day_number: number;
    title?: string | null;
    activities?: TemplateActivityRow[] | null;
}

interface TourTemplateRow {
    id: string;
    name: string;
    destination: string;
    duration_days: number;
    description?: string | null;
    days?: TemplateDayRow[] | null;
}

type RAGAssembledItinerary = ItineraryResult & Record<string, unknown> & {
    source: 'rag_assembly' | 'rag_template_exact';
    base_template_id: string;
    similarity_score?: number;
    template_count?: number;
};

function toFiniteNumber(value: number | string | null | undefined): number {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Search for matching templates using RAG (unified across all operators)
 */
export async function searchTemplates(
    request: RAGItineraryRequest
): Promise<RAGTemplateMatch[] | null> {
    const supabase = await createClient();

    // Generate query embedding
    const queryText = [
        request.destination,
        request.budget,
        ...(request.interests || [])
    ].filter(Boolean).join(' ');

    const queryEmbedding = await generateEmbedding(queryText);

    if (queryEmbedding.length === 0) {
        console.log('⚠️ Embeddings not available - skipping RAG search');
        return null;
    }

    // Search similar templates across ALL public templates (unified sharing)
    const { data: matchRows, error } = await supabase.rpc('search_similar_templates_with_quality', {
        p_query_embedding: `[${queryEmbedding.join(',')}]`,
        p_match_threshold: 0.7,
        p_match_count: 5,
        p_min_days: Math.max(1, request.days - 2),
        p_max_days: request.days + 2,
        ...(request.requestingOrgId && { p_exclude_organization_id: request.requestingOrgId })
    });
    const matches = (matchRows as RAGTemplateMatch[] | null) ?? null;

    if (error) {
        console.error('Template search error:', error);
        return null;
    }

    if (matches && matches.length > 0) {
        console.log(`🔍 Found ${matches.length} templates from unified knowledge base:`);
        matches.forEach((match, i) => {
            console.log(
                `  ${i + 1}. ${match.name} (Rank: ${toFiniteNumber(match.combined_rank).toFixed(2)}, Similarity: ${toFiniteNumber(match.similarity).toFixed(2)}, Quality: ${match.quality_score})`
            );
        });
    }

    return matches;
}

/**
 * Assemble itinerary from template(s) with AI personalization
 */
export async function assembleItinerary(
    templates: RAGTemplateMatch[],
    request: RAGItineraryRequest
): Promise<RAGAssembledItinerary | null> {
    if (!templates || templates.length === 0) return null;

    const supabase = await createClient();
    const baseTemplate = templates[0]; // Highest similarity match

    // Fetch full template with days and activities
    const { data: fullTemplateData } = await supabase
        .from('tour_templates')
        .select(`
            *,
            days:template_days(
                *,
                activities:template_activities(*)
            )
        `)
        .eq('id', baseTemplate.template_id)
        .order('day_number', { foreignTable: 'template_days', ascending: true })
        .order('display_order', { foreignTable: 'template_days.template_activities', ascending: true })
        .single();
    const fullTemplate = (fullTemplateData as TourTemplateRow | null) ?? null;

    if (!fullTemplate) return null;

    // If days match exactly, return template as-is (fastest path)
    if (fullTemplate.duration_days === request.days) {
        console.log(`✅ Exact match! Using template as-is`);
        return formatTemplateAsItinerary(fullTemplate);
    }

    // Use GPT-4o-mini to intelligently modify template
    const openai = getOpenAiClient();
    if (!openai) {
        console.log('⚠️ OpenAI not configured - returning closest template without modification');
        return formatTemplateAsItinerary(fullTemplate);
    }

    console.log(`🤖 Using AI to adapt ${fullTemplate.duration_days}-day template to ${request.days} days...`);

    const assemblyPrompt = `
You are a travel itinerary expert. You have a high-quality ${fullTemplate.duration_days}-day itinerary
for ${fullTemplate.destination}. Adapt it to create a ${request.days}-day itinerary.

Original Template:
${JSON.stringify({
        name: fullTemplate.name,
        destination: fullTemplate.destination,
        days: fullTemplate.days?.map((day) => ({
            day_number: day.day_number,
            title: day.title,
            activities: day.activities?.map((activity) => ({
                time: activity.time,
                title: activity.title,
                description: activity.description,
                location: activity.location
            }))
        }))
    }, null, 2)}

Requirements:
- Create exactly ${request.days} days
- ${request.days > (fullTemplate.duration_days || 0) ? 'Add similar activities to extend the itinerary logically' : 'Condense activities while keeping the best ones'}
- Maintain logical flow and timing
- Keep budget level: ${request.budget || 'moderate'}
- Emphasize interests: ${request.interests?.join(', ') || 'general tourism'}
- Each activity description MUST be 8-10 sentences minimum (very detailed)

Return ONLY valid JSON matching this schema:
{
    "trip_title": string,
    "destination": string,
    "duration_days": number,
    "summary": string,
    "days": [
        {
            "day_number": number,
            "theme": string,
            "activities": [
                {
                    "time": string,
                    "title": string,
                    "description": string (8-10 sentences minimum!),
                    "location": string,
                    "duration": string,
                    "cost": string,
                    "transport": string
                }
            ]
        }
    ]
}
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: assemblyPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const assembledItinerary = JSON.parse(
            response.choices[0].message.content || '{}'
        ) as RAGAssembledItinerary;

        // Add metadata
        assembledItinerary.source = 'rag_assembly';
        assembledItinerary.base_template_id = baseTemplate.template_id;
        assembledItinerary.similarity_score = toFiniteNumber(baseTemplate.similarity);
        assembledItinerary.template_count = templates.length;

        return assembledItinerary;
    } catch (error) {
        console.error('AI assembly error:', error);
        // Fallback to template as-is
        return formatTemplateAsItinerary(fullTemplate);
    }
}

function formatTemplateAsItinerary(template: TourTemplateRow): RAGAssembledItinerary {
    // Convert template structure to itinerary format
    return {
        trip_title: template.name,
        destination: template.destination,
        duration_days: template.duration_days,
        summary: template.description || `Explore the best of ${template.destination} with this carefully curated itinerary.`,
        source: 'rag_template_exact',
        base_template_id: template.id,
        days: (template.days || []).map((day) => ({
            day_number: day.day_number,
            theme: day.title || `Day ${day.day_number}`,
            activities: (day.activities || []).map((activity) => ({
                time: activity.time || 'TBD',
                title: activity.title,
                description: activity.description || 'Details to be provided.',
                location: activity.location || '',
                cost: activity.price ? `$${activity.price}` : undefined,
                duration: activity.duration || undefined,
                transport: activity.transport || undefined,
                image: activity.image_url || undefined
            }))
        }))
    };
}

/**
 * Save attribution tracking for template usage
 */
export async function saveAttributionTracking(
    itineraryCacheId: string,
    templateId: string,
    requestingOrgId?: string
) {
    const supabase = await createClient();

    // Get source organization ID
    const { data: template } = await supabase
        .from('tour_templates')
        .select('organization_id')
        .eq('id', templateId)
        .single();

    if (!template) return;

    // Insert attribution record
    await supabase
        .from('template_usage_attribution')
        .insert({
            itinerary_cache_id: itineraryCacheId,
            source_template_id: templateId,
            source_organization_id: template.organization_id,
            requesting_organization_id: requestingOrgId || null,
            contribution_percentage: 100, // Single template = 100% contribution
            similarity_score: null
        });

    // Update template usage stats atomically
    await supabase.rpc('increment_template_usage', {
        p_template_id: templateId
    });
}
