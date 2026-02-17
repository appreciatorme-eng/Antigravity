import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractTourFromPDF } from '@/lib/import/pdf-extractor';
import { extractTourFromURL, getTourPreviewFromURL } from '@/lib/import/url-scraper';

export const runtime = 'nodejs';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false as const, status: 401, error: userError.message };
  }
  if (!user) {
    return { ok: false as const, status: 401, error: 'Not authenticated' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return { ok: false as const, status: 500, error: profileError.message };
  }
  if (!profile || profile.role !== 'admin') {
    return { ok: false as const, status: 403, error: 'Admin access required' };
  }

  return { ok: true as const, user };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
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
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const method = typeof body?.method === 'string' ? body.method : '';
  const url = typeof body?.url === 'string' ? body.url : '';

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

