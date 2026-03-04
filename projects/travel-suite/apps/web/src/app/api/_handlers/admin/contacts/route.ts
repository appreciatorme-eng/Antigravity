import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireAdmin } from '@/lib/auth/admin';
import { captureOperationalMetric } from '@/lib/observability/metrics';
import { getRequestContext, getRequestId, logError, logEvent } from '@/lib/observability/logger';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { sanitizeEmail, sanitizePhone, sanitizeText } from '@/lib/security/sanitize';
import { jsonWithRequestId as withRequestId } from '@/lib/api/response';

type AdminContext = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;
const CONTACTS_LIST_RATE_LIMIT_MAX = 120;
const CONTACTS_LIST_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const CONTACTS_IMPORT_RATE_LIMIT_MAX = 30;
const CONTACTS_IMPORT_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function normalizePhone(phone?: string | null): string | null {
  return sanitizePhone(phone);
}

function sanitizeSearchTerm(input: string): string {
  const safe = sanitizeText(input, { maxLength: 80 });
  if (!safe) return "";
  return safe.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function resolveScopedOrganizationId(
  admin: AdminContext,
  requestedOrganizationId: string | null,
): { organizationId: string } | { status: number; error: string } {
  if (admin.isSuperAdmin) {
    const superScopedOrgId = requestedOrganizationId || admin.organizationId || null;
    if (!superScopedOrgId) {
      return { status: 400, error: 'organization_id is required for super admin contacts scope' };
    }
    return { organizationId: superScopedOrgId };
  }

  if (!admin.organizationId) {
    return { status: 400, error: 'Admin organization not configured' };
  }
  if (requestedOrganizationId && requestedOrganizationId !== admin.organizationId) {
    return { status: 403, error: 'Cannot access contacts for another organization' };
  }
  return { organizationId: admin.organizationId };
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(req);
  const requestContext = getRequestContext(req, requestId);

  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return withRequestId(
        { error: admin.response.status === 401 ? 'Unauthorized' : 'Forbidden' },
        requestId,
        { status: admin.response.status || 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const scopedOrg = resolveScopedOrganizationId(
      admin,
      sanitizeText(searchParams.get('organization_id') || searchParams.get('organizationId'), {
        maxLength: 80,
      }),
    );
    if ('error' in scopedOrg) {
      return withRequestId({ error: scopedOrg.error }, requestId, { status: scopedOrg.status });
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: CONTACTS_LIST_RATE_LIMIT_MAX,
      windowMs: CONTACTS_LIST_RATE_LIMIT_WINDOW_MS,
      prefix: 'api:admin:contacts:list',
    });
    if (!rateLimit.success) {
      return withRequestId(
        { error: 'Too many contacts list requests. Please retry later.' },
        requestId,
        { status: 429 },
      );
    }

    const search = sanitizeSearchTerm(searchParams.get('search') || '').toLowerCase();

    let query = admin.adminClient
      .from('crm_contacts')
      .select('id,full_name,email,phone,phone_normalized,source,notes,converted_profile_id,converted_at,created_at')
      .eq('organization_id', scopedOrg.organizationId)
      .is('converted_profile_id', null)
      .order('created_at', { ascending: false })
      .limit(200);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      logError('Contacts list query failed', error, requestContext);
      return withRequestId({ error: error.message }, requestId, { status: 500 });
    }

    const durationMs = Date.now() - startedAt;
    logEvent('info', 'Contacts list fetched', {
      ...requestContext,
      rows: data?.length || 0,
      durationMs,
    });
    void captureOperationalMetric('api.admin.contacts.list', {
      request_id: requestId,
      rows: data?.length || 0,
      duration_ms: durationMs,
    });

    return withRequestId({ contacts: data || [] }, requestId);
  } catch (error) {
    Sentry.captureException(error);
    logError('Contacts list crashed', error, requestContext);
    return withRequestId(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      requestId,
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(req);
  const requestContext = getRequestContext(req, requestId);

  try {
    const admin = await requireAdmin(req, { requireOrganization: false });
    if (!admin.ok) {
      return withRequestId(
        { error: admin.response.status === 401 ? 'Unauthorized' : 'Forbidden' },
        requestId,
        { status: admin.response.status || 401 },
      );
    }

    const body = await req.json();
    const scopedOrg = resolveScopedOrganizationId(
      admin,
      sanitizeText(body.organization_id || body.organizationId, { maxLength: 80 }),
    );
    if ('error' in scopedOrg) {
      return withRequestId({ error: scopedOrg.error }, requestId, { status: scopedOrg.status });
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: CONTACTS_IMPORT_RATE_LIMIT_MAX,
      windowMs: CONTACTS_IMPORT_RATE_LIMIT_WINDOW_MS,
      prefix: 'api:admin:contacts:import',
    });
    if (!rateLimit.success) {
      return withRequestId(
        { error: 'Too many contact import requests. Please retry later.' },
        requestId,
        { status: 429 },
      );
    }

    const source = sanitizeText(body.source || 'manual', { maxLength: 40 }) || 'manual';
    const payload = Array.isArray(body.contacts) ? body.contacts : [body];

    let imported = 0;

    for (const item of payload) {
      const fullName = sanitizeText(item.full_name || item.name, { maxLength: 120 });
      const email = sanitizeEmail(item.email);
      const phone = sanitizePhone(item.phone || item.tel);
      const phoneNormalized = normalizePhone(phone);
      const notesRaw = sanitizeText(item.notes, { maxLength: 2000, preserveNewlines: true });
      const notes = notesRaw || null;

      if (!fullName && !email && !phoneNormalized) {
        continue;
      }

      let existingId: string | null = null;
      if (email) {
        const { data: existingByEmail } = await admin.adminClient
          .from('crm_contacts')
          .select('id')
          .eq('organization_id', scopedOrg.organizationId)
          .eq('email', email)
          .is('converted_profile_id', null)
          .maybeSingle();
        existingId = existingByEmail?.id || null;
      }

      if (!existingId && phoneNormalized) {
        const { data: existingByPhone } = await admin.adminClient
          .from('crm_contacts')
          .select('id')
          .eq('organization_id', scopedOrg.organizationId)
          .eq('phone_normalized', phoneNormalized)
          .is('converted_profile_id', null)
          .maybeSingle();
        existingId = existingByPhone?.id || null;
      }

      if (existingId) {
        const { error } = await admin.adminClient
          .from('crm_contacts')
          .update({
            full_name: fullName || undefined,
            email,
            phone,
            phone_normalized: phoneNormalized,
            notes,
            source,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingId);

        if (!error) imported += 1;
        continue;
      }

      const { error } = await admin.adminClient
        .from('crm_contacts')
        .insert({
          organization_id: scopedOrg.organizationId,
          full_name: fullName || email || phoneNormalized || 'Unknown Contact',
          email,
          phone,
          phone_normalized: phoneNormalized,
          notes,
          source,
          created_by: admin.userId,
        });

      if (!error) imported += 1;
    }

    const durationMs = Date.now() - startedAt;
    logEvent('info', 'Contacts imported', {
      ...requestContext,
      imported,
      source,
      durationMs,
    });
    void captureOperationalMetric('api.admin.contacts.import', {
      request_id: requestId,
      imported,
      source,
      duration_ms: durationMs,
    });
    return withRequestId({ ok: true, imported }, requestId);
  } catch (error) {
    Sentry.captureException(error);
    logError('Contacts import crashed', error, requestContext);
    return withRequestId(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      requestId,
      { status: 500 }
    );
  }
}
