import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * List PDF imports for organization
 *
 * @example
 * GET /api/admin/pdf-imports?organizationId=uuid&status=extracted
 */
export async function GET(req: NextRequest) {
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

        // Get query parameters
        const searchParams = req.nextUrl.searchParams;
        const organizationId = searchParams.get('organizationId');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query
        let query = supabase
            .from('pdf_imports' as any)
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Filter by organization
        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        // Filter by status
        if (status) {
            query = query.eq('status', status);
        }

        const { data: imports, error: fetchError, count } = await query;

        if (fetchError) {
            throw fetchError;
        }

        return NextResponse.json({
            success: true,
            imports: imports || [],
            total: count || 0,
            limit,
            offset
        });

    } catch (error) {
        console.error('Failed to list PDF imports:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
