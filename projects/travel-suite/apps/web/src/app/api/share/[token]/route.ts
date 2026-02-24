/* eslint-disable @typescript-eslint/no-explicit-any */

import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeText } from '@/lib/security/sanitize';

const supabaseAdmin = createAdminClient();

const ShareActionSchema = z.object({
  action: z.enum(['comment', 'approve']),
  author: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
  name: z.string().max(120).optional(),
});

const SHARE_TOKEN_REGEX = /^[A-Za-z0-9_-]{8,200}$/;

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

    const { data: share, error: shareError } = await (supabaseAdmin as any)
      .from('shared_itineraries')
      .select('*')
      .eq('share_code', token)
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (isExpired(share.expires_at || null)) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    const shareRow = share as any;
    return NextResponse.json({
      status: shareRow.status || 'viewed',
      approved_by: shareRow.approved_by,
      approved_at: shareRow.approved_at,
      comments: shareRow.client_comments || [],
      expires_at: shareRow.expires_at || null,
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

    const { data: share, error: shareError } = await (supabaseAdmin as any)
      .from('shared_itineraries')
      .select('id, itinerary_id, client_comments, expires_at, status, approved_by, approved_at')
      .eq('share_code', token)
      .single();

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

      const shareRow = share as any;
      const existingComments = Array.isArray(shareRow.client_comments)
        ? shareRow.client_comments
        : [];
      const newComment = {
        id: randomUUID(),
        author,
        comment,
        created_at: new Date().toISOString(),
      };

      const { error: updateError } = await (supabaseAdmin as any)
        .from('shared_itineraries')
        .update({
          client_comments: [...existingComments, newComment],
          status: 'commented',
        })
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

      const { error: updateError } = await (supabaseAdmin as any)
        .from('shared_itineraries')
        .update({
          status: 'approved',
          approved_by: name,
          approved_at: new Date().toISOString(),
        })
        .eq('id', share.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      if (share.itinerary_id) {
        await (supabaseAdmin as any)
          .from('itineraries')
          .update({ status: 'approved' })
          .eq('id', share.itinerary_id);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
