import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../database.types';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-anon-key';

    return createBrowserClient<Database>(
        supabaseUrl,
        supabaseAnonKey
    );
}
