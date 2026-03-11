/* ------------------------------------------------------------------
 * Supabase Edge Function: monthly-scorecard
 * Calls POST /api/cron/operator-scorecards on the Next.js app.
 * Schedule via Supabase dashboard: 0 0 1 * * (1st of each month UTC)
 * Requires env vars: NEXT_PUBLIC_APP_URL, CRON_SECRET
 * ------------------------------------------------------------------ */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (!appUrl || !cronSecret) {
    console.error("[monthly-scorecard] Missing NEXT_PUBLIC_APP_URL or CRON_SECRET");
    return new Response(
      JSON.stringify({ ok: false, error: "Missing required environment variables" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const targetUrl = `${appUrl}/api/cron/operator-scorecards`;

  let result: unknown;
  let status: number;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    status = response.status;
    result = await response.json().catch(() => ({ raw: response.statusText }));

    if (!response.ok) {
      console.error("[monthly-scorecard] Upstream error:", status, result);
      return new Response(
        JSON.stringify({ ok: false, status, upstream: result }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    console.error("[monthly-scorecard] Fetch failed:", message);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log("[monthly-scorecard] Scorecards delivered successfully:", result);
  return new Response(
    JSON.stringify({ ok: true, status, result }),
    { headers: { "Content-Type": "application/json" } },
  );
});
