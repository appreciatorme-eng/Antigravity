// GET /api/superadmin/orgs/org-detail?orgId=<uuid>
// Returns a rich organization dossier for the God Mode directory.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";

function safeNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function asCurrency(amount: number): string {
    const rounded = Math.round(amount);
    return `₹${rounded.toLocaleString("en-IN")}`;
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = auth.adminClient as any;
    const orgId = request.nextUrl.searchParams.get("orgId")?.trim();

    if (!orgId) {
        return apiError("orgId query parameter is required", 400);
    }

    try {
        // Step 1: Fetch organization core data
        const { data: org, error: orgError } = await db
            .from("organizations")
            .select("id, name, slug, logo_url, primary_color, subscription_tier, owner_id, created_at, updated_at")
            .eq("id", orgId)
            .single();

        if (orgError || !org) {
            return apiError("Organization not found", 404);
        }

        // Step 2: Fetch all data in parallel
        const monthStart = new Date(Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth(),
            1,
        ));
        // Use last 30d for range-scoped counts (matches KPI cards on overview/feature-usage)
        const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

        const [
            membersResult,
            tripsResult,
            tripsLast30dResult,
            proposalsResult,
            proposalsLast30dResult,
            invoicesResult,
            aiUsageResult,
            settingsResult,
        ] = await Promise.all([
            // Members
            db
                .from("profiles")
                .select("id, full_name, email, phone, role, avatar_url, created_at")
                .eq("organization_id", orgId)
                .order("created_at", { ascending: true }),
            // Trips — all time
            db
                .from("trips")
                .select("id, status, created_at", { count: "exact" })
                .eq("organization_id", orgId),
            // Trips — last 30d (matches KPI card range)
            db
                .from("trips")
                .select("id", { count: "exact", head: true })
                .eq("organization_id", orgId)
                .gte("created_at", since30d),
            // Proposals — all time
            db
                .from("proposals")
                .select("id, status, total_price, client_selected_price, created_at")
                .eq("organization_id", orgId),
            // Proposals — last 30d (matches KPI card range)
            db
                .from("proposals")
                .select("id", { count: "exact", head: true })
                .eq("organization_id", orgId)
                .gte("created_at", since30d),
            // Invoices
            db
                .from("invoices")
                .select("id, status, total_amount, balance_amount, due_date, created_at")
                .eq("organization_id", orgId),
            // AI usage MTD
            db
                .from("organization_ai_usage")
                .select("estimated_cost_usd, ai_requests")
                .eq("organization_id", orgId)
                .eq("month_start", monthStart.toISOString().slice(0, 10)),
            // Org settings
            db
                .from("organization_settings")
                .select("*")
                .eq("organization_id", orgId)
                .limit(1),
        ]);

        // Process members and try to get last sign-in info via auth admin
        const members = (membersResult.data ?? []) as Array<{
            id: string;
            full_name: string | null;
            email: string | null;
            phone: string | null;
            role: string | null;
            avatar_url: string | null;
            created_at: string | null;
        }>;

        // Support tickets: fetch by member IDs (two-step — Supabase doesn't support nested subqueries)
        const memberIds = members.map((m) => m.id);
        let supportTicketsOpen = 0;
        let supportTicketsResolved = 0;
        if (memberIds.length > 0) {
            const [openResult, resolvedResult] = await Promise.all([
                db
                    .from("support_tickets")
                    .select("id", { count: "exact", head: true })
                    .in("status", ["open", "in_progress"])
                    .in("user_id", memberIds),
                db
                    .from("support_tickets")
                    .select("id", { count: "exact", head: true })
                    .eq("status", "resolved")
                    .in("user_id", memberIds),
            ]);
            supportTicketsOpen = openResult.count ?? 0;
            supportTicketsResolved = resolvedResult.count ?? 0;
        }

        // Try to get last sign-in times from auth.users
        let lastSignInMap = new Map<string, string | null>();
        try {
            // Use the admin client's auth API to get user sign-in data
            // We'll do it for each member — the admin client can list users
            const memberIds = members.map((m) => m.id);
            if (memberIds.length > 0 && memberIds.length <= 50) {
                // Fetch auth users in batch
                for (const memberId of memberIds) {
                    try {
                        const { data: authUser } = await db.auth.admin.getUserById(memberId);
                        if (authUser?.user?.last_sign_in_at) {
                            lastSignInMap.set(memberId, authUser.user.last_sign_in_at);
                        }
                    } catch {
                        // Skip — auth user not found or error
                    }
                }
            }
        } catch {
            // Auth admin API not available, continue without last sign-in data
        }

        const memberList = members.map((m) => ({
            id: m.id,
            full_name: m.full_name,
            email: m.email,
            phone: m.phone,
            role: m.role,
            avatar_url: m.avatar_url,
            created_at: m.created_at,
            last_sign_in_at: lastSignInMap.get(m.id) ?? null,
        }));

        // Find most recent login across all members
        let lastOrgActivity: string | null = null;
        for (const [, signIn] of lastSignInMap) {
            if (signIn && (!lastOrgActivity || new Date(signIn).getTime() > new Date(lastOrgActivity).getTime())) {
                lastOrgActivity = signIn;
            }
        }

        // Process trips
        const trips = (tripsResult.data ?? []) as Array<{ id: string; status: string | null; created_at: string | null }>;
        const tripsByStatus: Record<string, number> = {};
        for (const t of trips) {
            const status = t.status ?? "unknown";
            tripsByStatus[status] = (tripsByStatus[status] ?? 0) + 1;
        }

        // Process proposals
        const proposals = (proposalsResult.data ?? []) as Array<{
            id: string; status: string | null;
            total_price: number | null; client_selected_price: number | null;
            created_at: string | null;
        }>;
        const proposalsLast30d = proposalsLast30dResult.count ?? 0;
        const totalProposalValue = proposals.reduce(
            (sum, p) => sum + safeNumber(p.client_selected_price ?? p.total_price), 0,
        );
        const wonStatuses = new Set(["approved", "partially_paid", "fully_paid"]);
        const wonProposals = proposals.filter((p) => wonStatuses.has(p.status ?? ""));
        const wonValue = wonProposals.reduce(
            (sum, p) => sum + safeNumber(p.client_selected_price ?? p.total_price), 0,
        );

        // Process invoices
        const invoices = (invoicesResult.data ?? []) as Array<{
            id: string; status: string | null;
            total_amount: number | null; balance_amount: number | null;
            due_date: string | null; created_at: string | null;
        }>;
        const totalBilled = invoices.reduce((sum, i) => sum + safeNumber(i.total_amount), 0);
        const totalOutstanding = invoices.reduce((sum, i) => sum + safeNumber(i.balance_amount), 0);
        const overdueInvoices = invoices.filter((i) => {
            if (!i.due_date || safeNumber(i.balance_amount) <= 0) return false;
            return new Date(i.due_date).getTime() < Date.now();
        });
        const overdueAmount = overdueInvoices.reduce(
            (sum, i) => sum + safeNumber(i.balance_amount ?? i.total_amount), 0,
        );
        const paidInvoices = invoices.filter((i) => i.status === "paid");
        const totalCollected = paidInvoices.reduce((sum, i) => sum + safeNumber(i.total_amount), 0);

        // Process AI usage
        const aiUsageRows = (aiUsageResult.data ?? []) as Array<{
            estimated_cost_usd: number | null;
            ai_requests: number | null;
        }>;
        const aiSpendMtd = aiUsageRows.reduce((sum, r) => sum + safeNumber(r.estimated_cost_usd), 0);
        const aiRequestsMtd = aiUsageRows.reduce((sum, r) => sum + safeNumber(r.ai_requests), 0);

        // Owner info
        const owner = members.find((m) => m.id === org.owner_id) ?? null;

        // Features used (detect which parts of the platform the org uses)
        const featuresUsed: string[] = [];
        if (trips.length > 0) featuresUsed.push("Trips");
        if (proposals.length > 0) featuresUsed.push("Proposals");
        if (invoices.length > 0) featuresUsed.push("Invoicing");
        if (aiRequestsMtd > 0) featuresUsed.push("AI Assistant");
        if (supportTicketsOpen + supportTicketsResolved > 0) {
            featuresUsed.push("Support");
        }

        return NextResponse.json({
            organization: {
                id: org.id,
                name: org.name,
                slug: org.slug,
                logo_url: org.logo_url,
                primary_color: org.primary_color,
                tier: org.subscription_tier ?? "free",
                created_at: org.created_at,
                updated_at: org.updated_at,
                owner: owner ? {
                    id: owner.id,
                    full_name: owner.full_name,
                    email: owner.email,
                } : null,
            },
            last_org_activity: lastOrgActivity,
            members: memberList,
            member_count: members.length,
            stats: {
                trips_total: trips.length,
                trips_last_30d: tripsLast30d,
                trips_by_status: tripsByStatus,
                proposals_total: proposals.length,
                proposals_last_30d: proposalsLast30d,
                proposals_won: wonProposals.length,
                proposal_total_value: totalProposalValue,
                proposal_total_value_label: asCurrency(totalProposalValue),
                proposal_won_value: wonValue,
                proposal_won_value_label: asCurrency(wonValue),
                invoices_total: invoices.length,
                invoices_overdue: overdueInvoices.length,
                total_billed: totalBilled,
                total_billed_label: asCurrency(totalBilled),
                total_outstanding: totalOutstanding,
                total_outstanding_label: asCurrency(totalOutstanding),
                overdue_amount: overdueAmount,
                overdue_amount_label: asCurrency(overdueAmount),
                total_collected: totalCollected,
                total_collected_label: asCurrency(totalCollected),
                support_tickets_open: supportTicketsOpen,
                support_tickets_resolved: supportTicketsResolved,
                ai_spend_mtd_usd: Number(aiSpendMtd.toFixed(2)),
                ai_requests_mtd: aiRequestsMtd,
            },
            features_used: featuresUsed,
            settings: settingsResult.data?.[0] ?? null,
        });
    } catch (error) {
        logError("[superadmin/orgs/org-detail]", error);
        return apiError("Failed to load organization details", 500);
    }
}
