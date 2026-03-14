import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageStats } from "@/lib/assistant/usage-meter";
import { logError } from "@/lib/observability/logger";
import type { ActionContext } from "@/lib/assistant/types";

export async function GET() {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return apiError("Unauthorized", 401);
    }

    // 2. Get organization ID from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // 3. Build ActionContext with admin client
    const ctx: ActionContext = {
      organizationId: profile.organization_id,
      userId: user.id,
      channel: "web",
      supabase: createAdminClient(),
    };

    // 4. Fetch usage stats
    const usage = await getUsageStats(ctx);

    return NextResponse.json({ success: true, usage });
  } catch (error) {
    logError("Assistant usage endpoint error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
