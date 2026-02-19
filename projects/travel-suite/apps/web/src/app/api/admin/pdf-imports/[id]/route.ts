import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processPDFImport, publishPDFImport } from '@/lib/pdf-extractor';

/**
 * Get single PDF import details
 *
 * @example
 * GET /api/admin/pdf-imports/{id}
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const { id } = await params;

        const { data: pdfImport, error: fetchError } = await supabase
            .from('pdf_imports' as any)
            .select('*')
            .eq('id', id)
            .single() as any;

        if (fetchError || !pdfImport) {
            return NextResponse.json({
                success: false,
                error: 'PDF import not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            pdf_import: pdfImport
        });

    } catch (error) {
        console.error('Failed to get PDF import:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Update PDF import (approve, reject, trigger re-extraction)
 *
 * @example
 * PATCH /api/admin/pdf-imports/{id}
 * Body: { action: "approve" | "reject" | "re-extract", notes?: string }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const { id } = await params;

        const body = await req.json();
        const { action, notes, organizationId } = body;

        if (!action) {
            return NextResponse.json({
                success: false,
                error: 'Action required (approve, reject, re-extract)'
            }, { status: 400 });
        }

        // Get PDF import
        const { data: pdfImport, error: fetchError } = await supabase
            .from('pdf_imports' as any)
            .select('*')
            .eq('id', id)
            .single() as any;

        if (fetchError || !pdfImport) {
            return NextResponse.json({
                success: false,
                error: 'PDF import not found'
            }, { status: 404 });
        }

        switch (action) {
            case 'approve':
                // Approve for publishing
                const { error: approveError } = await supabase
                    .from('pdf_imports' as any)
                    .update({
                        status: 'approved',
                        reviewed_by: user.id,
                        reviewed_at: new Date().toISOString(),
                        review_notes: notes
                    })
                    .eq('id', id);

                if (approveError) throw approveError;

                console.log(`✅ PDF import approved: ${id}`);

                return NextResponse.json({
                    success: true,
                    message: 'PDF import approved. Ready to publish.',
                    pdf_import: pdfImport
                });

            case 'reject':
                // Reject extraction
                const { error: rejectError } = await supabase
                    .from('pdf_imports' as any)
                    .update({
                        status: 'rejected',
                        reviewed_by: user.id,
                        reviewed_at: new Date().toISOString(),
                        review_notes: notes
                    })
                    .eq('id', id);

                if (rejectError) throw rejectError;

                console.log(`❌ PDF import rejected: ${id}`);

                return NextResponse.json({
                    success: true,
                    message: 'PDF import rejected.',
                    pdf_import: pdfImport
                });

            case 're-extract':
                // Trigger re-extraction
                console.log(`🔄 Re-extracting PDF: ${id}`);

                const result = await processPDFImport(id);

                return NextResponse.json({
                    success: result.success,
                    message: result.success
                        ? `Re-extraction complete (confidence: ${result.confidence.toFixed(2)})`
                        : 'Re-extraction failed',
                    extraction_result: result
                });

            case 'publish':
                // Publish to tour_templates
                if (!organizationId) {
                    return NextResponse.json({
                        success: false,
                        error: 'Organization ID required for publishing'
                    }, { status: 400 });
                }

                console.log(`📤 Publishing PDF import to templates: ${id}`);

                const template = await publishPDFImport(id, organizationId);

                return NextResponse.json({
                    success: true,
                    message: 'Template published successfully!',
                    template_id: template.id
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: `Unknown action: ${action}`
                }, { status: 400 });
        }

    } catch (error) {
        console.error('Failed to update PDF import:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Delete PDF import
 *
 * @example
 * DELETE /api/admin/pdf-imports/{id}
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const { id } = await params;

        // Get PDF import for file cleanup
        const { data: pdfImport } = await supabase
            .from('pdf_imports' as any)
            .select('file_url')
            .eq('id', id)
            .single() as any;

        // Delete from database
        const { error: deleteError } = await supabase
            .from('pdf_imports' as any)
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // Clean up storage file (best effort)
        if (pdfImport?.file_url) {
            const fileName = (pdfImport.file_url as string).split('/').pop();
            if (fileName) {
                await supabase.storage
                    .from('pdf-imports')
                    .remove([fileName]);
            }
        }

        console.log(`🗑️  PDF import deleted: ${id}`);

        return NextResponse.json({
            success: true,
            message: 'PDF import deleted successfully'
        });

    } catch (error) {
        console.error('Failed to delete PDF import:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
