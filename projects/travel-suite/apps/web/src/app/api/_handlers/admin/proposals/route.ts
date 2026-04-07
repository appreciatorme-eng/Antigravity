import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeText } from "@/lib/security/sanitize";

const PROPOSAL_LIST_SELECT = [
  "approved_at",
  "approved_by",
  "client_id",
  "client_selected_price",
  "created_at",
  "expires_at",
  "id",
  "organization_id",
  "share_token",
  "status",
  "trip_id",
  "template_id",
  "title",
  "total_price",
  "trips:trip_id(id, status, start_date, end_date)",
  "updated_at",
  "version",
  "viewed_at",
  "clients(full_name, email)",
  "tour_templates(name)",
].join(", ");

type ProposalListRow = {
  approved_at: string | null;
  approved_by: string | null;
  client_id: string;
  client_selected_price: number | null;
  clients: { full_name?: string; email?: string } | null;
  created_at: string | null;
  expires_at: string | null;
  id: string;
  organization_id: string;
  share_token: string;
  status: string | null;
  trip_id: string | null;
  template_id: string | null;
  title: string;
  total_price: number | null;
  trips: { id: string; status: string | null; start_date: string | null; end_date: string | null } | null;
  tour_templates: { name?: string } | null;
  updated_at: string | null;
  version: number | null;
  viewed_at: string | null;
};

function sanitizeStatus(input: string | null): string {
  const safe = sanitizeText(input, { maxLength: 40 })?.toLowerCase() || "all";
  return safe || "all";
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
    }

    if (!admin.organizationId && !admin.isSuperAdmin) {
      return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = sanitizeStatus(searchParams.get("status"));
    const requestedOrganizationId = sanitizeText(searchParams.get("organization_id"), { maxLength: 80 });

    const effectiveOrganizationId = admin.isSuperAdmin
      ? (requestedOrganizationId || null)
      : admin.organizationId;

    if (!effectiveOrganizationId) {
      return NextResponse.json(
        { error: "organization_id query param is required for super admin" },
        { status: 400 },
      );
    }

    let query = admin.adminClient
      .from("proposals")
      .select(PROPOSAL_LIST_SELECT)
      .eq("organization_id", effectiveOrganizationId)
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message || "Failed to load proposals" }, { status: 500 });
    }

    const proposalRows = (data as unknown as ProposalListRow[] | null) ?? [];

    const proposalsWithCounts = await Promise.all(
      proposalRows.map(async (proposal) => {
        const { count } = await admin.adminClient
          .from("proposal_comments")
          .select("id", { count: "exact", head: true })
          .eq("proposal_id", proposal.id);

        return {
          ...proposal,
          client_name: proposal.clients?.full_name || "Unknown Client",
          client_email: proposal.clients?.email || null,
          template_name: proposal.tour_templates?.name || null,
          comments_count: count || 0,
        };
      }),
    );

    return NextResponse.json({ proposals: proposalsWithCounts });
  } catch {
    return NextResponse.json({ error: "Failed to load proposals" }, { status: 500 });
  }
}
