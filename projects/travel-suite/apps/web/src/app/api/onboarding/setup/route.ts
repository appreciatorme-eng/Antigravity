import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

const TEMPLATE_OPTIONS = new Set(['safari_story', 'urban_brief']);

const normalizeTemplate = (value: unknown): 'safari_story' | 'urban_brief' => {
  const candidate = String(value || '').trim();
  return TEMPLATE_OPTIONS.has(candidate) ? (candidate as 'safari_story' | 'urban_brief') : 'safari_story';
};

const isMissingColumnError = (error: unknown, column: string): boolean => {
  if (!error || typeof error !== 'object') return false;
  const record = error as { message?: string; details?: string; hint?: string; code?: string };
  const blob = `${record.message || ''} ${record.details || ''} ${record.hint || ''}`.toLowerCase();
  const normalizedColumn = column.toLowerCase();
  return (
    blob.includes(`could not find the '${normalizedColumn}' column`) ||
    blob.includes(`column "${normalizedColumn}" does not exist`) ||
    (blob.includes(normalizedColumn) && blob.includes('schema cache'))
  );
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

async function getAuthenticatedUser() {
  const serverClient = await createServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { user };
}

async function ensureProfile(userId: string, email: string | null) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, phone_whatsapp, bio, role, onboarding_step, organization_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);

  if (profile) {
    return profile;
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      email,
      role: 'admin',
      onboarding_step: 0,
    })
    .select('id, full_name, email, phone, phone_whatsapp, bio, role, onboarding_step, organization_id')
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || 'Failed to create profile');
  }

  return inserted;
}

