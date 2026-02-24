import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeText } from '@/lib/security/sanitize';
import type { Database, Json } from '@/lib/database.types';

const supabaseAdmin = createAdminClient();

const ShareActionSchema = z.object({
  action: z.enum(['comment', 'approve']),
  author: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
  name: z.string().max(120).optional(),
});

const SHARE_TOKEN_REGEX = /^[A-Za-z0-9_-]{8,200}$/;

type ShareComment = {
  id: string;
  author: string;
  comment: string;
  created_at: string;
};

function sanitizeShareToken(value: unknown): string | null {
  const token = sanitizeText(value, { maxLength: 200 });
  if (!token) return null;
  if (!SHARE_TOKEN_REGEX.test(token)) return null;
  return token;
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await params;
    const token = sanitizeShareToken(rawToken);
    if (!token) {
      return NextResponse.json({ error: 'Invalid share token' }, { status: 400 });
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
    return NextResponse.json({
      status: share.status || 'viewed',
      approved_by: share.approved_by || null,
      approved_at: share.approved_at || null,
      comments,
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

    const body = await request.json().catch(() => ({}));
    const parsed = ShareActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 });
    }

    const { action } = parsed.data;

    const { data: shareData, error: shareError } = await supabaseAdmin
      .from('shared_itineraries')
      .select('id, itinerary_id, client_comments, expires_at, status, approved_by, approved_at')
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

      const commentUpdatePayload: Database['public']['Tables']['shared_itineraries']['Update'] = {
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

      const approveUpdatePayload: Database['public']['Tables']['shared_itineraries']['Update'] = {
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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
