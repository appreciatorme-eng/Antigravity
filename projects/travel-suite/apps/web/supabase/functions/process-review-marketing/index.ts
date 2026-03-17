/* ------------------------------------------------------------------
 * Supabase Edge Function: process-review-marketing
 * Triggered by database trigger on reputation_reviews table.
 * Calls POST /api/reputation/process-auto-reviews to generate
 * marketing assets for eligible 5-star reviews.
 * Requires env vars: NEXT_PUBLIC_APP_URL, CRON_SECRET
 * ------------------------------------------------------------------ */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (!appUrl || !cronSecret) {
    console.error("[process-review-marketing] Missing NEXT_PUBLIC_APP_URL or CRON_SECRET");
    return new Response(
      JSON.stringify({ ok: false, error: "Missing required environment variables" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let payload: { reviewId?: string; organizationId?: string };
  try {
    payload = await req.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON payload";
    console.error("[process-review-marketing] Failed to parse payload:", message);
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid request payload" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { reviewId, organizationId } = payload;

  if (!reviewId) {
    console.error("[process-review-marketing] Missing reviewId in payload");
    return new Response(
      JSON.stringify({ ok: false, error: "reviewId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const targetUrl = `${appUrl}/api/reputation/process-auto-reviews`;

  let result: unknown;
  let status: number;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "x-cron-secret": cronSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reviewId,
        organizationId,
      }),
    });

    status = response.status;
    result = await response.json().catch(() => ({ raw: response.statusText }));

    if (!response.ok) {
      console.error("[process-review-marketing] Upstream error:", status, result);
      return new Response(
        JSON.stringify({ ok: false, status, upstream: result }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    console.error("[process-review-marketing] Fetch failed:", message);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log("[process-review-marketing] Asset generated successfully:", result);
  return new Response(
    JSON.stringify({ ok: true, status, result }),
    { headers: { "Content-Type": "application/json" } },
  );
});
