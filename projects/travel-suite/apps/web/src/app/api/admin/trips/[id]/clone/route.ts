import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Groq from "groq-sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/security/sanitize";

const supabaseAdmin = createAdminClient();

const CloneSchema = z.object({
  title: z.string().max(160).optional(),
  destination: z.string().max(120).optional(),
  durationDays: z.number().int().min(1).max(21).optional(),
  style: z.enum(["balanced", "family", "adventure", "luxury", "budget"]).default("balanced"),
  travelerProfile: z.string().max(200).optional(),
  includeFocus: z.array(z.string().max(80)).max(20).optional(),
  avoidFocus: z.array(z.string().max(80)).max(20).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  useAi: z.boolean().optional(),
});

type CoordinatesLike = { lat?: number; lng?: number };
type ActivityLike = {
  title?: string;
  name?: string;
  description?: string;
  location?: string;
  coordinates?: CoordinatesLike;
};

type DayLike = {
  day_number?: number;
  theme?: string;
  activities?: ActivityLike[];
};

type ItineraryLike = {
  trip_title?: string;
  destination?: string;
  summary?: string;
  duration_days?: number;
  days?: DayLike[];
};

function normalizedList(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
  const unique = new Set<string>();
  for (const value of values) {
    const cleaned = sanitizeText(value, { maxLength: 80 }).toLowerCase();
    if (!cleaned) continue;
    unique.add(cleaned);
  }
  return Array.from(unique).slice(0, 20);
}

function containsAny(text: string, terms: string[]): boolean {
  if (!text || terms.length === 0) return false;
  const hay = text.toLowerCase();
  return terms.some((term) => hay.includes(term));
}

function computeEndDate(startDate: string, durationDays: number): string {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime())) return startDate;
  start.setUTCDate(start.getUTCDate() + Math.max(durationDays - 1, 0));
  return start.toISOString().slice(0, 10);
}

function cloneAndCustomize(base: ItineraryLike, options: z.infer<typeof CloneSchema>): ItineraryLike {
  const includeFocus = normalizedList(options.includeFocus);
  const avoidFocus = normalizedList(options.avoidFocus);

  const rawDays = Array.isArray(base.days) ? base.days : [];
  let days: DayLike[] = rawDays.map((day) => ({
    day_number: day.day_number,
    theme: sanitizeText(day.theme, { maxLength: 140 }),
    activities: (Array.isArray(day.activities) ? day.activities : []).map((activity) => ({
      ...activity,
      title: sanitizeText(activity.title || activity.name, { maxLength: 140 }),
      description: sanitizeText(activity.description, { maxLength: 1200, preserveNewlines: true }),
      location: sanitizeText(activity.location, { maxLength: 140 }),
    })),
  }));

  if (avoidFocus.length > 0) {
    days = days.map((day) => ({
      ...day,
      activities: (day.activities || []).filter((activity) => {
        const title = sanitizeText(activity.title || activity.name, { maxLength: 200 }).toLowerCase();
        const description = sanitizeText(activity.description, {
          maxLength: 1200,
          preserveNewlines: true,
        }).toLowerCase();
        const location = sanitizeText(activity.location, { maxLength: 200 }).toLowerCase();
        const searchBlob = `${title} ${description} ${location}`;
        return !containsAny(searchBlob, avoidFocus);
      }),
    }));
  }

  const finalDuration = options.durationDays || days.length || Number(base.duration_days || 1) || 1;
  if (days.length > finalDuration) {
    days = days.slice(0, finalDuration);
  } else if (days.length < finalDuration) {
    const seedDay =
      days[days.length - 1] ||
      ({
        day_number: 1,
        theme: "Flexible exploration",
        activities: [],
      } as DayLike);
    while (days.length < finalDuration) {
      const nextIndex = days.length + 1;
      days.push({
        ...seedDay,
        day_number: nextIndex,
        theme: `Flexible Exploration Day ${nextIndex}`,
      });
    }
  }

  days = days.map((day, index) => ({
    ...day,
    day_number: index + 1,
    theme: sanitizeText(day.theme, { maxLength: 140 }) || `Day ${index + 1} Experiences`,
  }));

  const baseSummary = sanitizeText(base.summary, { maxLength: 3000, preserveNewlines: true });
  const styleLine = `Style: ${options.style}.`;
  const travelerLine = options.travelerProfile
    ? `Traveler profile: ${sanitizeText(options.travelerProfile, { maxLength: 200 })}.`
    : "";
  const includeLine =
    includeFocus.length > 0 ? `Must include: ${includeFocus.slice(0, 8).join(", ")}.` : "";
  const avoidLine =
    avoidFocus.length > 0 ? `Avoided focus areas: ${avoidFocus.slice(0, 8).join(", ")}.` : "";

  return {
    ...base,
    trip_title:
      sanitizeText(options.title, { maxLength: 160 }) ||
      sanitizeText(base.trip_title, { maxLength: 160 }) ||
      "Customized Trip",
    destination:
      sanitizeText(options.destination, { maxLength: 120 }) ||
      sanitizeText(base.destination, { maxLength: 120 }) ||
      "Destination",
    duration_days: finalDuration,
    summary: [baseSummary, styleLine, travelerLine, includeLine, avoidLine].filter(Boolean).join(" "),
    days,
  };
}

