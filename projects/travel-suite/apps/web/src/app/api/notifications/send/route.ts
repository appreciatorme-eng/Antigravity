import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNotificationToUser, sendNotificationToTripUsers } from "@/lib/notifications";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        // Verify admin authorization
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { type, tripId, userId, email, title, body: messageBody, data } = body;

        if (!title || !messageBody) {
            return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
        }

        let result;

        if (tripId && !userId && !email) {
            // Send to all trip users
            result = await sendNotificationToTripUsers(tripId, title, messageBody, type || "manual");
        } else {
            let resolvedUserId = userId;
            if (!resolvedUserId && email) {
                const { data: targetProfile } = await supabaseAdmin
                    .from("profiles")
                    .select("id")
                    .eq("email", String(email).trim().toLowerCase())
                    .single();
                resolvedUserId = targetProfile?.id;
            }

            if (!resolvedUserId) {
                return NextResponse.json({ error: "Unable to resolve user for notification" }, { status: 400 });
            }

            // Send to specific user
            result = await sendNotificationToUser({
                userId: resolvedUserId,
                title,
                body: messageBody,
                data: {
                    type: type || "manual",
                    tripId,
                    ...data,
                },
            });
        }

        if (result.success) {
            return NextResponse.json({ ...result });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Send notification error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
