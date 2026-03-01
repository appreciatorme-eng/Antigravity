import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Groq from "groq-sdk";
import { requireAdmin } from "@/lib/auth/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/security/sanitize";

const SOCIAL_GENERATE_RATE_LIMIT_MAX = 30;
const SOCIAL_GENERATE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

const PlatformSchema = z.enum(["instagram", "facebook", "whatsapp"]);
const ToneSchema = z.enum(["premium", "friendly", "adventure", "family", "luxury"]);

const RequestSchema = z.object({
  itineraryId: z.string().uuid(),
  platforms: z.array(PlatformSchema).min(1).max(3),
  tone: ToneSchema.default("friendly"),
  audience: z.string().max(120).optional(),
  callToAction: z.string().max(160).optional(),
});

type ActivityLike = {
  title?: string;
  location?: string;
};

type DayLike = {
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

type SocialPost = {
  platform: z.infer<typeof PlatformSchema>;
  caption: string;
  shortCaption: string;
  hashtags: string[];
  bestTime: string;
  creativeAngle: string;
};

function cleanWords(input: string): string[] {
  return sanitizeText(input, { maxLength: 160 })
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
}

function hashTagify(parts: string[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const value of parts) {
    const normalized = value.replace(/[^a-z0-9]/gi, "");
    if (!normalized) continue;
    const tag = `#${normalized}`;
    if (seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
    if (tags.length >= 10) break;
  }
  return tags;
}

function platformBestTime(platform: z.infer<typeof PlatformSchema>) {
  if (platform === "instagram") return "7:30 PM local time";
  if (platform === "facebook") return "8:30 PM local time";
  return "11:00 AM local time";
}

function platformAngle(platform: z.infer<typeof PlatformSchema>, tone: z.infer<typeof ToneSchema>) {
  const toneLabel = tone.charAt(0).toUpperCase() + tone.slice(1);
  if (platform === "instagram") return `${toneLabel} visual storytelling`;
  if (platform === "facebook") return `${toneLabel} trip narrative`;
  return `${toneLabel} direct conversion message`;
}

function extractHighlights(itinerary: ItineraryLike): string[] {
  const out: string[] = [];
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  for (const day of days.slice(0, 4)) {
    const theme = sanitizeText(day.theme, { maxLength: 80 });
    if (theme) out.push(theme);
    const activities = Array.isArray(day.activities) ? day.activities : [];
    for (const activity of activities.slice(0, 3)) {
      const title = sanitizeText(activity.title, { maxLength: 80 });
      if (title) out.push(title);
      if (out.length >= 8) return out;
    }
  }
  return out;
}

function fallbackPosts(
  itinerary: ItineraryLike,
  platforms: z.infer<typeof PlatformSchema>[],
  tone: z.infer<typeof ToneSchema>,
  audience: string,
  callToAction: string
): SocialPost[] {
  const title = sanitizeText(itinerary.trip_title, { maxLength: 120 }) || "Curated Journey";
  const destination = sanitizeText(itinerary.destination, { maxLength: 120 }) || "your dream destination";
  const summary = sanitizeText(itinerary.summary, { maxLength: 500, preserveNewlines: true });
  const highlights = extractHighlights(itinerary);
  const shortHighlights = highlights.slice(0, 3).join(", ");
  const baseTags = hashTagify([
    ...cleanWords(destination),
    ...cleanWords(title),
    ...cleanWords(shortHighlights),
    "travel",
    "itinerary",
    "tour",
    tone,
  ]);

  return platforms.map((platform) => {
    const caption = [
      `${title} in ${destination}.`,
      shortHighlights ? `Highlights: ${shortHighlights}.` : "",
      summary ? summary : "",
      audience ? `Designed for ${audience}.` : "",
      callToAction || "Message us to get this plan customized for your dates.",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      platform,
      caption: caption.slice(0, 1500),
      shortCaption: caption.slice(0, 180),
      hashtags: baseTags,
      bestTime: platformBestTime(platform),
      creativeAngle: platformAngle(platform, tone),
    };
  });
}

const AiResponseSchema = z.object({
  posts: z.array(
    z.object({
      platform: PlatformSchema,
      caption: z.string(),
      shortCaption: z.string(),
      hashtags: z.array(z.string()),
      bestTime: z.string(),
      creativeAngle: z.string(),
    })
  ),
});

async function generateWithGroq(
  itinerary: ItineraryLike,
  platforms: z.infer<typeof PlatformSchema>[],
  tone: z.infer<typeof ToneSchema>,
  audience: string,
  callToAction: string
): Promise<SocialPost[] | null> {
  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) return null;

  const groq = new Groq({ apiKey });
  const highlights = extractHighlights(itinerary);
  const prompt = `You generate social media copy for a travel operator.
Return strict JSON only with this shape:
{
  "posts":[
    {
      "platform":"instagram|facebook|whatsapp",
      "caption":"string <=1500 chars",
      "shortCaption":"string <=180 chars",
      "hashtags":["#tag"],
      "bestTime":"string",
      "creativeAngle":"string"
    }
  ]
}

Trip:
- Title: ${sanitizeText(itinerary.trip_title, { maxLength: 120 })}
- Destination: ${sanitizeText(itinerary.destination, { maxLength: 120 })}
- Duration: ${Number(itinerary.duration_days || 0)} days
- Tone: ${tone}
- Audience: ${audience || "general travelers"}
- CTA: ${callToAction || "Message us for dates and pricing"}
- Highlights: ${highlights.join(", ")}
- Summary: ${sanitizeText(itinerary.summary, { maxLength: 1000, preserveNewlines: true })}

Platforms: ${platforms.join(", ")}
Use concise, conversion-oriented copy.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: "You are a senior travel growth marketer. Always output valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "";
    const parsedJson = JSON.parse(raw);
    const parsed = AiResponseSchema.safeParse(parsedJson);
    if (!parsed.success) return null;

    const byPlatform = new Map(parsed.data.posts.map((post) => [post.platform, post]));
    const ordered = platforms
      .map((platform) => byPlatform.get(platform))
      .filter((post): post is SocialPost => Boolean(post))
      .slice(0, platforms.length);
    if (ordered.length === 0) return null;
    return ordered;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request, { requireOrganization: false });
    if (!admin.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: admin.response.status || 401 });
    }
    if (!admin.isSuperAdmin && !admin.organizationId) {
      return NextResponse.json({ error: "Admin organization not configured" }, { status: 400 });
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: SOCIAL_GENERATE_RATE_LIMIT_MAX,
      windowMs: SOCIAL_GENERATE_RATE_LIMIT_WINDOW_MS,
      prefix: "api:admin:social:generate",
    });
    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
      const response = NextResponse.json(
        { error: "Too many social generation requests. Please retry later." },
        { status: 429 }
      );
      response.headers.set("retry-after", String(retryAfterSeconds));
      response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
      response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
      response.headers.set("x-ratelimit-reset", String(rateLimit.reset));
      return response;
    }

    const body = await request.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { itineraryId, platforms, tone } = parsed.data;
    const audience = sanitizeText(parsed.data.audience, { maxLength: 120 });
    const callToAction = sanitizeText(parsed.data.callToAction, { maxLength: 160 });

    const { data: itineraryRow, error: itineraryError } = await admin.adminClient
      .from("itineraries")
      .select(`
        id,
        user_id,
        trip_title,
        destination,
        summary,
        duration_days,
        raw_data,
        profiles!itineraries_user_id_fkey(organization_id)
      `)
      .eq("id", itineraryId)
      .single();

    if (itineraryError || !itineraryRow) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    const linkedProfiles = Array.isArray(itineraryRow.profiles)
      ? itineraryRow.profiles
      : itineraryRow.profiles
        ? [itineraryRow.profiles]
        : [];
    const itineraryOrgId = sanitizeText(linkedProfiles[0]?.organization_id, { maxLength: 80 });

    if (!itineraryOrgId) {
      return NextResponse.json({ error: "Itinerary organization is missing" }, { status: 400 });
    }

    if (!admin.isSuperAdmin && itineraryOrgId !== admin.organizationId) {
      return NextResponse.json({ error: "Itinerary is outside your organization" }, { status: 403 });
    }

    const raw = itineraryRow.raw_data;
    const rawData = (raw && typeof raw === "object" ? raw : {}) as ItineraryLike;
    const itinerary: ItineraryLike = {
      trip_title: sanitizeText(rawData.trip_title || itineraryRow.trip_title, { maxLength: 120 }),
      destination: sanitizeText(rawData.destination || itineraryRow.destination, { maxLength: 120 }),
      summary: sanitizeText(rawData.summary || itineraryRow.summary, {
        maxLength: 3000,
        preserveNewlines: true,
      }),
      duration_days:
        typeof rawData.duration_days === "number"
          ? rawData.duration_days
          : Number(itineraryRow.duration_days || 0),
      days: Array.isArray(rawData.days) ? rawData.days : [],
    };

    const aiPosts = await generateWithGroq(itinerary, platforms, tone, audience, callToAction);
    const posts =
      aiPosts ||
      fallbackPosts(itinerary, platforms, tone, audience, callToAction).map((post) => ({
        ...post,
        hashtags: post.hashtags.slice(0, 8),
      }));

    return NextResponse.json({
      itinerary: {
        id: itineraryRow.id,
        title: itinerary.trip_title,
        destination: itinerary.destination,
        duration_days: itinerary.duration_days,
      },
      source: aiPosts ? "ai" : "fallback",
      posts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
