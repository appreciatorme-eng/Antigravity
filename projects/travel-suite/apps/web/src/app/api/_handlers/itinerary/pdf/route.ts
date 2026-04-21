import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DEFAULT_ITINERARY_BRANDING,
  DEFAULT_ITINERARY_TEMPLATE,
  normalizeItineraryTemplateId,
  type ItineraryBranding,
  type ItineraryPrintExtras,
} from '@/components/pdf/itinerary-types';
import { apiError } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/admin';
import { logError } from '@/lib/observability/logger';
import {
  normalizeServerPdfBranding,
  normalizeServerPdfItinerary,
  renderItineraryPdfBuffer,
} from '@/lib/pdf/itinerary-pdf-server';
import type { ItineraryResult } from '@/types/itinerary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const brandingSchema = z.object({
  companyName: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
});

const printExtrasSchema = z.object({
  dayAccommodations: z.array(z.object({
    dayNumber: z.number().int().positive(),
    hotelName: z.string().min(1),
    starRating: z.number().nullable().optional(),
    roomType: z.string().nullable().optional(),
    amenities: z.array(z.string()).nullable().optional(),
    imageUrl: z.string().nullable().optional(),
  })).optional(),
  selectedAddOns: z.array(z.object({
    name: z.string().min(1),
    category: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    unitPrice: z.number().nullable().optional(),
    quantity: z.number().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
  })).optional(),
});

const bodySchema = z.object({
  itinerary: z.custom<ItineraryResult>((value) => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return Array.isArray(record.days) && typeof record.trip_title === 'string';
  }, 'Invalid itinerary payload'),
  template: z.string().optional(),
  branding: brandingSchema.partial().optional(),
  printExtras: printExtrasSchema.optional(),
  fileName: z.string().optional(),
});

type OrganizationPreferencesRow = {
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  itinerary_template?: string | null;
  billing_address?: unknown;
};

type ProfilePreferencesRow = {
  email: string | null;
  phone: string | null;
  organization_id: string | null;
  organizations: OrganizationPreferencesRow | OrganizationPreferencesRow[] | null;
};

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9-_]+/g, '_');

const resolveCompanyName = (
  organizationName: string | null | undefined,
  email: string | null | undefined,
): string => {
  const trimmedOrg = organizationName?.trim();
  if (trimmedOrg && trimmedOrg.toLowerCase() !== 'tripbuilt') return trimmedOrg;
  const emailLocal = email?.split('@')[0]?.trim();
  if (emailLocal) {
    return (
      emailLocal.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' Travel'
    );
  }
  return 'Your Journey Curator';
};

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
};

const getBillingContact = (billingAddress: unknown): { email: string | null; phone: string | null } => {
  if (!billingAddress || typeof billingAddress !== 'object' || Array.isArray(billingAddress)) {
    return { email: null, phone: null };
  }
  const record = billingAddress as Record<string, unknown>;
  return {
    email: typeof record.email === 'string' && record.email.trim() ? record.email.trim() : null,
    phone: typeof record.phone === 'string' && record.phone.trim() ? record.phone.trim() : null,
  };
};

const isMissingColumnError = (error: unknown, column: string): boolean => {
  if (!error || typeof error !== 'object') return false;
  const record = error as { message?: string; details?: string; hint?: string };
  const blob = `${record.message || ''} ${record.details || ''} ${record.hint || ''}`.toLowerCase();
  const normalizedColumn = column.toLowerCase();
  return (
    blob.includes(`could not find the '${normalizedColumn}' column`) ||
    blob.includes(`column "${normalizedColumn}" does not exist`) ||
    blob.includes(`column ${normalizedColumn} does not exist`) ||
    blob.includes(`column organizations.${normalizedColumn} does not exist`) ||
    (blob.includes('column') && blob.includes(normalizedColumn) && blob.includes('does not exist')) ||
    (blob.includes(normalizedColumn) && blob.includes('schema cache'))
  );
};

async function fetchServerPdfPreferences(userId: string, adminClient: unknown) {
  try {
    const supabase = adminClient as {
      from: (table: string) => {
        select: (query: string) => {
          eq: (column: string, value: string) => {
            single: () => Promise<{ data: unknown; error: unknown }>;
          };
        };
      };
    };
    const primaryResult = await supabase
      .from('profiles')
      .select('email, phone, organization_id, organizations!profiles_organization_id_fkey(name, logo_url, primary_color, itinerary_template, billing_address)')
      .eq('id', userId)
      .single();

    let profile = primaryResult.data as ProfilePreferencesRow | null;
    let error = primaryResult.error;

    if (error && isMissingColumnError(error, 'itinerary_template')) {
      const fallbackResult = await supabase
        .from('profiles')
        .select('email, phone, organization_id, organizations!profiles_organization_id_fkey(name, logo_url, primary_color, billing_address)')
        .eq('id', userId)
        .single();
      profile = fallbackResult.data as ProfilePreferencesRow | null;
      error = fallbackResult.error;
    }

    if (error) {
      throw error;
    }

    const organization = normalizeRelation(profile?.organizations || null);
    const billingContact = getBillingContact(organization?.billing_address);

    return {
      branding: {
        companyName: resolveCompanyName(organization?.name, profile?.email),
        logoUrl: organization?.logo_url || null,
        primaryColor: organization?.primary_color || DEFAULT_ITINERARY_BRANDING.primaryColor,
        contactEmail: billingContact.email || profile?.email || null,
        contactPhone: billingContact.phone || profile?.phone || null,
      } satisfies ItineraryBranding,
      defaultTemplate: normalizeItineraryTemplateId(organization?.itinerary_template),
    };
  } catch (error) {
    logError('Falling back to default itinerary PDF branding', error);
    return {
      branding: DEFAULT_ITINERARY_BRANDING,
      defaultTemplate: DEFAULT_ITINERARY_TEMPLATE,
    };
  }
}

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError('Invalid itinerary PDF payload', 400, {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }

    const admin = await requireAdmin(request, { requireOrganization: false });
    if (!admin.ok) {
      return admin.response;
    }
    const preferences = await fetchServerPdfPreferences(admin.userId, admin.adminClient);

    const template = normalizeItineraryTemplateId(parsed.data.template ?? preferences.defaultTemplate);
    const branding = normalizeServerPdfBranding({
      ...preferences.branding,
      ...(parsed.data.branding || {}),
    }, preferences.branding);
    const printExtras = parsed.data.printExtras as ItineraryPrintExtras | undefined;
    const normalizedItinerary = normalizeServerPdfItinerary(parsed.data.itinerary);

    const fileName =
      parsed.data.fileName ||
      `${sanitizeFileName(normalizedItinerary.trip_title || 'itinerary')}_${template}.pdf`;
    const pdf = await renderItineraryPdfBuffer({
      itinerary: normalizedItinerary,
      requestUrl: request.url,
      branding,
      template,
      printExtras,
      fileName,
    });

    return new NextResponse(new Uint8Array(pdf.buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdf.fileName}"`,
        'X-Itinerary-PDF-Renderer': pdf.renderer,
        ...(pdf.printErrorMessage
          ? { 'X-Itinerary-PDF-Error': encodeURIComponent(pdf.printErrorMessage).slice(0, 240) }
          : {}),
      },
    });
  } catch (error) {
    logError('Error in POST /api/itinerary/pdf', error);
    return apiError('Failed to generate itinerary PDF', 500);
  }
}
