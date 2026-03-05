// POST /api/superadmin/settings/kill-switch — update a platform_settings key (maintenance, feature flags, spend limits).

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { setPlatformSetting } from "@/lib/platform/settings";
import { logPlatformAction, getClientIpFromRequest } from "@/lib/platform/audit";

const ALLOWED_KEYS = ["maintenance_mode", "feature_flags", "spend_limits", "org_suspensions"] as const;
type AllowedKey = typeof ALLOWED_KEYS[number];

export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { userId } = auth;

    let body: { key?: string; value?: unknown };
    try { body = await request.json(); } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.key || !ALLOWED_KEYS.includes(body.key as AllowedKey)) {
        return NextResponse.json({
            error: `key must be one of: ${ALLOWED_KEYS.join(", ")}`,
        }, { status: 400 });
    }

    if (body.value === undefined || body.value === null) {
        return NextResponse.json({ error: "value is required" }, { status: 400 });
    }

    try {
        await setPlatformSetting(body.key, body.value as Record<string, unknown>, userId);

        await logPlatformAction(
            userId,
            `kill_switch_updated:${body.key}`,
            "kill_switch",
            { key: body.key, value: body.value },
            getClientIpFromRequest(request)
        );

        return NextResponse.json({ key: body.key, updated: true });
    } catch (err) {
        console.error("[superadmin/settings/kill-switch]", err);
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }
}
