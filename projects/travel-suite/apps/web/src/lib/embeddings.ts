/**
 * Embedding Generation Utilities
 * Provides functions to generate vector embeddings for RAG-based template search.
 *
 * V2 uses Gemini embeddings while keeping pgvector storage/search in Supabase.
 */

import { createClient } from "@/lib/supabase/server";
import { logEvent, logError } from "@/lib/observability/logger";
import {
  EMBEDDING_MODEL_V2,
  EMBEDDING_VERSION_V2,
  generateDocumentEmbeddingV2,
  isEmbeddingV2Configured,
  toVectorLiteral,
} from "@/lib/embeddings-v2";

/**
 * Generate embedding vector for text using Gemini embeddings.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!isEmbeddingV2Configured()) {
    logEvent('warn',
      "[embeddings] GOOGLE_GEMINI_API_KEY not configured - embeddings disabled",
    );
    return [];
  }

  return generateDocumentEmbeddingV2(text);
}

/**
 * Generate embeddings for a tour template and update database.
 */
export async function embedTemplate(templateId: string) {
  const supabase = await createClient();

  const { data: template, error: fetchError } = await supabase
    .from("tour_templates")
    .select("id, name, destination, description, tags")
    .eq("id", templateId)
    .single();

  if (fetchError || !template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const searchableText = [
    template.name,
    template.destination,
    template.description,
    ...(template.tags || []),
  ]
    .filter(Boolean)
    .join(" ");

  const embedding = await generateEmbedding(searchableText);

  if (embedding.length === 0) {
    logEvent('warn',
      `[embeddings] Skipping embedding for template ${templateId} - Gemini key not configured`,
    );
    return null;
  }

  const qualityScore = Math.min(
    1.0,
    0.3 +
      ((template.description?.length || 0) > 100 ? 0.3 : 0) +
      (template.tags && template.tags.length > 0 ? 0.2 : 0) +
      ((template.name?.length || 0) > 10 ? 0.2 : 0),
  );

  const { error: updateError } = await supabase
    .from("tour_templates")
    .update({
      embedding_v2: toVectorLiteral(embedding),
      embedding_model: EMBEDDING_MODEL_V2,
      embedding_version: EMBEDDING_VERSION_V2,
      searchable_text: searchableText,
      embedding_updated_at: new Date().toISOString(),
      quality_score: qualityScore,
    })
    .eq("id", templateId);

  if (updateError) {
    throw updateError;
  }

  return {
    embedding,
    searchableText,
    qualityScore,
    model: EMBEDDING_MODEL_V2,
    version: EMBEDDING_VERSION_V2,
  };
}

/**
 * Batch generate v2 embeddings for templates missing Gemini vectors.
 */
export async function embedAllTemplates() {
  const supabase = await createClient();

  const { data: templates, error } = await supabase
    .from("tour_templates")
    .select("id, name")
    .is("embedding_v2", null)
    .eq("status", "active")
    .limit(100);

  if (error || !templates) {
    throw error || new Error("No templates found");
  }

  logEvent('info',
    `Starting batch v2 embedding generation for ${templates.length} templates`,
  );

  const errors: Array<{ id: string; name: string; error: string }> = [];
  let processed = 0;

  for (const template of templates) {
    try {
      await embedTemplate(template.id);
      processed++;
      logEvent('info',
        `[${processed}/${templates.length}] Embedded (v2): ${template.name}`,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push({
        id: template.id,
        name: template.name,
        error: errorMessage,
      });
      logError(
        `Failed to embed template ${template.name} with v2 embeddings`,
        err,
      );
    }
  }

  logEvent('info',
    `V2 embedding batch complete: ${processed} processed, ${errors.length} errors`,
  );

  return {
    processed,
    total: templates.length,
    errors,
    model: EMBEDDING_MODEL_V2,
    version: EMBEDDING_VERSION_V2,
  };
}
