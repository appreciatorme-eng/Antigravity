/* ------------------------------------------------------------------
 * GET/POST /api/admin/automations/contact-status
 * Returns automation state per contact with per-contact toggle support.
 * ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { AUTOMATION_TEMPLATES } from "@/lib/automation/templates";
import { logError } from "@/lib/observability/logger";

const TEMPLATE_ICONS: Record<string, string> = {
    welcome_message: "👋",
    proposal_followup: "📋",
    itinerary_shared: "🗺️",
    booking_confirmation: "🎉",
    payment_received: "🧾",
    payment_reminder: "💰",
    packing_reminder: "🧳",
    departure_day: "🌟",
    trip_countdown: "✈️",
    post_trip_thanks: "🏠",
    review_request: "⭐",
    anniversary_reminder: "🎂",
};

// ---------------------------------------------------------------------------
// GET — returns automation states for a contact
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, adminClient } = auth;
        const orgId = organizationId!;

        const url = new URL(request.url);
        const phone = url.searchParams.get("phone");
        if (!phone) {
            return NextResponse.json({ error: "phone parameter required" }, { status: 400 });
        }

        // Fetch per-contact overrides (table not in generated types yet)
        const { data: overrides } = await (adminClient as any)
            .from("automation_contact_overrides")
            .select("rule_type, enabled")
            .eq("organization_id", orgId)
            .eq("contact_phone", phone);

        const overrideMap = new Map<string, boolean>();
        for (const o of overrides ?? []) {
            overrideMap.set(o.rule_type, o.enabled);
        }

        // Build automation state from templates
        const automations = AUTOMATION_TEMPLATES.map((t) => ({
            rule_type: t.id,
            name: t.name,
            description: t.description,
            icon: TEMPLATE_ICONS[t.id] ?? "⚙️",
            category: t.category,
            enabled: overrideMap.get(t.id) ?? t.enabled_by_default,
            lastSent: null as string | null,
        }));

        return NextResponse.json({ automations });
    } catch (error) {
        logError("[automations/contact-status:GET]", error);
        return NextResponse.json({ error: "Failed to load automation status" }, { status: 500 });
    }
}

// ---------------------------------------------------------------------------
// POST — toggle automation for a specific contact
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId, adminClient } = auth;
        const orgId = organizationId!;

        const body = await request.json();
        const phone = String(body.phone || "").trim();
        const ruleType = String(body.rule_type || "").trim();
        const enabled = body.enabled === true;

        if (!phone || !ruleType) {
            return NextResponse.json({ error: "phone and rule_type are required" }, { status: 400 });
        }

        // Validate rule_type exists
        const validTypes = AUTOMATION_TEMPLATES.map((t) => t.id);
        if (!validTypes.includes(ruleType as typeof validTypes[number])) {
            return NextResponse.json({ error: "Invalid rule_type" }, { status: 400 });
        }

        // Upsert override (table not in generated types yet)
        const { error } = await (adminClient as any)
            .from("automation_contact_overrides")
            .upsert(
                {
                    organization_id: orgId,
                    contact_phone: phone,
                    rule_type: ruleType,
                    enabled,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "organization_id,contact_phone,rule_type" },
            );

        if (error) {
            logError("[automations/contact-status:POST] upsert failed", error);
            return NextResponse.json({ error: "Failed to update" }, { status: 500 });
        }

        return NextResponse.json({ success: true, enabled });
    } catch (error) {
        logError("[automations/contact-status:POST]", error);
        return NextResponse.json({ error: "Failed to update automation" }, { status: 500 });
    }
}
