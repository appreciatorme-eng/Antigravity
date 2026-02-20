/**
 * Embedding Generation Utilities
 * Provides functions to generate vector embeddings for RAG-based template search
 */

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

// Lazy initialization to avoid build errors when OPENAI_API_KEY is not set
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
    if (!process.env.OPENAI_API_KEY) return null;
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

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
        const client = getOpenAI();
        if (!client) return [];

        const response = await client.embeddings.create({
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

    // Calculate quality score based on content completeness
    const qualityScore = Math.min(1.0,
        0.3 + // Base score
        ((template.description?.length || 0) > 100 ? 0.3 : 0) + // Has detailed description
        (template.tags && template.tags.length > 0 ? 0.2 : 0) + // Has tags
        ((template.name?.length || 0) > 10 ? 0.2 : 0) // Has descriptive name
    );

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
 * Returns summary statistics and error details
 */
export async function embedAllTemplates() {
    const supabase = await createClient();

    // Get templates without embeddings
    const { data: templates, error } = await supabase
        .from('tour_templates')
        .select('id, name')
        .is('embedding', null)
        .eq('status', 'active')
        .limit(100); // Process in batches

    if (error || !templates) {
        throw error || new Error('No templates found');
    }

    console.log(`🔄 Starting batch embedding for ${templates.length} templates...`);

    const errors: Array<{ id: string; name: string; error: string }> = [];
    let processed = 0;

    for (const template of templates) {
        try {
            await embedTemplate(template.id);
            processed++;
            console.log(`✅ [${processed}/${templates.length}] Embedded: ${template.name}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            errors.push({
                id: template.id,
                name: template.name,
                error: errorMessage
            });
            console.error(`❌ Failed to embed template ${template.name}:`, err);
        }
    }

    console.log(`✨ Batch complete: ${processed} processed, ${errors.length} errors`);

    return {
        processed,
        total: templates.length,
        errors
    };
}
