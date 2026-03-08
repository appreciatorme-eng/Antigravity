import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.serve(async () => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: overdueLinks, error } = await supabase
      .from("payment_links")
      .select(`
        id,
        token,
        amount_paise,
        proposal_id,
        client_phone,
        client_name
      `)
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .is("reminder_sent_at", null)
      .not("proposal_id", "is", null)
      .limit(50);

    if (error) {
      throw error;
    }

    const wppBase = Deno.env.get("WPPCONNECT_BASE_URL");
    const wppToken = Deno.env.get("WPPCONNECT_TOKEN");
    const wppSession = Deno.env.get("WPPCONNECT_SESSION") ?? "default";
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://your-app.vercel.app";

    if (!wppBase || !wppToken) {
      return new Response(JSON.stringify({ sent: 0, error: "WPPConnect env not configured" }), {
        headers: { "Content-Type": "application/json" },
        status: 503,
      });
    }

    let sent = 0;

    for (const link of overdueLinks ?? []) {
      const phone = String(link.client_phone || "").replace(/\D/g, "");
      if (!phone) continue;

      const travelerName = link.client_name || "there";
      const message =
        `Hi ${travelerName}! 👋\n\n` +
        `Your trip booking payment of ₹${(link.amount_paise / 100).toLocaleString("en-IN")} ` +
        `is still pending.\n\nComplete your booking here:\n${appUrl}/pay/${link.token}\n\n` +
        `This link expires in 48 hours.`;

      await fetch(`${wppBase}/api/${wppSession}/send-message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${wppToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: `${phone}@c.us`,
          message,
        }),
      });

      await supabase
        .from("payment_links")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", link.id);

      sent += 1;
      await sleep(500);
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[payment-reminders] failed:", error);
    return new Response(
      JSON.stringify({
        sent: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

