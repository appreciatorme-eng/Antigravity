import { createClient } from "@/lib/supabase/client";

/**
 * Thin wrapper around fetch that always attaches the Supabase Bearer token.
 *
 * Every client-side mutation MUST use this (or manually attach the token) so
 * the dispatcher-level CSRF guard (`passesMutationCsrfGuard`) passes — it
 * treats the custom `Authorization` header as proof the request is not a
 * cross-origin form submission.
 *
 * IMPORTANT: This will retry session hydration once before giving up. If no
 * session exists after retry, mutations (POST/PUT/PATCH/DELETE) will throw
 * immediately rather than sending an unauthenticated request that would fail
 * with a 403 CSRF error on the server.
 */
export async function authedFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const supabase = createClient();
  let {
    data: { session },
  } = await supabase.auth.getSession();

  // Retry once — session may not be hydrated yet on first call after page load
  if (!session?.access_token) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    session = refreshed.session;
  }

  const headers = new Headers(init?.headers);

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  } else {
    // For mutations, fail fast with a clear error instead of sending a bare
    // request that will be rejected by CSRF guards with a confusing 403.
    const method = (init?.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      throw new Error(
        "No active session — please log in again. (authedFetch requires a valid session for mutations)"
      );
    }
  }

  return fetch(url, { ...init, headers });
}
