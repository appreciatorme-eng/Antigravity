import "server-only";

import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeErrorMessage } from "@/lib/security/safe-error";

const supabaseAdmin = createAdminClient();

interface TaskItem {
    id: string;
    priority: "high" | "medium" | "info";
    type: string;
    description: string;
    count?: number;
    timestamp: string;
    entityId: string;
    entityData: Record<string, unknown>;
}

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

function twoDaysFromNowIso(): string {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
    const msPerDay = 86_400_000;
    return Math.floor(
        (new Date(to).getTime() - new Date(from).getTime()) / msPerDay
    );
}

async function fetchDriverUnassignedTasks(orgId: string): Promise<TaskItem[]> {
    const today = todayIso();
    const cutoff = twoDaysFromNowIso();

    const { data: trips, error } = await supabaseAdmin
        .from("trips")
        .select(`
            id,
            start_date,
            status,
            client_id,
            itineraries:itinerary_id (
                destination,
                trip_title
            ),
            profiles:client_id (
                full_name
            ),
            trip_driver_assignments (
                id
            )
        `)
        .eq("organization_id", orgId)
        .in("status", ["planned", "confirmed"])
        .gte("start_date", today)
        .lte("start_date", cutoff);

    if (error || !trips) return [];

    const unassigned = (trips as unknown as Array<{
        id: string;
        start_date: string | null;
        status: string | null;
        client_id: string | null;
        itineraries: { destination: string; trip_title: string } | Array<{ destination: string; trip_title: string }> | null;
        profiles: { full_name: string | null } | Array<{ full_name: string | null }> | null;
        trip_driver_assignments: Array<{ id: string }> | null;
    }>).filter(
        (t) => !t.trip_driver_assignments || t.trip_driver_assignments.length === 0
    );

    return unassigned.map((trip) => {
        const itinerary = Array.isArray(trip.itineraries)
            ? trip.itineraries[0]
            : trip.itineraries;
        const profile = Array.isArray(trip.profiles)
            ? trip.profiles[0]
            : trip.profiles;

        return {
            id: `driver_unassigned:${trip.id}`,
            priority: "high" as const,
            type: "driver_unassigned",
            description: `Trip to ${itinerary?.destination ?? "TBD"} starting soon still needs driver assignment`,
            count: 1,
            timestamp: new Date().toISOString(),
            entityId: trip.id,
            entityData: {
                tripId: trip.id,
                destination: itinerary?.destination ?? null,
                startDate: trip.start_date,
                clientName: profile?.full_name ?? "Unknown client",
            },
        };
    });
}

async function fetchPaymentOverdueTasks(orgId: string): Promise<TaskItem[]> {
    const now = new Date().toISOString();

    const { data: invoices, error } = await supabaseAdmin
        .from("invoices")
        .select(`
            id,
            invoice_number,
            balance_amount,
            currency,
            due_date,
            status,
            client_id,
            profiles:client_id (
                full_name
            )
        `)
        .eq("organization_id", orgId)
        .or(`status.eq.overdue,and(status.eq.issued,due_date.lt.${now})`);

    if (error || !invoices) return [];

    return (invoices as unknown as Array<{
        id: string;
        invoice_number: string;
        balance_amount: number;
        currency: string;
        due_date: string | null;
        status: string;
        client_id: string | null;
        profiles: { full_name: string | null } | Array<{ full_name: string | null }> | null;
    }>).map((inv) => {
        const profile = Array.isArray(inv.profiles)
            ? inv.profiles[0]
            : inv.profiles;
        const clientName = profile?.full_name ?? "Unknown client";
        const symbol = inv.currency === "INR" ? "\u20B9" : inv.currency;

        return {
            id: `payment_overdue:${inv.id}`,
            priority: "high" as const,
            type: "payment_overdue",
            description: `${symbol}${inv.balance_amount} payment overdue from ${clientName}`,
            timestamp: new Date().toISOString(),
            entityId: inv.id,
            entityData: {
                invoiceId: inv.id,
                invoiceNumber: inv.invoice_number,
                clientName,
                balanceAmount: inv.balance_amount,
                currency: inv.currency,
                dueDate: inv.due_date,
            },
        };
    });
}

