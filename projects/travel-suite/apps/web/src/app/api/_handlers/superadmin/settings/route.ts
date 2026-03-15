// GET /api/superadmin/settings — return all platform_settings as key-value map.

import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { adminClient } = auth;

    try {
        const result = await adminClient
            .from("platform_settings")
            .select("key, value, description, updated_by, updated_at, created_at")
            .order("key");

        const settings = Object.fromEntries(
            (result.data ?? []).map((row) => [row.key, {
                value: row.value,
                description: row.description,
                updated_at: row.updated_at,
            }])
        );

        return NextResponse.json({ settings });
    } catch (err) {
        console.error("[superadmin/settings]", err);
        return apiError("Failed to load settings", 500);
    }
}
