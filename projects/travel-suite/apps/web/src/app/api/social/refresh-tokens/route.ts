import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        // Authenticate the request via secret or Vercel Cron header
        const authHeader = req.headers.get('authorization');
        const isCron = req.headers.get('x-vercel-cron') === '1';

        if (!isCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createAdminClient();

        // Find connections where token is expiring within 7 days
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { data: expiringConnections, error } = await supabaseAdmin
            .from('social_connections')
            .select('*')
            .lt('token_expires_at', sevenDaysFromNow.toISOString());

        if (error) throw error;

        if (!expiringConnections || expiringConnections.length === 0) {
            return NextResponse.json({ message: 'No tokens need refreshing' });
        }

        const results = [];

        for (const conn of expiringConnections) {
            try {
                let refreshed = false;

                if (conn.platform === 'facebook' || conn.platform === 'instagram') {
                    // Instagram uses FB Graph API tokens because they are linked via IG Business Accounts
                    const res = await fetch(
                        `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${conn.access_token_encrypted}`
                    );

                    if (res.ok) {
                        const data = await res.json();
                        const newExpiresAt = new Date();
                        newExpiresAt.setDate(newExpiresAt.getDate() + 60);

                        await supabaseAdmin
                            .from('social_connections')
                            .update({
                                access_token_encrypted: data.access_token || conn.access_token_encrypted,
                                token_expires_at: newExpiresAt.toISOString(),
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', conn.id);

                        refreshed = true;
                    } else {
                        throw new Error(`Meta API error: ${await res.text()}`);
                    }
                }

                results.push({ id: conn.id, status: refreshed ? 'success' : 'skipped', platform: conn.platform });
            } catch (err: any) {
                console.error(`Error refreshing token for connection ${conn.id}:`, err);
                results.push({ id: conn.id, status: 'failed', platform: conn.platform, error: err.message });
            }
        }

        return NextResponse.json({ success: true, processed: results.length, results });
    } catch (error: any) {
        console.error('Error refreshing social tokens:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
