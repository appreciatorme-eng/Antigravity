import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AdminClient = ReturnType<typeof createSupabaseClient<Database>>;

let cachedAdminClient: AdminClient | null = null;
let cachedUnavailableClient: AdminClient | null = null;

function createUnavailableClient(message: string): AdminClient {
    return new Proxy({} as AdminClient, {
        get() {
            throw new Error(message);
        },
    });
}

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        if (!cachedUnavailableClient) {
            cachedUnavailableClient = createUnavailableClient(
                "Supabase admin credentials are not configured"
            );
        }
        return cachedUnavailableClient;
    }

    if (!cachedAdminClient) {
        cachedAdminClient = createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    return cachedAdminClient;
}
