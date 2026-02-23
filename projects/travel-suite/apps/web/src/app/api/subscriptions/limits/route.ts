import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllFeatureLimitStatuses } from "@/lib/subscriptions/limits";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const canUseAdminClient = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const dataClient = canUseAdminClient ? createAdminClient() : supabase;

    const limits = await getAllFeatureLimitStatuses(dataClient, profile.organization_id);
    return NextResponse.json({ limits });
  } catch (error) {
    console.error("Error in GET /api/subscriptions/limits:", error);
    return NextResponse.json(
      { error: "Failed to load subscription limits" },
      { status: 500 }
    );
  }
}
