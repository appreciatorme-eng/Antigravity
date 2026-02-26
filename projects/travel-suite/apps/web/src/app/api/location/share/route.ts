import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, type RequireAdminResult } from "@/lib/auth/admin";

type AdminContext = Extract<RequireAdminResult, { ok: true }>;

function buildLiveUrl(req: NextRequest, token: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    return `${appUrl.replace(/\/$/, "")}/live/${token}`;
}

async function getScopedTrip(admin: AdminContext, tripId: string) {
    let query = admin.adminClient
        .from("trips")
        .select("id, organization_id")
        .eq("id", tripId)
        .limit(1);

    if (!admin.isSuperAdmin) {
        if (!admin.organizationId) return null;
        query = query.eq("organization_id", admin.organizationId);
    }

    const { data: trip, error } = await query.maybeSingle();
    if (error || !trip) return null;
    return trip;
}

export async function GET(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) return admin.response;

        const tripId = req.nextUrl.searchParams.get("tripId") || "";
        const dayNumberRaw = req.nextUrl.searchParams.get("dayNumber");
        const dayNumber = dayNumberRaw ? Number(dayNumberRaw) : null;

        if (!tripId) {
            return NextResponse.json({ error: "tripId is required" }, { status: 400 });
        }

        const trip = await getScopedTrip(admin, tripId);
        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        let query = admin.adminClient
            .from("trip_location_shares")
            .select("id,trip_id,day_number,share_token,expires_at,is_active")
            .eq("trip_id", trip.id)
            .eq("is_active", true)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1);

        if (Number.isFinite(dayNumber as number)) {
            query = query.eq("day_number", dayNumber as number);
        }

        const { data } = await query.maybeSingle();
        if (!data) {
            return NextResponse.json({ share: null }, { status: 200 });
        }

        return NextResponse.json({
            share: {
                ...data,
                live_url: buildLiveUrl(req, data.share_token),
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) return admin.response;

        const body = await req.json();
        const tripId = String(body.tripId || "").trim();
        const dayNumber = Number(body.dayNumber || 0) || null;
        const expiresHours = Math.max(1, Math.min(Number(body.expiresHours || 24), 168));

        if (!tripId) {
            return NextResponse.json({ error: "tripId is required" }, { status: 400 });
        }

        const trip = await getScopedTrip(admin, tripId);
        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        const existingQuery = admin.adminClient
            .from("trip_location_shares")
            .select("id,trip_id,day_number,share_token,expires_at,is_active")
            .eq("trip_id", trip.id)
            .eq("is_active", true)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1);

        const { data: existing } = dayNumber
            ? await existingQuery.eq("day_number", dayNumber).maybeSingle()
            : await existingQuery.maybeSingle();

        if (existing) {
            return NextResponse.json({
                share: {
                    ...existing,
                    live_url: buildLiveUrl(req, existing.share_token),
                },
                reused: true,
            });
        }

        const shareToken = crypto.randomUUID().replace(/-/g, "");
        const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString();

        const { data, error } = await admin.adminClient
            .from("trip_location_shares")
            .insert({
                trip_id: trip.id,
                day_number: dayNumber,
                share_token: shareToken,
                created_by: admin.userId,
                expires_at: expiresAt,
                is_active: true,
            })
            .select("id,trip_id,day_number,share_token,expires_at,is_active")
            .single();

        if (error || !data) {
            return NextResponse.json({ error: error?.message || "Failed to create share" }, { status: 500 });
        }

        return NextResponse.json({
            share: {
                ...data,
                live_url: buildLiveUrl(req, data.share_token),
            },
            reused: false,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const admin = await requireAdmin(req, { requireOrganization: false });
        if (!admin.ok) return admin.response;

        const tripId = req.nextUrl.searchParams.get("tripId") || "";
        const dayNumber = Number(req.nextUrl.searchParams.get("dayNumber") || 0) || null;
        const shareId = req.nextUrl.searchParams.get("shareId") || "";

        if (!tripId && !shareId) {
            return NextResponse.json(
                { error: "shareId or tripId is required" },
                { status: 400 }
            );
        }

        let scopedTripId = tripId;
        if (shareId) {
            const { data: share, error: shareError } = await admin.adminClient
                .from("trip_location_shares")
                .select("id, trip_id")
                .eq("id", shareId)
                .maybeSingle();

            if (shareError || !share) {
                return NextResponse.json({ error: "Share not found" }, { status: 404 });
            }

            scopedTripId = share.trip_id || "";
        }

        const trip = await getScopedTrip(admin, scopedTripId);
        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        let query = admin.adminClient.from("trip_location_shares").update({
            is_active: false,
            expires_at: new Date().toISOString(),
        });

        if (shareId) {
            query = query.eq("id", shareId).eq("trip_id", trip.id);
        } else {
            query = query.eq("trip_id", trip.id).eq("is_active", true);
            if (dayNumber) {
                query = query.eq("day_number", dayNumber);
            }
        }

        const { data, error } = await query.select("id");
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await admin.adminClient.from("notification_logs").insert({
            trip_id: trip.id,
            notification_type: "manual",
            recipient_type: "admin",
            recipient_id: admin.userId,
            title: "Live Link Revoked",
            body: `Revoked ${data?.length || 0} active live location link(s).`,
            status: "sent",
            sent_at: new Date().toISOString(),
        });

        return NextResponse.json({
            ok: true,
            revoked: data?.length || 0,
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
