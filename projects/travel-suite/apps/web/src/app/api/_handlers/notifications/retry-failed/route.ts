import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { isCronSecretBearer } from "@/lib/security/cron-auth";
import { isServiceRoleBearer } from "@/lib/security/service-role-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/observability/logger";

const supabaseAdmin = createAdminClient();

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return apiError("Unauthorized", 401);
        }

        const serviceRoleAuthorized = isServiceRoleBearer(authHeader);
        const bearerCronAuthorized = isCronSecretBearer(authHeader);

        let adminUserId: string | null = null;
        if (!serviceRoleAuthorized && !bearerCronAuthorized) {
            const token = authHeader.substring(7);
            const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (authError || !authData?.user) {
                return apiError("Invalid token", 401);
            }

            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("role")
                .eq("id", authData.user.id)
                .maybeSingle();

            if (profile?.role !== "admin" && profile?.role !== "super_admin") {
                return apiError("Admin access required", 403);
            }

            adminUserId = authData.user.id;
        }

        const { data, error } = await supabaseAdmin
            .from("notification_queue")
            .update({
                status: "pending",
                scheduled_for: new Date().toISOString(),
                error_message: null,
            })
            .eq("status", "failed")
            .select("id");

        if (error) {
            logError("Error retrying failed notifications", error);
            return apiError("Failed to retry notifications", 500);
        }

        if (adminUserId) {
            await supabaseAdmin.from("notification_logs").insert({
                notification_type: "manual",
                recipient_type: "admin",
                recipient_id: adminUserId,
                title: "Queue Retry Failed",
                body: `Moved ${data?.length || 0} failed queue item(s) back to pending.`,
                status: "sent",
                sent_at: new Date().toISOString(),
            });
        }

        return NextResponse.json({
            ok: true,
            retried: data?.length || 0,
        });
    } catch (error) {
        logError("Error in POST /api/notifications/retry-failed", error);
        return apiError("Failed to retry notifications", 500);
    }
}

export async function GET() {
    return apiError("Method not allowed", 405);
}
