// POST /api/superadmin/users/:id/impersonate — generates a magic link to temporarily login as the target user.

import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { logPlatformActionWithTarget, getClientIpFromRequest } from "@/lib/platform/audit";

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient, userId } = auth;
    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    // Path looks like: /api/superadmin/users/:id/impersonate
    // segments: ["api", "superadmin", "users", ":id", "impersonate"]
    let targetId = segments[segments.length - 2];
    
    if (targetId === "users") {
        targetId = segments[segments.length - 1]; // Fallback depending on path parsing
    }

    if (!targetId || targetId === "users" || targetId === "impersonate") {
        return apiError("Missing user id", 400);
    }

    try {
        // Fetch the user's email
        const { data: profile } = await adminClient
            .from("profiles")
            .select("id, email, full_name")
            .eq("id", targetId)
            .single();

        if (!profile || !profile.email) {
            return apiError("Target user or email not found", 404);
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
        const redirectTo = new URL("/admin", appUrl).toString();

        // Generate magic link using Admin Auth API
        const { data, error } = await adminClient.auth.admin.generateLink({
            type: "magiclink",
            email: profile.email,
            options: {
                redirectTo,
            },
        });

        if (error || !data.properties?.action_link) {
            logError("[superadmin/users/impersonate] generateLink failed", error || new Error("No action_link returned"));
            return apiError("Failed to generate impersonation session", 500);
        }

        const actionLink = data.properties.action_link;

        await logPlatformActionWithTarget(
            userId,
            `Impersonated user ${profile.email}`,
            "kill_switch", // using kill_switch/high severity category for impersonation
            "user",
            targetId,
            { email: profile.email, full_name: profile.full_name },
            getClientIpFromRequest(request)
        );

        return apiSuccess({ magic_link: actionLink });
    } catch (error) {
        logError("[superadmin/users/impersonate]", error);
        return apiError("Failed to impersonate user", 500);
    }
}
