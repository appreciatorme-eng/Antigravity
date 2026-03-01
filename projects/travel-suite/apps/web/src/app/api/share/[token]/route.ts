import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeText } from '@/lib/security/sanitize';
import { enforceRateLimit, type RateLimitResult } from "@/lib/security/rate-limit";
import type { Json } from '@/lib/database.types';

const supabaseAdmin = createAdminClient();

const ShareActionSchema = z.object({
  action: z.enum([
    'comment',
    'approve',
    'save_preferences',
    'add_wishlist',
    'remove_wishlist',
    'mark_offline_ready',
  ]),
  author: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
  name: z.string().max(120).optional(),
  wishlist_item: z.string().max(160).optional(),
  preferences: z
    .object({
      budget_preference: z.string().max(40).optional(),
      pace: z.string().max(40).optional(),
      room_preference: z.string().max(120).optional(),
      must_have: z.array(z.string().max(80)).max(20).optional(),
      avoid: z.array(z.string().max(80)).max(20).optional(),
      notes: z.string().max(1000).optional(),
    })
    .optional(),
});

const SHARE_TOKEN_REGEX = /^[A-Za-z0-9_-]{8,200}$/;
const SHARE_READ_RATE_LIMIT_MAX = Number(process.env.PUBLIC_SHARE_READ_RATE_LIMIT_MAX || "60");
const SHARE_READ_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_SHARE_READ_RATE_LIMIT_WINDOW_MS || 15 * 60_000
);
const SHARE_WRITE_RATE_LIMIT_MAX = Number(process.env.PUBLIC_SHARE_WRITE_RATE_LIMIT_MAX || "20");
const SHARE_WRITE_RATE_LIMIT_WINDOW_MS = Number(
  process.env.PUBLIC_SHARE_WRITE_RATE_LIMIT_WINDOW_MS || 15 * 60_000
);

type ShareComment = {
  id: string;
  author: string;
  comment: string;
  created_at: string;
};

type SharePreferences = {
  budget_preference?: string;
  pace?: string;
  room_preference?: string;
  must_have?: string[];
  avoid?: string[];
  notes?: string;
};

type ShareRow = {
  id: string;
  itinerary_id: string | null;
  client_comments: Json;
  expires_at: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  client_preferences?: Json;
  wishlist_items?: Json;
  self_service_status?: string | null;
  offline_pack_ready?: boolean | null;
};

function sanitizeShareToken(value: unknown): string | null {
  const token = sanitizeText(value, { maxLength: 200 });
  if (!token) return null;
  if (!SHARE_TOKEN_REGEX.test(token)) return null;
  return token;
}

function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

function withRateLimitHeaders(response: NextResponse, limiter: RateLimitResult) {
  response.headers.set("x-ratelimit-limit", String(limiter.limit));
  response.headers.set("x-ratelimit-remaining", String(limiter.remaining));
  response.headers.set("x-ratelimit-reset", String(limiter.reset));
  return response;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const parsed = new Date(expiresAt);
  if (!Number.isFinite(parsed.getTime())) return false;
  return parsed.getTime() < Date.now();
}

function parseCommentArray(value: Json | null | undefined): ShareComment[] {
  if (!Array.isArray(value)) return [];

  const comments: ShareComment[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;

    const record = entry as Record<string, unknown>;
    const id = sanitizeText(record.id, { maxLength: 120 }) || randomUUID();
    const author = sanitizeText(record.author, { maxLength: 120 }) || 'Guest';
    const comment = sanitizeText(record.comment, {
      maxLength: 2000,
      preserveNewlines: true,
    });
    const createdAt =
      sanitizeText(record.created_at, { maxLength: 80 }) || new Date().toISOString();

    if (!comment) continue;
    comments.push({
      id,
      author,
      comment,
      created_at: createdAt,
    });
  }

  return comments;
}

