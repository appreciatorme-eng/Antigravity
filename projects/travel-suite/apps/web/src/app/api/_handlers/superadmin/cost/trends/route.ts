// GET /api/superadmin/cost/trends — daily cost trend for specified range and optional category.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

function daysAgo(n: number): string {
    return new Date(Date.now() - n * 86_400_000).toISOString();
}

function monthStartISO(date: Date): string {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;
    const params = request.nextUrl.searchParams;
    const range = params.get("range") || "30d";
    const days = range === "30d" ? 30 : range === "60d" ? 60 : 90;
    const since = daysAgo(days);

    try {
        // Get per-org monthly AI usage data for the months overlapping the range
        const months = new Set<string>();
        for (let i = 0; i <= days; i++) {
            const d = new Date(Date.now() - i * 86_400_000);
            months.add(monthStartISO(d));
        }

        const monthStarts = Array.from(months);

        const [aiUsageResult] = await Promise.all([
            adminClient
                .from("organization_ai_usage")
                .select("organization_id, estimated_cost_usd, month_start, ai_requests")
                .in("month_start", monthStarts),
        ]);

        // Map month → total spend
        const byMonth: Record<string, number> = {};
        for (const row of (aiUsageResult.data ?? [])) {
            const ms = row.month_start as string;
            byMonth[ms] = (byMonth[ms] ?? 0) + Number(row.estimated_cost_usd ?? 0);
        }

        // Build daily array — approximate from monthly by spreading evenly
        // This is a graceful degradation since we don't have per-day cost logs here
        const daily = Array.from({ length: days }, (_, i) => {
            const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
            const key = d.toISOString().slice(0, 10);
            const monthKey = monthStartISO(d);
            const daysInMonth = new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0).getUTCDate();
            const monthSpend = byMonth[monthKey] ?? 0;
            const dailyApprox = Number((monthSpend / daysInMonth).toFixed(4));
            return {
                date: key,
                estimated_usd: dailyApprox,
            };
        });

        // Also fetch notification_logs cost_metering for the range (real daily data if available)
        const logsResult = await adminClient
            .from("notification_logs")
            .select("created_at, body, status")
            .eq("notification_type", "cost_metering")
            .gte("created_at", since)
            .limit(10000);

        const logsByDay: Record<string, number> = {};
        for (const log of (logsResult.data ?? [])) {
            if (log.status !== "sent" || !log.created_at) continue;
            const day = (log.created_at as string).slice(0, 10);
            // Parse estimated cost from body: "category|estimated_cost_usd=0.0081|..."
            const match = (log.body as string | null)?.match(/estimated_cost_usd=([0-9.]+)/);
            if (match) {
                logsByDay[day] = (logsByDay[day] ?? 0) + Number(match[1]);
            }
        }

        // Use real log data if available, otherwise monthly approximation
        const finalDaily = daily.map((d) => ({
            date: d.date,
            estimated_usd: logsByDay[d.date] !== undefined
                ? Number(logsByDay[d.date].toFixed(4))
                : d.estimated_usd,
        }));

        return NextResponse.json({ range, daily: finalDaily });
    } catch (err) {
        console.error("[superadmin/cost/trends]", err);
        return apiError("Failed to load cost trends", 500);
    }
}
