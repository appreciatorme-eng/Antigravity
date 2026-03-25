/* ------------------------------------------------------------------
 * GET /api/admin/whatsapp/contact-details?phone=919876543210
 * Returns live CRM data for a WhatsApp contact: profile, trips,
 * payments, proposals. Replaces mock data in the inbox context panel.
 * ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/observability/logger";

export async function GET(request: Request): Promise<Response> {
    const auth = await requireAdmin(request, { requireOrganization: true });
    if (!auth.ok) return auth.response;

    const { organizationId, adminClient } = auth;
    const orgId = organizationId!;

    const url = new URL(request.url);
    const rawPhone = url.searchParams.get("phone") ?? "";
    const phoneDigits = rawPhone.replace(/\D/g, "");

    if (!phoneDigits || phoneDigits.length < 7) {
        return NextResponse.json({ data: null });
    }

    try {
        // Look up profile by normalized phone
        const phoneCandidates = [phoneDigits, `+${phoneDigits}`];
        const { data: profile } = await adminClient
            .from("profiles")
            .select("id, full_name, email, phone, role, lifecycle_stage, client_tag, driver_info, avatar_url")
            .eq("organization_id", orgId)
            .in("phone_normalized", phoneCandidates)
            .maybeSingle();

        if (!profile) {
            return NextResponse.json({ data: null });
        }

        const isDriver = profile.role === "driver";
        const profileId = profile.id;

        // Fetch trips, invoices, proposals in parallel
        const [tripsResult, invoicesResult, proposalsResult] = await Promise.all([
            adminClient
                .from("trips")
                .select("id, name, destination, status, start_date, end_date, pax_count")
                .eq(isDriver ? "driver_id" : "client_id", profileId)
                .eq("organization_id", orgId)
                .order("created_at", { ascending: false })
                .limit(5),
            adminClient
                .from("invoices")
                .select("id, total_amount, paid_amount, balance_amount, status")
                .eq("client_id", profileId)
                .eq("organization_id", orgId)
                .order("created_at", { ascending: false })
                .limit(10),
            adminClient
                .from("proposals")
                .select("id, title, status, viewed_at, total_price, created_at")
                .eq("client_id", profileId)
                .eq("organization_id", orgId)
                .order("created_at", { ascending: false })
                .limit(3),
        ]);

        const trips = tripsResult.data ?? [];
        const invoices = invoicesResult.data ?? [];
        const proposals = proposalsResult.data ?? [];

        // Compute LTV from invoices
        const totalLtv = invoices.reduce((sum, inv) => sum + (inv.total_amount ?? 0), 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid_amount ?? 0), 0);
        const totalBalance = invoices.reduce((sum, inv) => sum + (inv.balance_amount ?? 0), 0);

        // Format LTV for display
        const formatInr = (amount: number) => {
            if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
            if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
            return `₹${amount.toLocaleString("en-IN")}`;
        };

        // Active trip (not completed, nearest start_date)
        const activeTrip = trips.find((t) =>
            t.status && !["completed", "cancelled"].includes(t.status)
        );

        // Driver info from JSON field
        const driverInfo = isDriver && profile.driver_info
            ? profile.driver_info as Record<string, unknown>
            : null;

        // Build response
        const clientDetails = !isDriver ? {
            email: profile.email ?? null,
            ltv: formatInr(totalLtv),
            ltvRaw: totalLtv,
            trips: trips.length,
            stage: profile.lifecycle_stage ?? profile.client_tag ?? "lead",
            tag: profile.client_tag ?? null,
            recentTrips: trips.slice(0, 3).map((t) => ({
                id: t.id,
                name: t.name ?? t.destination ?? "Unnamed Trip",
                destination: t.destination,
                status: t.status,
                startDate: t.start_date,
                endDate: t.end_date,
            })),
            payment: {
                total: formatInr(totalLtv),
                paid: formatInr(totalPaid),
                balance: formatInr(totalBalance),
                balanceRaw: totalBalance,
                status: totalBalance <= 0 ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
            },
            proposals: proposals.map((p) => ({
                id: p.id,
                title: p.title,
                status: p.status,
                viewedAt: p.viewed_at,
                totalPrice: p.total_price,
            })),
        } : null;

        const driverDetails = isDriver ? {
            vehicle: (driverInfo?.vehicle as string) ?? "Not specified",
            vehicleNumber: (driverInfo?.vehicle_number as string) ?? (driverInfo?.vehicleNumber as string) ?? "—",
            rating: (driverInfo?.rating as number) ?? null,
            currentTrip: activeTrip
                ? `${activeTrip.name ?? activeTrip.destination ?? "Active Trip"}`
                : null,
            totalTrips: trips.length,
        } : null;

        return NextResponse.json({
            data: {
                profileId,
                name: profile.full_name,
                email: profile.email,
                role: profile.role,
                avatarUrl: profile.avatar_url,
                client: clientDetails,
                driver: driverDetails,
                activeTrip: activeTrip ? {
                    id: activeTrip.id,
                    name: activeTrip.name ?? activeTrip.destination,
                    destination: activeTrip.destination,
                    status: activeTrip.status,
                    startDate: activeTrip.start_date,
                    endDate: activeTrip.end_date,
                    paxCount: activeTrip.pax_count,
                } : null,
            },
        });
    } catch (error) {
        logError("[whatsapp/contact-details] Error fetching contact details", error);
        return NextResponse.json({ data: null, error: "Failed to fetch contact details" }, { status: 500 });
    }
}
