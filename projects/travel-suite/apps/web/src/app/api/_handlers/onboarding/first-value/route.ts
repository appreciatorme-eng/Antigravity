import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

type Milestone = {
  id: "setup" | "itinerary" | "share";
  title: string;
  description: string;
  completed: boolean;
  target_minute: number;
};

function getAppOrigin(request: NextRequest): string {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envOrigin) {
    return envOrigin.replace(/\/$/, "");
  }
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    const serverClient = await createServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id,organization_id,onboarding_step")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let scopedUserIds: string[] = [user.id];
    if (profile.organization_id) {
      const { data: teamMembers } = await adminClient
        .from("profiles")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .limit(5000);

      const collected = (teamMembers || [])
        .map((member) => member.id)
        .filter((id): id is string => Boolean(id));
      if (collected.length > 0) {
        scopedUserIds = collected;
      }
    }

    const { data: itineraries, error: itinerariesError } = await adminClient
      .from("itineraries")
      .select("id,created_at")
      .in("user_id", scopedUserIds)
      .order("created_at", { ascending: true })
      .limit(5000);

    if (itinerariesError) {
      return NextResponse.json({ error: itinerariesError.message }, { status: 500 });
    }

    const itineraryIds = (itineraries || []).map((itinerary) => itinerary.id);

    let sharedCount = 0;
    let firstSharedAt: string | null = null;
    let latestShareUrl: string | null = null;

    if (itineraryIds.length > 0) {
      const { data: shares, error: sharesError } = await adminClient
        .from("shared_itineraries")
        .select("share_code,created_at")
        .in("itinerary_id", itineraryIds)
        .order("created_at", { ascending: true })
        .limit(5000);

      if (sharesError) {
        return NextResponse.json({ error: sharesError.message }, { status: 500 });
      }

      sharedCount = shares?.length || 0;
      firstSharedAt = shares && shares.length > 0 ? shares[0].created_at : null;

      if (shares && shares.length > 0) {
        const latestShare = shares[shares.length - 1];
        latestShareUrl = `${getAppOrigin(request)}/share/${latestShare.share_code}`;
      }
    }

    const setupComplete = Boolean(profile.organization_id) && Number(profile.onboarding_step || 0) >= 2;
    const itineraryCount = itineraries?.length || 0;
    const firstItineraryAt = itineraryCount > 0 ? itineraries?.[0]?.created_at || null : null;

    const milestones: Milestone[] = [
      {
        id: "setup",
        title: "Complete account setup",
        description: "Finish profile, operator brand details, and marketplace setup.",
        completed: setupComplete,
        target_minute: 3,
      },
      {
        id: "itinerary",
        title: "Create first itinerary",
        description: "Generate and save your first client itinerary from the planner.",
        completed: itineraryCount > 0,
        target_minute: 7,
      },
      {
        id: "share",
        title: "Share first itinerary",
        description: "Generate a client share link and send your first itinerary.",
        completed: sharedCount > 0,
        target_minute: 10,
      },
    ];

    const completedCount = milestones.filter((milestone) => milestone.completed).length;
    const completionPct = Math.round((completedCount / milestones.length) * 100);

    return NextResponse.json({
      completion_pct: completionPct,
      completed_milestones: completedCount,
      total_milestones: milestones.length,
      setup_complete: setupComplete,
      itinerary_count: itineraryCount,
      shared_itinerary_count: sharedCount,
      first_itinerary_created_at: firstItineraryAt,
      first_shared_at: firstSharedAt,
      latest_share_url: latestShareUrl,
      milestones,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
