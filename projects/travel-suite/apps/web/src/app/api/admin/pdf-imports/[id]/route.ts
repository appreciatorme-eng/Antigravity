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
    { params }: { params: { id: string } }
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

        const { data: pdfImport, error: fetchError } = await supabase
            .from('pdf_imports')
            .select('*')
            .eq('id', params.id)
            .single();

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
    { params }: { params: { id: string } }
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
            .from('pdf_imports')
            .select('*')
            .eq('id', params.id)
            .single();

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
                    .from('pdf_imports')
                    .update({
                        status: 'approved',
                        reviewed_by: user.id,
                        reviewed_at: new Date().toISOString(),
                        review_notes: notes
                    })
                    .eq('id', params.id);

                if (approveError) throw approveError;

                console.log(`✅ PDF import approved: ${params.id}`);

                return NextResponse.json({
                    success: true,
                    message: 'PDF import approved. Ready to publish.',
                    pdf_import: { ...pdfImport, status: 'approved' }
                });

            case 'reject':
                // Reject extraction
                const { error: rejectError } = await supabase
                    .from('pdf_imports')
                    .update({
                        status: 'rejected',
                        reviewed_by: user.id,
                        reviewed_at: new Date().toISOString(),
                        review_notes: notes
                    })
                    .eq('id', params.id);

                if (rejectError) throw rejectError;

                console.log(`❌ PDF import rejected: ${params.id}`);

                return NextResponse.json({
                    success: true,
                    message: 'PDF import rejected.',
                    pdf_import: { ...pdfImport, status: 'rejected' }
                });

            case 're-extract':
                // Trigger re-extraction
                console.log(`🔄 Re-extracting PDF: ${params.id}`);

                const result = await processPDFImport(params.id);

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

                console.log(`📤 Publishing PDF import to templates: ${params.id}`);

                const template = await publishPDFImport(params.id, organizationId);

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
    { params }: { params: { id: string } }
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

        // Get PDF import for file cleanup
        const { data: pdfImport } = await supabase
            .from('pdf_imports')
            .select('file_url')
            .eq('id', params.id)
            .single();

        // Delete from database
        const { error: deleteError } = await supabase
            .from('pdf_imports')
            .delete()
            .eq('id', params.id);

        if (deleteError) throw deleteError;

        // Clean up storage file (best effort)
        if (pdfImport?.file_url) {
            const fileName = pdfImport.file_url.split('/').pop();
            if (fileName) {
                await supabase.storage
                    .from('pdf-imports')
                    .remove([fileName]);
            }
        }

        console.log(`🗑️  PDF import deleted: ${params.id}`);

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
