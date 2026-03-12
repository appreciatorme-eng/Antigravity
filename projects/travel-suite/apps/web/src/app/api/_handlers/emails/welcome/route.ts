import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { safeErrorMessage } from "@/lib/security/safe-error";

const supabaseAdmin = createAdminClient();

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return apiError("Unauthorized", 401);
        }

        const token = authHeader.substring(7);
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return apiError("Invalid token", 401);
        }

        const rateLimit = await enforceRateLimit({
            identifier: user.id,
            limit: 5,
            windowMs: 60 * 1000,
            prefix: "auth:email:welcome",
        });
        if (!rateLimit.success) {
            return apiError("Too many requests", 429);
        }

        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("full_name, email, welcome_email_sent_at")
            .eq("id", user.id)
            .single();

        if (profileError) {
            return apiError(safeErrorMessage(profileError, "Failed to load profile"), 400);
        }

        if (profile?.welcome_email_sent_at) {
            return NextResponse.json({ success: true, status: "already_sent" });
        }

        const toEmail = profile?.email || user.email;
        if (!toEmail) {
            return apiError("Missing email", 400);
        }

        const result = await sendWelcomeEmail({
            toEmail,
            fullName: profile?.full_name || (user.user_metadata?.full_name as string | undefined),
        });

        if (result.success) {
            await supabaseAdmin
                .from("profiles")
                .update({ welcome_email_sent_at: new Date().toISOString() })
                .eq("id", user.id);
        }

        return NextResponse.json({ success: result.success, skipped: result.skipped, reason: result.reason });
    } catch (error: unknown) {
        console.error("Welcome email error:", error);
        return apiError(safeErrorMessage(error, "Failed to send welcome email"), 500);
    }
}
