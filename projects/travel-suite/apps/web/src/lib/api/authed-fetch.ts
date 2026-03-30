import { createClient } from "@/lib/supabase/client";

/**
 * Thin wrapper around fetch that always attaches the Supabase Bearer token.
 *
 * Every client-side mutation MUST use this (or manually attach the token) so
 * the dispatcher-level CSRF guard (`passesMutationCsrfGuard`) passes — it
 * treats the custom `Authorization` header as proof the request is not a
 * cross-origin form submission.
 */
export async function authedFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  return fetch(url, { ...init, headers });
}
