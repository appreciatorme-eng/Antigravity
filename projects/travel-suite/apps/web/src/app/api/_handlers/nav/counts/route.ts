import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { unstable_cache } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveDemoOrg } from "@/lib/auth/demo-org-resolver";
import { logError, logWarn } from "@/lib/observability/logger";

function sessionNameFromOrgId(orgId: string): string {
  return `org_${orgId.replace(/-/g, "").slice(0, 8)}`;
}

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
      admin
        .from("reputation_reviews")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("response_status", ["pending", "draft"]),
    ]);

    // WhatsApp table may not exist — treat as non-fatal, return 0 unread
    const inboxUnread =
      !inboxUnreadResult.error ||
      inboxUnreadResult.error.code === "PGRST205" ||
      inboxUnreadResult.error.code === "42P01"
        ? (inboxUnreadResult.count ?? 0)
        : 0;
    if (
      inboxUnreadResult.error &&
      inboxUnreadResult.error.code !== "PGRST205" &&
      inboxUnreadResult.error.code !== "42P01"
    ) {
      logWarn("[nav/counts] inboxUnread error (non-fatal)", { details: String(inboxUnreadResult.error.message) });
    }
    if (proposalsResult.error) throw proposalsResult.error;
    if (bookingsTodayResult.error) throw bookingsTodayResult.error;
    if (reviewsResult.error) throw reviewsResult.error;

    const proposalRows = (proposalsResult.data || []) as ProposalCountRow[];
    const proposalsPending = proposalRows.filter((row) => {
      const status = (row.status || "draft").toLowerCase();
      return !CLOSED_PROPOSAL_STATUSES.has(status);
    }).length;

    return {
      inboxUnread,
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
    const { isDemoMode, demoOrgId } = resolveDemoOrg(request);

    let organizationId: string | null | undefined;
    if (isDemoMode) {
      organizationId = demoOrgId;
    } else {
      const auth = await requireAdmin(request, { requireOrganization: true });
      if (!auth.ok) return auth.response;
      organizationId = auth.organizationId;
    }

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
    return apiSuccess(counts);
  } catch (error) {
    logError("[/api/nav/counts:GET] Unhandled error", error);
    return NextResponse.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
