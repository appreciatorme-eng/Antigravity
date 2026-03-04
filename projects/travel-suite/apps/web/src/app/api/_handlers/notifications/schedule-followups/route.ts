import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";
import { isCronSecretBearer, isCronSecretHeader } from "@/lib/security/cron-auth";

const supabaseAdmin = createAdminClient();

const FOLLOW_UP_STEPS = [
  { type: "post_trip_review_day1", dayOffset: 1 },
  { type: "post_trip_referral_day7", dayOffset: 7 },
  { type: "post_trip_reengage_day30", dayOffset: 30 },
] as const;

type FollowUpType = (typeof FOLLOW_UP_STEPS)[number]["type"];
type NotificationQueueInsert = Database["public"]["Tables"]["notification_queue"]["Insert"];

interface CompletedTripRow {
  id: string;
  organization_id: string | null;
  client_id: string | null;
  end_date: string | null;
  updated_at: string | null;
  created_at: string | null;
  profiles:
    | {
        full_name: string | null;
        phone: string | null;
      }
    | Array<{
        full_name: string | null;
        phone: string | null;
      }>
    | null;
  itineraries:
    | {
        trip_title: string | null;
        destination: string | null;
      }
    | Array<{
        trip_title: string | null;
        destination: string | null;
      }>
    | null;
}

function isServiceRoleBearer(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return authHeader.substring(7) === serviceRole;
}

async function isAdminBearerToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.substring(7);

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) return false;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  return profile?.role === "admin" || profile?.role === "super_admin";
}

function clampToFuture(date: Date): string {
  const minimum = new Date(Date.now() + 2 * 60_000);
  const finalDate = date.getTime() < minimum.getTime() ? minimum : date;
  return finalDate.toISOString();
}

function scheduleFromBase(baseIso: string, dayOffset: number): string {
  const base = new Date(baseIso);
  base.setUTCDate(base.getUTCDate() + dayOffset);
  base.setUTCHours(10, 0, 0, 0);
  return clampToFuture(base);
}

function resolveCompletionBaseIso(row: CompletedTripRow): string {
  return row.end_date || row.updated_at || row.created_at || new Date().toISOString();
}

function normalizeClientData(row: CompletedTripRow) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const itinerary = Array.isArray(row.itineraries) ? row.itineraries[0] : row.itineraries;

  return {
    clientName: profile?.full_name || "Traveler",
    recipientPhone: profile?.phone || null,
    destination: itinerary?.destination || "your destination",
    tripTitle: itinerary?.trip_title || itinerary?.destination || "your trip",
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const headerSecret = request.headers.get("x-notification-cron-secret") || "";

    const secretAuthorized = isCronSecretHeader(headerSecret);
    const bearerCronAuthorized = isCronSecretBearer(authHeader);
    const serviceRoleAuthorized = isServiceRoleBearer(authHeader);
    const adminAuthorized = await isAdminBearerToken(authHeader);

    if (!secretAuthorized && !bearerCronAuthorized && !serviceRoleAuthorized && !adminAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 250), 1), 500);

    const { data: completedTrips, error: tripsError } = await supabaseAdmin
      .from("trips")
      .select(
        `
        id,
        organization_id,
        client_id,
        end_date,
        updated_at,
        created_at,
        profiles:profiles!trips_client_id_fkey (
          full_name,
          phone
        ),
        itineraries:itineraries!trips_itinerary_id_fkey (
          trip_title,
          destination
        )
      `
      )
      .eq("status", "completed")
      .not("client_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (tripsError) {
      return NextResponse.json({ error: tripsError.message }, { status: 500 });
    }

    const rows = (completedTrips || []) as unknown as CompletedTripRow[];
    if (rows.length === 0) {
      return NextResponse.json({ success: true, queued: 0, skipped_existing: 0, scanned: 0 });
    }

    const tripIds = rows.map((trip) => trip.id);
    const followUpTypes = FOLLOW_UP_STEPS.map((step) => step.type);

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("notification_queue")
      .select("trip_id,user_id,notification_type")
      .in("trip_id", tripIds)
      .in("notification_type", followUpTypes);

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingSet = new Set<string>();
    for (const row of existingRows || []) {
      const tripId = row.trip_id || "";
      const userId = row.user_id || "";
      const type = row.notification_type as FollowUpType;
      existingSet.add(`${tripId}:${userId}:${type}`);
    }

    const insertRows: NotificationQueueInsert[] = [];
    let skippedExisting = 0;

    for (const trip of rows) {
      if (!trip.client_id) continue;

      const completionBase = resolveCompletionBaseIso(trip);
      const { clientName, destination, tripTitle, recipientPhone } = normalizeClientData(trip);

      for (const step of FOLLOW_UP_STEPS) {
        const key = `${trip.id}:${trip.client_id}:${step.type}`;
        if (existingSet.has(key)) {
          skippedExisting += 1;
          continue;
        }

        insertRows.push({
          trip_id: trip.id,
          user_id: trip.client_id,
          recipient_phone: recipientPhone,
          recipient_type: "client",
          notification_type: step.type,
          status: "pending",
          attempts: 0,
          channel_preference: "whatsapp_first",
          idempotency_key: key,
          scheduled_for: scheduleFromBase(completionBase, step.dayOffset),
          payload: {
            source: "post_trip_followup_sequence",
            template_key: step.type,
            template_vars: {
              client_name: clientName,
              destination,
              trip_title: tripTitle,
            },
            day_offset: step.dayOffset,
          },
        });
      }
    }

    if (insertRows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("notification_queue")
        .insert(insertRows);
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      scanned: rows.length,
      queued: insertRows.length,
      skipped_existing: skippedExisting,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to schedule follow-ups" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
