import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveDemoOrg } from "@/lib/auth/demo-org-resolver";
import { sessionNameFromOrgId } from "@/lib/whatsapp-waha.server";

type ProposalCountRow = {
  status: string | null;
};

const CLOSED_PROPOSAL_STATUSES = new Set([
  "approved",
  "accepted",
  "confirmed",
  "converted",
  "rejected",
  "expired",
  "cancelled",
]);

const getCachedNavCounts = unstable_cache(
  async (organizationId: string, sessionName: string, today: string) => {
    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reputation_reviews is present in the live schema but not in generated admin typings yet
    const reputationAdmin = admin as any;

    const [inboxUnreadResult, proposalsResult, bookingsTodayResult, reviewsResult] = await Promise.all([
      admin
        .from("whatsapp_webhook_events")
        .select("id", { count: "exact", head: true })
        .filter("metadata->>session", "eq", sessionName)
        .eq("event_type", "text")
        .filter("metadata->>direction", "eq", "in"),
      admin
        .from("proposals")
        .select("status")
        .eq("organization_id", organizationId),
      admin
        .from("trips")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("start_date", today)
        .in("status", ["planned", "confirmed", "in_progress", "active"]),
      reputationAdmin
        .from("reputation_reviews")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("response_status", ["pending", "draft"]),
    ]);

    if (inboxUnreadResult.error) throw inboxUnreadResult.error;
    if (proposalsResult.error) throw proposalsResult.error;
    if (bookingsTodayResult.error) throw bookingsTodayResult.error;
    if (reviewsResult.error) throw reviewsResult.error;

    const proposalRows = (proposalsResult.data || []) as ProposalCountRow[];
    const proposalsPending = proposalRows.filter((row) => {
      const status = (row.status || "draft").toLowerCase();
      return !CLOSED_PROPOSAL_STATUSES.has(status);
    }).length;

    return {
      inboxUnread: inboxUnreadResult.count ?? 0,
      proposalsPending,
      bookingsToday: bookingsTodayResult.count ?? 0,
      reviewsNeedingResponse: reviewsResult.count ?? 0,
    };
  },
  ["nav-counts"],
  { revalidate: 60, tags: ["nav-counts"] },
);

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const { isDemoMode, demoOrgId } = resolveDemoOrg(request);
    const organizationId = isDemoMode ? demoOrgId : profile?.organization_id;

    if (!organizationId) {
      return NextResponse.json({
        inboxUnread: 0,
        proposalsPending: 0,
        bookingsToday: 0,
        reviewsNeedingResponse: 0,
      });
    }

    const sessionName = sessionNameFromOrgId(organizationId);
    const today = new Date().toISOString().slice(0, 10);

    const counts = await getCachedNavCounts(organizationId, sessionName, today);
    return NextResponse.json(counts);
  } catch (error) {
    console.error("[/api/nav/counts:GET] Unhandled error:", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
