import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getSupabasePublicRuntimeConfig } from './env';

export async function updateSession(request: NextRequest): Promise<{
    response: NextResponse;
    user: User | null;
    supabase: SupabaseClient;
}> {
    let supabaseResponse = NextResponse.next({
        request,
    });
    const { supabaseUrl, supabaseAnonKey } = getSupabasePublicRuntimeConfig('middleware client');

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const { data: { user } } = await supabase.auth.getUser();

    return { response: supabaseResponse, user, supabase };
}
