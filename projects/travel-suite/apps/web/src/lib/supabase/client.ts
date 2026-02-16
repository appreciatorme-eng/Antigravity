import { createBrowserClient } from '@supabase/ssr';

// Using any type until migrations are applied to production database
// import { Database } from '../database.types';

export function createClient() {
    return createBrowserClient<any>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
