// GET /api/superadmin/overview/presets — fetch saved command-center views for current superadmin.
// PUT /api/superadmin/overview/presets — replace saved command-center views.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { logError } from "@/lib/observability/logger";
import { loadUserPresets, saveUserPresets, type SavedPreset } from "@/lib/platform/god-mode";
import { logPlatformAction } from "@/lib/platform/audit";

type PutBody = {
    presets?: SavedPreset[];
};

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    try {
        const presets = await loadUserPresets(auth.adminClient, auth.userId);
        return NextResponse.json({ presets });
    } catch (err) {
        logError("[superadmin/overview/presets GET]", err);
        return apiError("Failed to load saved views", 500);
    }
}

export async function PUT(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    let body: PutBody;
    try {
        body = await request.json() as PutBody;
    } catch {
        return apiError("Invalid JSON", 400);
    }

    if (!Array.isArray(body.presets)) {
        return apiError("presets array is required", 400);
    }

    try {
        const presets = await saveUserPresets(auth.adminClient, auth.userId, body.presets);
        await logPlatformAction(
            auth.userId,
            "Updated command center saved views",
            "settings",
            { count: presets.length },
        );
        return NextResponse.json({ presets });
    } catch (err) {
        logError("[superadmin/overview/presets PUT]", err);
        return apiError("Failed to save views", 500);
    }
}
