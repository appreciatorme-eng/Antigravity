// POST /api/superadmin/users/invite — superadmin endpoint to invite users.

import { z } from "zod";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { logPlatformActionWithTarget, getClientIpFromRequest } from "@/lib/platform/audit";

const InviteUserSchema = z.object({
    email: z.string().trim().email(),
    name: z.string().trim().min(1).max(120),
    role: z.enum(["super_admin", "admin", "client", "driver", "team_member"]),
    org_id: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient, userId } = auth;

    try {
        const body = await request.json().catch(() => null);
        const parsed = InviteUserSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Invalid invite payload", 400, {
                details: parsed.error.flatten(),
            });
        }

        const { email, name, role, org_id } = parsed.data;
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists
        const { data: existingProfile } = await adminClient
            .from("profiles")
            .select("id")
            .eq("email", normalizedEmail)
            .maybeSingle();

        if (existingProfile) {
            return apiError("User with this email already exists", 409);
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
        const redirectTo = new URL("/auth", appUrl).toString();

        const inviteResponse = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
            redirectTo,
            data: {
                full_name: name,
                organization_id: org_id || null,
            },
        });

        if (inviteResponse.error) {
            logError("[superadmin/users/invite] inviteUserByEmail failed", inviteResponse.error);
            return apiError("Failed to send invite email", 500);
        }

        const invitedUserId = inviteResponse.data.user?.id;
        if (!invitedUserId) {
            return apiError("Invite did not return a user record", 500);
        }

        // Upsert profile
        const { error: upsertError } = await adminClient.from("profiles").upsert(
            {
                id: invitedUserId,
                organization_id: org_id || null,
                role,
                full_name: name,
                email: normalizedEmail,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
        );

        if (upsertError) {
            logError("[superadmin/users/invite] failed to upsert invited profile", upsertError);
            return apiError("Failed to provision invited member profile", 500);
        }

        await logPlatformActionWithTarget(
            userId,
            `Invited user ${normalizedEmail} as ${role}`,
            "org_management",
            "user",
            invitedUserId,
            { email: normalizedEmail, role, org_id },
            getClientIpFromRequest(request)
        );

        return apiSuccess({ id: invitedUserId, email: normalizedEmail, invited: true });
    } catch (error) {
        logError("[superadmin/users/invite]", error);
        return apiError("Failed to invite user", 500);
    }
}
