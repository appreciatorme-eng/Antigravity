/**
 * RAG-Based Itinerary Generation
 * Uses vector search to find matching templates and assembles them into custom itineraries
 */

import { generateEmbedding } from './embeddings';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RAGItineraryRequest {
    destination: string;
    days: number;
    budget?: string;
    interests?: string[];
    requestingOrgId?: string;
}

/**
 * Search for matching templates using RAG (unified across all operators)
 */
export async function searchTemplates(
    request: RAGItineraryRequest
): Promise<any[] | null> {
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
    const { data: matches, error } = await supabase.rpc('search_similar_templates_with_quality', {
        p_query_embedding: `[${queryEmbedding.join(',')}]`,
        p_match_threshold: 0.7,
        p_match_count: 5,
        p_min_days: Math.max(1, request.days - 2),
        p_max_days: request.days + 2,
        p_exclude_organization_id: request.requestingOrgId || null
    });

    if (error) {
        console.error('Template search error:', error);
        return null;
    }

    if (matches && matches.length > 0) {
        console.log(`🔍 Found ${matches.length} templates from unified knowledge base:`);
        matches.forEach((m: any, i: number) => {
            console.log(`  ${i + 1}. ${m.name} (Rank: ${parseFloat(m.combined_rank).toFixed(2)}, Similarity: ${parseFloat(m.similarity).toFixed(2)}, Quality: ${m.quality_score})`);
        });
    }

    return matches;
}

/**
 * Assemble itinerary from template(s) with AI personalization
 */
export async function assembleItinerary(
    templates: any[],
    request: RAGItineraryRequest
): Promise<any | null> {
    if (!templates || templates.length === 0) return null;

    const supabase = await createClient();
    const baseTemplate = templates[0]; // Highest similarity match

    // Fetch full template with days and activities
    const { data: fullTemplate } = await supabase
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

    if (!fullTemplate) return null;

    // If days match exactly, return template as-is (fastest path)
    if (fullTemplate.duration_days === request.days) {
        console.log(`✅ Exact match! Using template as-is`);
        return formatTemplateAsItinerary(fullTemplate);
    }

    // Use GPT-4o-mini to intelligently modify template
    if (!process.env.OPENAI_API_KEY) {
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
    days: fullTemplate.days?.map((d: any) => ({
        day_number: d.day_number,
        title: d.title,
        activities: d.activities?.map((a: any) => ({
            time: a.time,
            title: a.title,
            description: a.description,
            location: a.location
        }))
    }))
}, null, 2)}

Requirements:
- Create exactly ${request.days} days
- ${request.days > fullTemplate.duration_days ? 'Add similar activities to extend the itinerary logically' : 'Condense activities while keeping the best ones'}
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

        const assembledItinerary = JSON.parse(response.choices[0].message.content || '{}');

        // Add metadata
        assembledItinerary.source = 'rag_assembly';
        assembledItinerary.base_template_id = baseTemplate.template_id;
        assembledItinerary.similarity_score = baseTemplate.similarity;
        assembledItinerary.template_count = templates.length;

        return assembledItinerary;
    } catch (error) {
        console.error('AI assembly error:', error);
        // Fallback to template as-is
        return formatTemplateAsItinerary(fullTemplate);
    }
}

function formatTemplateAsItinerary(template: any) {
    // Convert template structure to itinerary format
    return {
        trip_title: template.name,
        destination: template.destination,
        duration_days: template.duration_days,
        summary: template.description || `Explore the best of ${template.destination} with this carefully curated itinerary.`,
        source: 'rag_template_exact',
        base_template_id: template.id,
        days: (template.days || []).map((day: any) => ({
            day_number: day.day_number,
            theme: day.title || `Day ${day.day_number}`,
            activities: (day.activities || []).map((act: any) => ({
                time: act.time || 'TBD',
                title: act.title,
                description: act.description || 'Details to be provided.',
                location: act.location,
                cost: act.price ? `$${act.price}` : undefined,
                duration: act.duration,
                transport: act.transport,
                image: act.image_url
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

    // Update template usage stats
    await supabase
        .from('tour_templates')
        .update({
            usage_count: supabase.raw('usage_count + 1') as any,
            last_used_at: new Date().toISOString()
        })
        .eq('id', templateId);
}
