import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Upload PDF for template extraction
 *
 * Accepts PDF file upload, saves to Supabase Storage,
 * creates pdf_imports record, and queues for AI extraction
 *
 * @example
 * POST /api/admin/pdf-imports/upload
 * Content-Type: multipart/form-data
 * Body: { file: PDF file, organizationId: "uuid" }
 */
export async function POST(req: NextRequest) {
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

        // Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const organizationId = formData.get('organizationId') as string;

        if (!file) {
            return NextResponse.json({
                success: false,
                error: 'No file provided'
            }, { status: 400 });
        }

        if (!organizationId) {
            return NextResponse.json({
                success: false,
                error: 'Organization ID required'
            }, { status: 400 });
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json({
                success: false,
                error: 'Only PDF files are supported'
            }, { status: 400 });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({
                success: false,
                error: 'File size exceeds 10MB limit'
            }, { status: 400 });
        }

        console.log(`📤 Uploading PDF: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        // Calculate file hash for deduplication
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

        // Check for duplicate
        const { data: existingImport } = await supabase
            .from('pdf_imports' as any)
            .select('id, file_name, status')
            .eq('organization_id', organizationId)
            .eq('file_hash', fileHash)
            .single();

        if (existingImport) {
            return NextResponse.json({
                success: false,
                error: `Duplicate file detected. Already imported as "${existingImport.file_name}" (${existingImport.status})`,
                existing_import_id: existingImport.id
            }, { status: 409 });
        }

        // Upload to Supabase Storage
        const fileName = `${organizationId}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pdf-imports')
            .upload(fileName, buffer, {
                contentType: 'application/pdf',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return NextResponse.json({
                success: false,
                error: 'Failed to upload file to storage'
            }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('pdf-imports')
            .getPublicUrl(fileName);

        console.log(`✅ File uploaded to storage: ${publicUrl}`);

        // Create PDF import record
        const { data: pdfImport, error: insertError } = await supabase
            .from('pdf_imports' as any)
            .insert({
                organization_id: organizationId,
                file_name: file.name,
                file_url: publicUrl,
                file_size_bytes: file.size,
                file_hash: fileHash,
                status: 'uploaded',
                created_by: user.id
            })
            .select()
            .single();

        if (insertError) {
            console.error('Database insert error:', insertError);

            // Clean up uploaded file
            await supabase.storage
                .from('pdf-imports')
                .remove([fileName]);

            return NextResponse.json({
                success: false,
                error: 'Failed to create import record'
            }, { status: 500 });
        }

        console.log(`✅ PDF import created: ${pdfImport.id}`);
        console.log(`🔄 Extraction queued automatically via database trigger`);

        return NextResponse.json({
            success: true,
            pdf_import: {
                id: pdfImport.id,
                file_name: pdfImport.file_name,
                status: pdfImport.status,
                created_at: pdfImport.created_at
            },
            message: 'PDF uploaded successfully. AI extraction will begin shortly.'
        });

    } catch (error) {
        console.error('PDF upload error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
