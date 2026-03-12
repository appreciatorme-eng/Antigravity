import { apiSuccess, apiError } from "@/lib/api-response";
import { createClient } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/security/safe-error';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return apiError('Unauthorized', 401);
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return apiError('No organization found', 400);
        }

        const { data: connections, error } = await supabase
            .from('social_connections')
            .select('id, platform, platform_page_id, token_expires_at, updated_at')
            .eq('organization_id', profile.organization_id);

        if (error) throw error;

        return apiSuccess(connections);
    } catch (error: unknown) {
        console.error('Error fetching social connections:', error);
        const message = safeErrorMessage(error, "Request failed");
        return apiError(message, 500);
    }
}
