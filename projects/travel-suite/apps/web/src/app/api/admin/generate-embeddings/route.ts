import { NextRequest, NextResponse } from 'next/server';
import { embedAllTemplates } from '@/lib/embeddings';

/**
 * Admin endpoint to generate embeddings for all tour templates
 *
 * This should be run once after applying the RAG migration to embed existing templates.
 * It can also be run periodically to re-generate embeddings after template updates.
 *
 * @example
 * POST /api/admin/generate-embeddings
 * Response: { success: true, templatesProcessed: 42, errors: [] }
 */
export async function POST(req: NextRequest) {
  try {
    console.log('Starting batch embedding generation for all templates...');

    const result = await embedAllTemplates();

    if (result.errors.length > 0) {
      console.error(`Embedding generation completed with ${result.errors.length} errors:`, result.errors);
    }

    return NextResponse.json({
      success: true,
      templatesProcessed: result.processed,
      templatesWithErrors: result.errors.length,
      errors: result.errors,
      message: `Successfully processed ${result.processed} templates. ${result.errors.length} errors encountered.`
    });

  } catch (error) {
    console.error('Batch embedding generation failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to generate embeddings. Check server logs for details.'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check embedding generation status
 *
 * @example
 * GET /api/admin/generate-embeddings
 * Response: { totalTemplates: 100, withEmbeddings: 85, withoutEmbeddings: 15 }
 */
export async function GET(req: NextRequest) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Count templates with and without embeddings
    const { data: stats, error } = await supabase.rpc('get_embedding_stats');

    if (error) {
      // Fallback manual count if RPC doesn't exist
      const { count: total } = await supabase
        .from('tour_templates')
        .select('*', { count: 'exact', head: true });

      const { count: withEmbeddings } = await supabase
        .from('tour_templates')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      return NextResponse.json({
        totalTemplates: total || 0,
        withEmbeddings: withEmbeddings || 0,
        withoutEmbeddings: (total || 0) - (withEmbeddings || 0),
        percentageComplete: total ? Math.round((withEmbeddings || 0) / total * 100) : 0
      });
    }

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Failed to get embedding stats:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
