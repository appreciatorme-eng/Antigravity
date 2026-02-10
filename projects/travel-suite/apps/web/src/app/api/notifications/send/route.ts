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
        const { type, tripId, userId, title, body: messageBody, data } = body;

        if (!title || !messageBody) {
            return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
        }

        let result;

        if (tripId && !userId) {
            // Send to all trip users
            result = await sendNotificationToTripUsers(tripId, title, messageBody, type || "manual");
        } else if (userId) {
            // Send to specific user
            result = await sendNotificationToUser({
                userId,
                title,
                body: messageBody,
                data: {
                    type: type || "manual",
                    tripId,
                    ...data,
                },
            });
        } else {
            return NextResponse.json({ error: "Either tripId or userId is required" }, { status: 400 });
        }

        if (result.success) {
            return NextResponse.json({ ...result });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Send notification error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
