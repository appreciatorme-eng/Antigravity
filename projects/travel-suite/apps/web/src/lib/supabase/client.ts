import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../database.types';
import { getSupabasePublicRuntimeConfig } from './env';

export function createClient() {
    const { supabaseUrl, supabaseAnonKey } = getSupabasePublicRuntimeConfig('browser client');

    return createBrowserClient<Database>(
        supabaseUrl,
        supabaseAnonKey
    );
}
