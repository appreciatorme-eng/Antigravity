// POST /api/superadmin/settings/org-suspend — suspend or unsuspend an organization.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getPlatformSetting, setPlatformSetting } from "@/lib/platform/settings";
import { logPlatformAction, getClientIpFromRequest } from "@/lib/platform/audit";

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { userId } = auth;

    let body: { org_id?: string; action?: string; reason?: string };
    try { body = await request.json(); } catch {
        return apiError("Invalid JSON", 400);
    }

    if (!body.org_id) return apiError("org_id is required", 400);
    if (body.action !== "suspend" && body.action !== "unsuspend") {
        return apiError("action must be 'suspend' or 'unsuspend'", 400);
    }

    try {
        const current = await getPlatformSetting("org_suspensions") as { suspended_org_ids?: string[] } | null;
        const existing = current?.suspended_org_ids ?? [];

        let updated: string[];
        if (body.action === "suspend") {
            updated = existing.includes(body.org_id) ? existing : [...existing, body.org_id];
        } else {
            updated = existing.filter((id) => id !== body.org_id);
        }

        await setPlatformSetting(
            "org_suspensions",
            { suspended_org_ids: updated },
            userId
        );

        await logPlatformAction(
            userId,
            `org_${body.action}ed`,
            "org_management",
            { org_id: body.org_id, action: body.action, reason: body.reason ?? null },
            getClientIpFromRequest(request)
        );

        return NextResponse.json({
            org_id: body.org_id,
            action: body.action,
            suspended_org_ids: updated,
        });
    } catch (err) {
        console.error("[superadmin/settings/org-suspend]", err);
        return apiError("Failed to update org suspension", 500);
    }
}
