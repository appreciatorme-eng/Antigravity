/**
 * Embedding Generation Utilities
 * Provides functions to generate vector embeddings for RAG-based template search
 */

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embedding vector for text using OpenAI text-embedding-3-small
 * Cost: ~$0.00002 per 1K tokens (~$0.0001 per itinerary)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY not configured - embeddings disabled');
        return [];
    }

    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.substring(0, 8000), // Max context window
            dimensions: 1536,
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Embedding generation error:', error);
        return [];
    }
}

/**
 * Generate embeddings for a tour template and update database
 */
export async function embedTemplate(templateId: string) {
    const supabase = await createClient();

    // Get template data
    const { data: template, error: fetchError } = await supabase
        .from('tour_templates')
        .select('id, name, destination, description, tags')
        .eq('id', templateId)
        .single();

    if (fetchError || !template) {
        throw new Error(`Template not found: ${templateId}`);
    }

    // Generate searchable text
    const searchableText = [
        template.name,
        template.destination,
        template.description,
        ...(template.tags || [])
    ].filter(Boolean).join(' ');

    // Generate embedding
    const embedding = await generateEmbedding(searchableText);

    if (embedding.length === 0) {
        console.warn(`Skipping embedding for template ${templateId} - no OpenAI key`);
        return null;
    }

    // Calculate quality score
    const { data: qualityResult } = await supabase.rpc('calculate_template_quality', {
        p_template_id: templateId
    });

    const qualityScore = qualityResult?.[0] || 0.5;

    // Update template with embedding
    const { error: updateError } = await supabase
        .from('tour_templates')
        .update({
            embedding: `[${embedding.join(',')}]`,
            searchable_text: searchableText,
            embedding_updated_at: new Date().toISOString(),
            quality_score: qualityScore
        })
        .eq('id', templateId);

    if (updateError) {
        throw updateError;
    }

    return { embedding, searchableText, qualityScore };
}

/**
 * Batch generate embeddings for all templates without embeddings
 */
export async function embedAllTemplates() {
    const supabase = await createClient();

    // Get templates without embeddings
    const { data: templates, error } = await supabase
        .from('tour_templates')
        .select('id, name')
        .is('embedding', null)
        .eq('status', 'active')
        .limit(50); // Process in batches

    if (error || !templates) {
        throw error || new Error('No templates found');
    }

    const results = [];
    for (const template of templates) {
        try {
            const result = await embedTemplate(template.id);
            results.push({ id: template.id, name: template.name, success: true, result });
            console.log(`✅ Embedded template: ${template.name}`);
        } catch (err) {
            results.push({ id: template.id, name: template.name, success: false, error: err });
            console.error(`❌ Failed to embed template ${template.name}:`, err);
        }
    }

    return results;
}
