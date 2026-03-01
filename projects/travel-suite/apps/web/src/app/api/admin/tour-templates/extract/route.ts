import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { extractTourFromPDF } from '@/lib/import/pdf-extractor';
import { extractTourFromURL, getTourPreviewFromURL } from '@/lib/import/url-scraper';

export const runtime = 'nodejs';
const TOUR_TEMPLATE_EXTRACT_RATE_LIMIT_MAX = 20;
const TOUR_TEMPLATE_EXTRACT_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, { requireOrganization: false });
  if (!admin.ok) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: admin.response.status || 401 }
    );
  }

  const rateLimit = await enforceRateLimit({
    identifier: admin.userId,
    limit: TOUR_TEMPLATE_EXTRACT_RATE_LIMIT_MAX,
    windowMs: TOUR_TEMPLATE_EXTRACT_RATE_LIMIT_WINDOW_MS,
    prefix: 'api:admin:tour-templates:extract',
  });
  if (!rateLimit.success) {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
    const response = NextResponse.json(
      { success: false, error: 'Too many extraction requests. Please retry later.' },
      { status: 429 }
    );
    response.headers.set('retry-after', String(retryAfterSeconds));
    response.headers.set('x-ratelimit-limit', String(rateLimit.limit));
    response.headers.set('x-ratelimit-remaining', String(rateLimit.remaining));
    response.headers.set('x-ratelimit-reset', String(rateLimit.reset));
    return response;
  }

  const contentType = req.headers.get('content-type') || '';

  // PDF upload path (multipart/form-data)
  if (contentType.includes('multipart/form-data')) {
    try {
      const form = await req.formData();
      const method = String(form.get('method') || '');
      if (method !== 'pdf') {
        return NextResponse.json({ success: false, error: 'Invalid method' }, { status: 400 });
      }
      const file = form.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ success: false, error: 'Missing PDF file' }, { status: 400 });
      }
      const result = await extractTourFromPDF(file);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  // URL / preview path (JSON)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const method = typeof payload.method === 'string' ? payload.method : '';
  const url = typeof payload.url === 'string' ? payload.url : '';

  if (!url) {
    return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 });
  }

  if (method === 'preview') {
    const result = await getTourPreviewFromURL(url);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  if (method === 'url') {
    const result = await extractTourFromURL(url);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  }

  return NextResponse.json({ success: false, error: 'Invalid method' }, { status: 400 });
}
