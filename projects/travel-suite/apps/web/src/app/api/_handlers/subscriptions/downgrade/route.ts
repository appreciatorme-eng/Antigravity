import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { target_plan_id: string };

    if (!body.target_plan_id) {
      return NextResponse.json({ error: "target_plan_id is required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, plan_id, current_period_end, status")
      .eq("organization_id", profile.organization_id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription to downgrade" }, { status: 404 });
    }

    // Schedule downgrade at period end
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        metadata: {
          downgrade_to: body.target_plan_id,
          downgrade_scheduled_at: new Date().toISOString(),
        },
      })
      .eq("id", subscription.id);

    if (updateError) throw updateError;

    await supabase.from("payment_events").insert({
      organization_id: profile.organization_id,
      event_type: "subscription.downgrade_scheduled",
      payload: {
        subscription_id: subscription.id,
        from_plan: subscription.plan_id,
        to_plan: body.target_plan_id,
        effective_date: subscription.current_period_end,
      },
    });

    return NextResponse.json({
      success: true,
      downgrade_to: body.target_plan_id,
      effective_date: subscription.current_period_end,
    });
  } catch (error) {
    logError("Error scheduling downgrade", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to schedule downgrade" },
      { status: 500 }
    );
  }
}
