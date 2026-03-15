import { NextResponse } from 'next/server';
import { apiError } from "@/lib/api/response";
import { requireAdmin } from '@/lib/auth/admin';
import { safeErrorMessage } from '@/lib/security/safe-error';

// Validates standard UPI handle: localpart@provider (e.g. name@upi, name@okaxis)
const UPI_REGEX = /^[\w.\-+]+@[\w.\-]+$/;

// POST /api/settings/upi — save or update UPI ID for the org
export async function POST(req: Request) {
    try {
        const auth = await requireAdmin(req, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, adminClient } = auth;

        const body = (await req.json()) as { upiId?: string };
        const upiId = body.upiId?.trim() ?? '';

        if (!upiId) {
            return apiError('upiId is required', 400);
        }

        if (!UPI_REGEX.test(upiId)) {
            return apiError('Invalid UPI ID format. Expected format: name@upi or name@bank', 400);
        }

        const { error: upsertError } = await adminClient.from('organization_settings').upsert(
            {
                organization_id: organizationId!,
                upi_id: upiId,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' }
        );

        if (upsertError) {
            console.error('UPI upsert error:', upsertError);
            return apiError('Failed to save UPI ID', 500);
        }

        return NextResponse.json({ success: true, upiId });
    } catch (error: unknown) {
        console.error('UPI save error:', error);
        return apiError(safeErrorMessage(error, 'Failed to save UPI ID'), 500);
    }
}

// GET /api/settings/upi — load saved UPI ID for the org
export async function GET(req: Request) {
    try {
        const auth = await requireAdmin(req, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, adminClient } = auth;

        const { data: settings } = await adminClient
            .from('organization_settings')
            .select('upi_id')
            .eq('organization_id', organizationId!)
            .single();

        return NextResponse.json({ upiId: settings?.upi_id ?? null });
    } catch (error: unknown) {
        console.error('UPI load error:', error);
        return NextResponse.json({ upiId: null });
    }
}