function parseStringArray(value: Json | null | undefined, maxLength: number, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, string>();
  for (const entry of value) {
    const sanitized = sanitizeText(entry, { maxLength });
    if (!sanitized) continue;
    const key = sanitized.toLowerCase();
    if (!unique.has(key)) unique.set(key, sanitized);
    if (unique.size >= maxItems) break;
  }
  return Array.from(unique.values());
}

function parsePreferences(value: Json | null | undefined): SharePreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    budget_preference: sanitizeText(record.budget_preference, { maxLength: 40 }) || undefined,
    pace: sanitizeText(record.pace, { maxLength: 40 }) || undefined,
    room_preference: sanitizeText(record.room_preference, { maxLength: 120 }) || undefined,
    must_have: parseStringArray(record.must_have as Json, 80, 20),
    avoid: parseStringArray(record.avoid as Json, 80, 20),
    notes: sanitizeText(record.notes, { maxLength: 1000, preserveNewlines: true }) || undefined,
  };
}

function sanitizePreferences(input: z.infer<typeof ShareActionSchema>['preferences']): SharePreferences {
  if (!input) return {};
  return {
    budget_preference: sanitizeText(input.budget_preference, { maxLength: 40 }) || undefined,
    pace: sanitizeText(input.pace, { maxLength: 40 }) || undefined,
    room_preference: sanitizeText(input.room_preference, { maxLength: 120 }) || undefined,
    must_have: parseStringArray((input.must_have || []) as unknown as Json, 80, 20),
    avoid: parseStringArray((input.avoid || []) as unknown as Json, 80, 20),
    notes: sanitizeText(input.notes, { maxLength: 1000, preserveNewlines: true }) || undefined,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await params;
    const token = sanitizeShareToken(rawToken);
    if (!token) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 400 });
    }

    const limiter = await enforceRateLimit({
      identifier: `read:${getRequestIp(request)}:${token}`,
      limit: SHARE_READ_RATE_LIMIT_MAX,
      windowMs: SHARE_READ_RATE_LIMIT_WINDOW_MS,
      prefix: "public:share:read",
    });
    if (!limiter.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
      const response = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      response.headers.set("retry-after", String(retryAfterSeconds));
      return withRateLimitHeaders(response, limiter);
    }

    const { data: shareData, error: shareError } = await supabaseAdmin
      .from('shared_itineraries')
      .select('*')
      .eq('share_code', token)
      .single();

    const share = shareData;
    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (isExpired(share.expires_at || null)) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    const comments = parseCommentArray(share.client_comments);
    const preferences = parsePreferences((share as { client_preferences?: Json }).client_preferences);
    const wishlistItems = parseStringArray(
      (share as { wishlist_items?: Json }).wishlist_items,
      160,
      50
    );
    return NextResponse.json({
      status: share.status || 'viewed',
      approved_by: share.approved_by || null,
      approved_at: share.approved_at || null,
      comments,
      preferences,
      wishlist_items: wishlistItems,
      self_service_status:
        sanitizeText((share as { self_service_status?: unknown }).self_service_status, {
          maxLength: 24,
        }) || 'active',
      offline_pack_ready:
        (share as { offline_pack_ready?: unknown }).offline_pack_ready === true,
      expires_at: share.expires_at || null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await params;
    const token = sanitizeShareToken(rawToken);
    if (!token) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 400 });
    }

    const limiter = await enforceRateLimit({
      identifier: `write:${getRequestIp(request)}:${token}`,
      limit: SHARE_WRITE_RATE_LIMIT_MAX,
      windowMs: SHARE_WRITE_RATE_LIMIT_WINDOW_MS,
      prefix: "public:share:write",
    });
    if (!limiter.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
      const response = NextResponse.json(
        { error: "Too many actions. Please try again later." },
        { status: 429 }
      );
      response.headers.set("retry-after", String(retryAfterSeconds));
      return withRateLimitHeaders(response, limiter);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = ShareActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 });
    }

    const { action } = parsed.data;

    const dynamicAdmin = supabaseAdmin as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            single: () => Promise<{ data: ShareRow | null; error: { message: string } | null }>;
          };
        };
      };
    };

    const { data: shareData, error: shareError } = await dynamicAdmin
      .from('shared_itineraries')
      .select(
        'id, itinerary_id, client_comments, expires_at, status, approved_by, approved_at, client_preferences, wishlist_items, self_service_status, offline_pack_ready'
      )
      .eq('share_code', token)
      .single();

    const share = shareData;
    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (isExpired(share.expires_at || null)) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    if (action === 'comment') {
      const author = sanitizeText(parsed.data.author, { maxLength: 120 }) || 'Guest';
      const comment = sanitizeText(parsed.data.comment, {
        maxLength: 2000,
        preserveNewlines: true,
      });

      if (!comment) {
        return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
      }

      const existingComments = parseCommentArray(share.client_comments);
      const newComment = {
        id: randomUUID(),
        author,
        comment,
        created_at: new Date().toISOString(),
      };

      const commentUpdatePayload = {
        client_comments: [...existingComments, newComment],
        status: 'commented',
      };

      const { error: updateError } = await supabaseAdmin
        .from('shared_itineraries')
        .update(commentUpdatePayload)
        .eq('id', share.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, comment: newComment });
    }

    if (action === 'approve') {
      const name = sanitizeText(parsed.data.name, { maxLength: 120 });
      if (!name) {
        return NextResponse.json({ error: 'Approver name is required' }, { status: 400 });
      }

      const approveUpdatePayload = {
        status: 'approved',
        approved_by: name,
        approved_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabaseAdmin
        .from('shared_itineraries')
        .update(approveUpdatePayload)
        .eq('id', share.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'save_preferences') {
      const preferences = sanitizePreferences(parsed.data.preferences);
      const updatePayload = {
        client_preferences: preferences,
        status: share.status === 'approved' ? 'approved' : 'commented',
        self_service_status: 'updated',
      };

      const { error: updateError } = await supabaseAdmin
        .from('shared_itineraries')
        .update(updatePayload as never)
        .eq('id', share.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, preferences });
    }

    if (action === 'add_wishlist') {
      const item = sanitizeText(parsed.data.wishlist_item, { maxLength: 160 });
      if (!item) {
        return NextResponse.json({ error: 'Wishlist item is required' }, { status: 400 });
      }

      const existingWishlist = parseStringArray(
        (share as { wishlist_items?: Json }).wishlist_items,
        160,
        50
      );
      const exists = existingWishlist.some(
        (value) => value.toLowerCase() === item.toLowerCase()
      );
      const updatedWishlist = exists ? existingWishlist : [...existingWishlist, item].slice(0, 50);

      const { error: updateError } = await supabaseAdmin
        .from('shared_itineraries')
        .update({
          wishlist_items: updatedWishlist,
          status: share.status === 'approved' ? 'approved' : 'commented',
          self_service_status: 'updated',
        } as never)
        .eq('id', share.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, wishlist_items: updatedWishlist });
    }

    if (action === 'remove_wishlist') {
      const item = sanitizeText(parsed.data.wishlist_item, { maxLength: 160 });
      if (!item) {
        return NextResponse.json({ error: 'Wishlist item is required' }, { status: 400 });
      }

      const existingWishlist = parseStringArray(
        (share as { wishlist_items?: Json }).wishlist_items,
        160,
        50
      );
      const updatedWishlist = existingWishlist.filter(
        (value) => value.toLowerCase() !== item.toLowerCase()
      );

      const { error: updateError } = await supabaseAdmin
        .from('shared_itineraries')
        .update({
          wishlist_items: updatedWishlist,
          self_service_status: 'updated',
        } as never)
        .eq('id', share.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, wishlist_items: updatedWishlist });
    }

    if (action === 'mark_offline_ready') {
      const { error: updateError } = await supabaseAdmin
        .from('shared_itineraries')
        .update({
          offline_pack_ready: true,
          self_service_status: 'updated',
        } as never)
        .eq('id', share.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, offline_pack_ready: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