async function getOrganization(organizationId: string | null) {
  if (!organizationId) return null;
  const { data: organizationWithTemplate, error: organizationWithTemplateError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug, logo_url, primary_color, itinerary_template')
    .eq('id', organizationId)
    .maybeSingle();

  if (!organizationWithTemplateError) {
    return organizationWithTemplate ?? null;
  }

  if (!isMissingColumnError(organizationWithTemplateError, 'itinerary_template')) {
    throw new Error(organizationWithTemplateError.message);
  }

  const { data: organizationWithoutTemplate, error: organizationWithoutTemplateError } =
    await supabaseAdmin
      .from('organizations')
      .select('id, name, slug, logo_url, primary_color')
      .eq('id', organizationId)
      .maybeSingle();

  if (organizationWithoutTemplateError) {
    throw new Error(organizationWithoutTemplateError.message);
  }

  return organizationWithoutTemplate
    ? {
        ...organizationWithoutTemplate,
        itinerary_template: 'safari_story',
      }
    : null;
}

async function getMarketplaceProfile(organizationId: string | null) {
  if (!organizationId) return null;
  const { data: marketplace } = await supabaseAdmin
    .from('marketplace_profiles')
    .select('organization_id, description, service_regions, specialties, verification_status, is_verified')
    .eq('organization_id', organizationId)
    .maybeSingle();
  return marketplace ?? null;
}

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if ('error' in auth) return auth.error;

    const profile = await ensureProfile(auth.user.id, auth.user.email || null);
    const organization = await getOrganization(profile.organization_id);
    const marketplace = await getMarketplaceProfile(profile.organization_id);

    const onboardingComplete =
      !!profile.organization_id && profile.role === 'admin' && Number(profile.onboarding_step || 0) >= 2;

    return NextResponse.json({
      onboardingComplete,
      profile: {
        full_name: profile.full_name || '',
        email: profile.email || auth.user.email || '',
        phone: profile.phone || '',
        phone_whatsapp: profile.phone_whatsapp || '',
        bio: profile.bio || '',
      },
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo_url: organization.logo_url,
            primary_color: organization.primary_color,
            itinerary_template: normalizeTemplate(organization.itinerary_template),
          }
        : null,
      marketplace: marketplace
        ? {
            description: marketplace.description || '',
            service_regions: Array.isArray(marketplace.service_regions)
              ? marketplace.service_regions
              : [],
            specialties: Array.isArray(marketplace.specialties) ? marketplace.specialties : [],
            verification_status: marketplace.verification_status || 'pending',
            is_verified: marketplace.is_verified === true,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if ('error' in auth) return auth.error;

    const body = await request.json();

    const operatorName = String(body.operatorName || '').trim();
    const companyName = String(body.companyName || '').trim();
    const phone = String(body.phone || '').trim();
    const whatsappPhone = String(body.whatsappPhone || '').trim();
    const bio = String(body.bio || '').trim();
    const marketplaceDescription = String(body.marketplaceDescription || '').trim();
    const logoUrl = String(body.logoUrl || '').trim();
    const primaryColor = String(body.primaryColor || '').trim();
    const itineraryTemplate = normalizeTemplate(body.itineraryTemplate);

    const serviceRegions = Array.isArray(body.serviceRegions)
      ? body.serviceRegions.map((value: unknown) => String(value).trim()).filter(Boolean)
      : [];
    const specialties = Array.isArray(body.specialties)
      ? body.specialties.map((value: unknown) => String(value).trim()).filter(Boolean)
      : [];

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const profile = await ensureProfile(auth.user.id, auth.user.email || null);

    let organizationId = profile.organization_id || null;
    let organizationSlug = '';

    if (organizationId) {
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id, slug')
        .eq('id', organizationId)
        .maybeSingle();

      if (!existingOrg) {
        organizationId = null;
      } else {
        organizationSlug = existingOrg.slug;
      }
    }

    const organizationBasePayload = {
      name: companyName,
      owner_id: auth.user.id,
      logo_url: logoUrl || null,
      primary_color: primaryColor || '#f26430',
    };

    if (!organizationId) {
      const baseSlug = slugify(companyName) || `agency-${auth.user.id.slice(0, 8)}`;
      const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

      const orgInsertPayload = {
        ...organizationBasePayload,
        slug: uniqueSlug,
        itinerary_template: itineraryTemplate,
      };

      let { data: insertedOrg, error: orgInsertError } = await supabaseAdmin
        .from('organizations')
        .insert(orgInsertPayload)
        .select('id, slug')
        .single();

      if (orgInsertError && isMissingColumnError(orgInsertError, 'itinerary_template')) {
        const fallbackPayload = {
          ...organizationBasePayload,
          slug: uniqueSlug,
        };
        const fallbackResult = await supabaseAdmin
          .from('organizations')
          .insert(fallbackPayload)
          .select('id, slug')
          .single();
        insertedOrg = fallbackResult.data;
        orgInsertError = fallbackResult.error;
      }

      if (orgInsertError || !insertedOrg) {
        return NextResponse.json(
          { error: orgInsertError?.message || 'Failed to create organization' },
          { status: 400 }
        );
      }

      organizationId = insertedOrg.id;
      organizationSlug = insertedOrg.slug;
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization setup failed' }, { status: 500 });
    }

    const organizationUpdatePayload = {
      ...organizationBasePayload,
      itinerary_template: itineraryTemplate,
      slug: organizationSlug || undefined,
    };

    let { error: organizationUpdateError } = await supabaseAdmin
      .from('organizations')
      .update(organizationUpdatePayload)
      .eq('id', organizationId);

    if (organizationUpdateError && isMissingColumnError(organizationUpdateError, 'itinerary_template')) {
      const fallbackUpdatePayload = {
        ...organizationBasePayload,
        slug: organizationSlug || undefined,
      };
      const fallbackUpdateResult = await supabaseAdmin
        .from('organizations')
        .update(fallbackUpdatePayload)
        .eq('id', organizationId);
      organizationUpdateError = fallbackUpdateResult.error;
    }

    if (organizationUpdateError) {
      return NextResponse.json({ error: organizationUpdateError.message }, { status: 400 });
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: operatorName || profile.full_name || auth.user.email?.split('@')[0] || 'Operator',
        email: auth.user.email || profile.email || null,
        phone: phone || null,
        phone_whatsapp: whatsappPhone || null,
        bio: bio || null,
        role: 'admin',
        onboarding_step: 2,
        organization_id: organizationId,
      })
      .eq('id', auth.user.id);

    if (profileUpdateError) {
      return NextResponse.json({ error: profileUpdateError.message }, { status: 400 });
    }

    const { data: existingMarketplace } = await supabaseAdmin
      .from('marketplace_profiles')
      .select('organization_id, is_verified, verification_status')
      .eq('organization_id', organizationId)
      .maybeSingle();

    const { error: marketplaceError } = await supabaseAdmin
      .from('marketplace_profiles')
      .upsert(
        {
          organization_id: organizationId,
          description: marketplaceDescription || bio || null,
          service_regions: serviceRegions.length ? serviceRegions : null,
          specialties: specialties.length ? specialties : null,
          verification_status: existingMarketplace?.verification_status || 'pending',
          is_verified: existingMarketplace?.is_verified === true,
        },
        { onConflict: 'organization_id' }
      );

    if (marketplaceError) {
      return NextResponse.json({ error: marketplaceError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      onboardingComplete: true,
      organizationId,
      next: '/admin',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
