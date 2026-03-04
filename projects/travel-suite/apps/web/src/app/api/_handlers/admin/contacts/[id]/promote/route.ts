import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireAdmin } from '@/lib/auth/admin';
import { captureOperationalMetric } from '@/lib/observability/metrics';
import { getRequestContext, getRequestId, logError, logEvent } from '@/lib/observability/logger';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { sanitizeEmail, sanitizePhone, sanitizeText } from '@/lib/security/sanitize';
import { jsonWithRequestId as withRequestId } from '@/lib/api/response';

type AdminContext = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;
const CONTACTS_PROMOTE_RATE_LIMIT_MAX = 40;
const CONTACTS_PROMOTE_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function normalizePhone(phone?: string | null): string | null {
  return sanitizePhone(phone);
}

function resolveScopedOrganizationId(
  admin: AdminContext,
  request: Request,
): { organizationId: string | null } | { status: number; error: string } {
  const requestedOrganizationId = sanitizeText(
    new URL(request.url).searchParams.get('organization_id') ||
      new URL(request.url).searchParams.get('organizationId'),
    { maxLength: 80 },
  );

  if (admin.isSuperAdmin) {
    return { organizationId: requestedOrganizationId || admin.organizationId || null };
  }

  if (!admin.organizationId) {
    return { status: 400, error: 'Admin organization not configured' };
  }

  if (requestedOrganizationId && requestedOrganizationId !== admin.organizationId) {
    return { status: 403, error: 'Cannot access contacts for another organization' };
  }

  return { organizationId: admin.organizationId };
}

export async function POST(req: Request, { params }: { params: Promise<{ id?: string }> }) {
    const startedAt = Date.now();
    const nextReq = req as NextRequest;
    const requestId = getRequestId(nextReq);
  const requestContext = getRequestContext(nextReq, requestId);

  try {
    const admin = await requireAdmin(nextReq, { requireOrganization: false });
    if (!admin.ok) {
      return withRequestId(
        { error: admin.response.status === 401 ? 'Unauthorized' : 'Forbidden' },
        requestId,
        { status: admin.response.status || 401 },
      );
    }

    const scopedOrg = resolveScopedOrganizationId(admin, req);
    if ('error' in scopedOrg) {
      return withRequestId({ error: scopedOrg.error }, requestId, { status: scopedOrg.status });
    }

    const rateLimit = await enforceRateLimit({
      identifier: admin.userId,
      limit: CONTACTS_PROMOTE_RATE_LIMIT_MAX,
      windowMs: CONTACTS_PROMOTE_RATE_LIMIT_WINDOW_MS,
      prefix: 'api:admin:contacts:promote',
    });
    if (!rateLimit.success) {
      return withRequestId(
        { error: 'Too many contact promotion requests. Please retry later.' },
        requestId,
        { status: 429 },
      );
    }

    const { id: rawId } = await params;
    const id = sanitizeText(rawId || '', { maxLength: 80 });
    let contactQuery = admin.adminClient
      .from('crm_contacts')
      .select('id,organization_id,full_name,email,phone,phone_normalized,converted_profile_id')
      .eq('id', id);
    if (scopedOrg.organizationId) {
      contactQuery = contactQuery.eq('organization_id', scopedOrg.organizationId);
    }
    const { data: contact } = await contactQuery.maybeSingle();

    if (!contact) {
      return withRequestId({ error: 'Contact not found' }, requestId, { status: 404 });
    }

    if (contact.converted_profile_id) {
      return withRequestId({ ok: true, profile_id: contact.converted_profile_id, already_converted: true }, requestId);
    }

    const normalizedPhone = contact.phone_normalized || normalizePhone(contact.phone);
    let profileId: string | null = null;

    if (contact.email) {
        const safeEmail = sanitizeEmail(contact.email);
      if (safeEmail) {
        const { data: existingByEmail } = await admin.adminClient
          .from('profiles')
          .select('id')
          .eq('email', safeEmail)
          .maybeSingle();
        profileId = existingByEmail?.id || null;
      }
    }

    if (!profileId && normalizedPhone) {
      const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');
      const candidates = Array.from(new Set([normalizedPhone, phoneWithoutPlus])).filter(Boolean);
      const { data: existingByPhone } = await admin.adminClient
        .from('profiles')
        .select('id')
        .in('phone_normalized', candidates)
        .maybeSingle();
      profileId = existingByPhone?.id || null;
    }

    if (!profileId) {
      const safeEmail = sanitizeEmail(contact.email);
      if (!safeEmail) {
        return withRequestId(
          { error: 'Cannot promote contact without email unless phone is already linked to an existing user profile.' },
          requestId,
          { status: 400 }
        );
      }

      const { data: created, error: createError } = await admin.adminClient.auth.admin.createUser({
        email: safeEmail,
        email_confirm: true,
        user_metadata: {
          full_name: sanitizeText(contact.full_name, { maxLength: 120 }),
        },
      });
      if (createError || !created?.user?.id) {
        return withRequestId({ error: createError?.message || 'Failed to create user' }, requestId, { status: 400 });
      }
      profileId = created.user.id;
    }

    const { error: updateError } = await admin.adminClient
      .from('profiles')
      .update({
        full_name: sanitizeText(contact.full_name, { maxLength: 120 }) || null,
        email: sanitizeEmail(contact.email) || null,
        phone: sanitizePhone(contact.phone) || null,
        phone_normalized: normalizedPhone || null,
        role: 'client',
        organization_id: contact.organization_id,
        lead_status: 'new',
        lifecycle_stage: 'lead',
        client_tag: 'standard',
        phase_notifications_enabled: true,
      })
      .eq('id', profileId);

    if (updateError) {
      return withRequestId({ error: updateError.message }, requestId, { status: 400 });
    }

    await admin.adminClient
      .from('crm_contacts')
      .update({
        converted_profile_id: profileId,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contact.id);

    await admin.adminClient.from('workflow_stage_events').insert({
      organization_id: contact.organization_id,
      profile_id: profileId,
      from_stage: 'pre_lead',
      to_stage: 'lead',
      changed_by: admin.userId,
    });

    const durationMs = Date.now() - startedAt;
    logEvent('info', 'Contact promoted to lead', {
      ...requestContext,
      contact_id: contact.id,
      profile_id: profileId,
      durationMs,
    });
    void captureOperationalMetric('api.admin.contacts.promote', {
      request_id: requestId,
      contact_id: contact.id,
      profile_id: profileId,
      duration_ms: durationMs,
    });

    return withRequestId({ ok: true, profile_id: profileId }, requestId);
  } catch (error) {
    Sentry.captureException(error);
    logError('Contact promote crashed', error, requestContext);
    return withRequestId(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      requestId,
      { status: 500 }
    );
  }
}