async function fetchQuoteAwaitingTasks(orgId: string): Promise<TaskItem[]> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: proposals, error } = await supabaseAdmin
        .from("proposals")
        .select(`
            id,
            title,
            created_at,
            client_id,
            clients:client_id (
                id,
                profiles:id (
                    full_name
                )
            )
        `)
        .eq("organization_id", orgId)
        .eq("status", "sent")
        .lt("created_at", cutoff);

    if (error || !proposals) return [];

    const today = todayIso();

    return (proposals as unknown as Array<{
        id: string;
        title: string;
        created_at: string | null;
        client_id: string;
        clients: {
            id: string;
            profiles: { full_name: string | null } | Array<{ full_name: string | null }> | null;
        } | Array<{
            id: string;
            profiles: { full_name: string | null } | Array<{ full_name: string | null }> | null;
        }> | null;
    }>).map((proposal) => {
        const client = Array.isArray(proposal.clients)
            ? proposal.clients[0]
            : proposal.clients;
        const profile = client?.profiles
            ? (Array.isArray(client.profiles) ? client.profiles[0] : client.profiles)
            : null;
        const clientName = profile?.full_name ?? "Unknown client";
        const daysAgo = proposal.created_at
            ? daysBetween(proposal.created_at.slice(0, 10), today)
            : 0;

        return {
            id: `quote_awaiting:${proposal.id}`,
            priority: "medium" as const,
            type: "quote_awaiting",
            description: `${clientName} quote sent ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago \u2014 no reply yet`,
            timestamp: new Date().toISOString(),
            entityId: proposal.id,
            entityData: {
                proposalId: proposal.id,
                clientName,
                sentAt: proposal.created_at,
                destination: proposal.title,
            },
        };
    });
}

async function fetchPickupTodayTasks(orgId: string): Promise<TaskItem[]> {
    const today = todayIso();

    const { data: trips, error } = await supabaseAdmin
        .from("trips")
        .select(`
            id,
            start_date,
            status,
            client_id,
            itineraries:itinerary_id (
                destination,
                trip_title
            ),
            profiles:client_id (
                full_name
            )
        `)
        .eq("organization_id", orgId)
        .eq("start_date", today)
        .in("status", ["confirmed", "active", "in_progress"]);

    if (error || !trips) return [];

    return (trips as unknown as Array<{
        id: string;
        start_date: string | null;
        status: string | null;
        client_id: string | null;
        itineraries: { destination: string; trip_title: string } | Array<{ destination: string; trip_title: string }> | null;
        profiles: { full_name: string | null } | Array<{ full_name: string | null }> | null;
    }>).map((trip) => {
        const itinerary = Array.isArray(trip.itineraries)
            ? trip.itineraries[0]
            : trip.itineraries;
        const profile = Array.isArray(trip.profiles)
            ? trip.profiles[0]
            : trip.profiles;
        const destination = itinerary?.destination ?? "TBD";
        const clientName = profile?.full_name ?? "Unknown client";

        return {
            id: `pickup_today:${trip.id}`,
            priority: "info" as const,
            type: "pickup_today",
            description: `${destination} trip for ${clientName} \u2014 starting today`,
            timestamp: new Date().toISOString(),
            entityId: trip.id,
            entityData: {
                tripId: trip.id,
                destination,
                clientName,
                startDate: trip.start_date,
            },
        };
    });
}

async function fetchDismissedTaskIds(
    orgId: string,
    userId: string
): Promise<Set<string>> {
    const todayStart = `${todayIso()}T00:00:00.000Z`;

    const { data, error } = await supabaseAdmin
        .from("dashboard_task_dismissals")
        .select("task_id")
        .eq("organization_id", orgId)
        .eq("user_id", userId)
        .gte("dismissed_at", todayStart);

    if (error || !data) return new Set();

    return new Set(data.map((row) => row.task_id));
}

export async function GET() {
    try {
        const serverClient = await createServerClient();
        const {
            data: { user },
        } = await serverClient.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile?.organization_id) {
            return NextResponse.json(
                { error: "No organization" },
                { status: 403 }
            );
        }

        const orgId = profile.organization_id;

        const [
            driverTasks,
            paymentTasks,
            quoteTasks,
            pickupTasks,
            dismissedIds,
        ] = await Promise.all([
            fetchDriverUnassignedTasks(orgId),
            fetchPaymentOverdueTasks(orgId),
            fetchQuoteAwaitingTasks(orgId),
            fetchPickupTodayTasks(orgId),
            fetchDismissedTaskIds(orgId, user.id),
        ]);

        const allTasks = [
            ...driverTasks,
            ...paymentTasks,
            ...quoteTasks,
            ...pickupTasks,
        ];

        const tasks: TaskItem[] = [];
        const completedTasks: TaskItem[] = [];

        for (const task of allTasks) {
            if (dismissedIds.has(task.id)) {
                completedTasks.push(task);
            } else {
                tasks.push(task);
            }
        }

        return NextResponse.json({ tasks, completedTasks });
    } catch (error) {
        console.error("Dashboard tasks error:", error);
        return NextResponse.json(
            {
                error: safeErrorMessage(error, "Request failed"),
            },
            { status: 500 }
        );
    }
}
