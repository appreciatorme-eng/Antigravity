import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getGeocodingUsageStats } from "@/lib/geocoding-with-cache";

type AdminAuth = Awaited<ReturnType<typeof requireAdmin>>;

async function auditAdminAction(
    admin: Extract<AdminAuth, { ok: true }>,
    action: string,
    detail: string
) {
    try {
        const nowIso = new Date().toISOString();
        await admin.adminClient.from("notification_logs").insert({
            recipient_id: admin.userId,
            recipient_type: "admin",
            notification_type: "admin_audit",
            title: action,
            body: detail,
            status: "sent",
            sent_at: nowIso,
            updated_at: nowIso,
        });
    } catch {
        // Audit logging should not block admin operations.
    }
}

/**
 * GET /api/admin/geocoding/usage
 * Returns current month's geocoding API usage statistics
 */
export async function GET(req: NextRequest) {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) return admin.response;

    try {
        const stats = await getGeocodingUsageStats();

        if (!stats) {
            return NextResponse.json({ error: "Could not retrieve usage statistics" }, { status: 500 });
        }

        const percentageUsed = ((stats.apiCalls / stats.limitThreshold) * 100).toFixed(2);

        let status: "healthy" | "warning" | "critical" | "blocked";
        if (stats.limitReached) {
            status = "blocked";
        } else if (stats.apiCalls >= stats.limitThreshold * 0.9) {
            status = "critical";
        } else if (stats.apiCalls >= stats.limitThreshold * 0.75) {
            status = "warning";
        } else {
            status = "healthy";
        }

        await auditAdminAction(
            admin,
            "Geocoding usage viewed",
            `Admin ${admin.userId} viewed geocoding usage (${stats.apiCalls}/${stats.limitThreshold}).`
        );

        return NextResponse.json({
            status,
            month: stats.monthYear,
            usage: {
                totalRequests: stats.totalRequests,
                cacheHits: stats.cacheHits,
                apiCalls: stats.apiCalls,
                cacheHitRate: `${stats.cacheHitRate}%`,
            },
            limits: {
                threshold: stats.limitThreshold,
                remaining: stats.remainingCalls,
                percentageUsed: `${percentageUsed}%`,
                limitReached: stats.limitReached,
            },
            lastApiCall: stats.lastApiCallAt,
            message: getStatusMessage(status, stats),
        });
    } catch (error) {
        console.error("Geocoding usage stats error:", error);
        return NextResponse.json({ error: "Failed to retrieve usage statistics" }, { status: 500 });
    }
}

function getStatusMessage(
    status: string,
    stats: {
        apiCalls: number;
        remainingCalls: number;
        limitThreshold: number;
        cacheHitRate: number;
    }
): string {
    switch (status) {
        case "blocked":
            return `⛔ API limit reached! ${stats.apiCalls}/${stats.limitThreshold} requests used. Geocoding is now cache-only until next month.`;
        case "critical":
            return `🚨 Critical: Only ${stats.remainingCalls} API calls remaining this month. Cache hit rate: ${stats.cacheHitRate}%`;
        case "warning":
            return `⚠️ Warning: ${stats.apiCalls}/${stats.limitThreshold} API calls used. ${stats.remainingCalls} remaining. Consider optimizing.`;
        default:
            return `✅ Healthy: ${stats.apiCalls}/${stats.limitThreshold} API calls used. Cache hit rate: ${stats.cacheHitRate}%`;
    }
}