async function refineWithAi(
  itinerary: ItineraryLike,
  options: z.infer<typeof CloneSchema>
): Promise<{ updated: ItineraryLike; aiApplied: boolean }> {
  const useAi = options.useAi !== false;
  const apiKey = process.env.GROQ_API_KEY || "";
  if (!useAi || !apiKey) return { updated: itinerary, aiApplied: false };

  const groq = new Groq({ apiKey });
  const prompt = `Rewrite the following itinerary summary and day themes.
Return JSON only:
{
  "summary":"...",
  "dayThemes":["Day 1 theme", "Day 2 theme"]
}

Context:
- Title: ${sanitizeText(itinerary.trip_title, { maxLength: 160 })}
- Destination: ${sanitizeText(itinerary.destination, { maxLength: 120 })}
- Duration: ${Number(itinerary.duration_days || 1)} days
- Style: ${options.style}
- Traveler profile: ${sanitizeText(options.travelerProfile, { maxLength: 200 })}
- Include: ${normalizedList(options.includeFocus).join(", ")}
- Avoid: ${normalizedList(options.avoidFocus).join(", ")}
- Current summary: ${sanitizeText(itinerary.summary, { maxLength: 3000, preserveNewlines: true })}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are a travel itinerary copywriter. Return valid JSON only." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(raw) as { summary?: unknown; dayThemes?: unknown };
    const summary = sanitizeText(parsed.summary, { maxLength: 3000, preserveNewlines: true });
    const dayThemes = Array.isArray(parsed.dayThemes)
      ? parsed.dayThemes
          .map((item) => sanitizeText(item, { maxLength: 140 }))
          .filter(Boolean)
      : [];

    const updatedDays = (Array.isArray(itinerary.days) ? itinerary.days : []).map((day, index) => ({
      ...day,
      theme: dayThemes[index] || sanitizeText(day.theme, { maxLength: 140 }) || `Day ${index + 1}`,
    }));

    return {
      updated: {
        ...itinerary,
        summary: summary || itinerary.summary,
        days: updatedDays,
      },
      aiApplied: Boolean(summary || dayThemes.length > 0),
    };
  } catch {
    return { updated: itinerary, aiApplied: false };
  }
}

async function requireAdmin() {
  const serverClient = await createServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (!profile.organization_id) {
    return {
      error: NextResponse.json({ error: "Admin organization not configured" }, { status: 400 }),
    };
  }

  return { userId: user.id, organizationId: profile.organization_id };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if ("error" in admin) return admin.error;

    const { id } = await params;
    const tripId = sanitizeText(id, { maxLength: 64 });
    if (!tripId) return NextResponse.json({ error: "Invalid trip id" }, { status: 400 });

    const body = await request.json().catch(() => null);
    const parsed = CloneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid clone options", details: parsed.error.flatten() }, { status: 400 });
    }

    const { data: tripRow, error: tripError } = await supabaseAdmin
      .from("trips")
      .select(`
        id,
        organization_id,
        client_id,
        start_date,
        end_date,
        itinerary_id,
        itineraries!inner(
          id,
          trip_title,
          destination,
          summary,
          duration_days,
          raw_data
        )
      `)
      .eq("id", tripId)
      .eq("organization_id", admin.organizationId)
      .single();

    if (tripError || !tripRow) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const itineraryRow = Array.isArray(tripRow.itineraries) ? tripRow.itineraries[0] : tripRow.itineraries;
    if (!itineraryRow) {
      return NextResponse.json({ error: "Trip itinerary missing" }, { status: 400 });
    }

    const rawData =
      itineraryRow.raw_data && typeof itineraryRow.raw_data === "object"
        ? (itineraryRow.raw_data as ItineraryLike)
        : {};

    const baseItinerary: ItineraryLike = {
      ...rawData,
      trip_title: sanitizeText(rawData.trip_title || itineraryRow.trip_title, { maxLength: 160 }),
      destination: sanitizeText(rawData.destination || itineraryRow.destination, { maxLength: 120 }),
      summary: sanitizeText(rawData.summary || itineraryRow.summary, {
        maxLength: 3000,
        preserveNewlines: true,
      }),
      duration_days:
        typeof rawData.duration_days === "number"
          ? rawData.duration_days
          : Number(itineraryRow.duration_days || 0) || 1,
      days: Array.isArray(rawData.days) ? rawData.days : [],
    };

    const customized = cloneAndCustomize(baseItinerary, parsed.data);
    const aiResult = await refineWithAi(customized, parsed.data);
    const finalItinerary = aiResult.updated;
    const finalDuration = Number(finalItinerary.duration_days || 1);

    const preferredStartDate = parsed.data.startDate || tripRow.start_date || new Date().toISOString().slice(0, 10);
    const preferredEndDate =
      parsed.data.endDate || computeEndDate(preferredStartDate, finalDuration);

    const itineraryInsert = {
      user_id: tripRow.client_id,
      trip_title: sanitizeText(finalItinerary.trip_title, { maxLength: 160 }) || "Customized Trip",
      destination: sanitizeText(finalItinerary.destination, { maxLength: 120 }) || "Destination",
      summary: sanitizeText(finalItinerary.summary, { maxLength: 3000, preserveNewlines: true }) || "",
      duration_days: finalDuration,
      raw_data: {
        ...finalItinerary,
        clone_meta: {
          cloned_from_trip_id: tripRow.id,
          cloned_from_itinerary_id: itineraryRow.id,
          style: parsed.data.style,
          traveler_profile: sanitizeText(parsed.data.travelerProfile, { maxLength: 200 }) || null,
          include_focus: normalizedList(parsed.data.includeFocus),
          avoid_focus: normalizedList(parsed.data.avoidFocus),
          ai_applied: aiResult.aiApplied,
          cloned_at: new Date().toISOString(),
        },
      },
    };

    const { data: newItinerary, error: itineraryInsertError } = await supabaseAdmin
      .from("itineraries")
      .insert(itineraryInsert)
      .select("id")
      .single();

    if (itineraryInsertError || !newItinerary) {
      return NextResponse.json(
        { error: itineraryInsertError?.message || "Failed to create cloned itinerary" },
        { status: 400 }
      );
    }

    const { data: newTrip, error: tripInsertError } = await supabaseAdmin
      .from("trips")
      .insert({
        client_id: tripRow.client_id,
        organization_id: admin.organizationId,
        start_date: preferredStartDate,
        end_date: preferredEndDate,
        status: "draft",
        itinerary_id: newItinerary.id,
      })
      .select("id")
      .single();

    if (tripInsertError || !newTrip) {
      return NextResponse.json(
        { error: tripInsertError?.message || "Failed to create cloned trip" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      source_trip_id: tripRow.id,
      trip_id: newTrip.id,
      itinerary_id: newItinerary.id,
      ai_applied: aiResult.aiApplied,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
