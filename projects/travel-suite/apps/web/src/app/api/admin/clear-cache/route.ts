import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { sanitizeText } from "@/lib/security/sanitize";

/**
 * Admin endpoint to clear itinerary cache.
 * - super_admin can clear all cache (requires all=true)
 * - admin can clear only entries created by users in their own organization
 *
 * GET /api/admin/clear-cache
 * GET /api/admin/clear-cache?destination=Tokyo (clear specific destination)
 */
export async function GET(req: NextRequest) {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
        return admin.response;
    }

    const { searchParams } = new URL(req.url);
    const destination = sanitizeText(searchParams.get("destination"), { maxLength: 80 });
    const clearAll = searchParams.get("all") === "true";

    if (admin.isSuperAdmin && !destination && !clearAll) {
        return NextResponse.json(
            { error: "Super admin must pass all=true to clear all cache." },
            { status: 400 }
        );
    }

    if (!admin.isSuperAdmin && !admin.organizationId) {
        return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
    }

    try {
        let query = admin.adminClient.from("itinerary_cache").delete();

        if (destination) {
            query = query.ilike("destination", destination);
        }

        if (!admin.isSuperAdmin) {
            const { data: orgUsers, error: orgUsersError } = await admin.adminClient
                .from("profiles")
                .select("id")
                .eq("organization_id", admin.organizationId!);

            if (orgUsersError) {
                return NextResponse.json({ success: false, error: orgUsersError.message }, { status: 500 });
            }

            const orgUserIds = (orgUsers || []).map((row) => row.id).filter(Boolean);
            if (orgUserIds.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: "No users found in organization. Nothing to clear.",
                    clearedCount: 0,
                });
            }

            query = query.in("created_by", orgUserIds);
        } else if (!destination && clearAll) {
            query = query.neq("id", "00000000-0000-0000-0000-000000000000");
        }

        const { data, error } = await query.select("id");

        if (error) {
            console.error("Cache clear error:", error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: destination
                ? `Cache cleared for destination: ${destination}`
                : "Cache cleared",
            clearedCount: data?.length || 0
        });
    } catch (err) {
        console.error("Cache clear exception:", err);
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : "Unknown error"
        }, { status: 500 });
    }
}
