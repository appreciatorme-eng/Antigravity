import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cleanupSecret = process.env.NOTIFICATION_CRON_SECRET || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function isAdmin(authHeader: string | null): Promise<{ userId: string | null }> {
    if (!authHeader?.startsWith("Bearer ")) return { userId: null };
    const token = authHeader.substring(7);
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) return { userId: null };

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

    return { userId: profile?.role === "admin" ? authData.user.id : null };
}

export async function POST(request: NextRequest) {
    try {
        const secret = request.headers.get("x-notification-cron-secret") || "";
        const authHeader = request.headers.get("authorization");
        const admin = await isAdmin(authHeader);
        const hasSecret = cleanupSecret && secret === cleanupSecret;

        if (!hasSecret && !admin.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const nowIso = new Date().toISOString();
        const { data, error } = await supabaseAdmin
            .from("trip_location_shares")
            .update({ is_active: false })
            .eq("is_active", true)
            .lt("expires_at", nowIso)
            .select("id");

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (admin.userId) {
            await supabaseAdmin.from("notification_logs").insert({
                notification_type: "manual",
                recipient_type: "admin",
                recipient_id: admin.userId,
                title: "Expired Live Shares Cleanup",
                body: `Deactivated ${data?.length || 0} expired live share link(s).`,
                status: "sent",
                sent_at: nowIso,
            });
        }

        return NextResponse.json({
            ok: true,
            cleaned: data?.length || 0,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
