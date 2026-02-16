import { createBrowserClient } from '@supabase/ssr';

// Temporarily use any for Database to support all tables during deployment
// import { Database } from '../database.types';

export function createClient() {
    return createBrowserClient<any>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
