import React from 'react';
import { NextResponse } from 'next/server';
import { renderToStream, type DocumentProps } from '@react-pdf/renderer';
import { z } from 'zod';
import ItineraryDocument from '@/components/pdf/ItineraryDocument';
import {
  DEFAULT_ITINERARY_BRANDING,
  DEFAULT_ITINERARY_TEMPLATE,
  normalizeItineraryTemplateId,
  type ItineraryBranding,
} from '@/components/pdf/itinerary-types';
import { stripRepeatedPdfImages } from '@/components/pdf/templates/sections/shared';
import { apiError } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/admin';
import { populateItineraryImages } from '@/lib/image-search';
import { logError } from '@/lib/observability/logger';
import { prepareItineraryPrintPayload } from '@/lib/pdf/itinerary-print/assets';
import { launchItineraryPdfBrowser } from '@/lib/pdf/itinerary-print/browser';
import { renderItineraryPrintHtml } from '@/lib/pdf/itinerary-print/document';
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

const bodySchema = z.object({
  itinerary: z.custom<ItineraryResult>((value) => {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    return Array.isArray(record.days) && typeof record.trip_title === 'string';
  }, 'Invalid itinerary payload'),
  template: z.string().optional(),
  branding: brandingSchema.partial().optional(),
  fileName: z.string().optional(),
});

type OrganizationPreferencesRow = {
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  itinerary_template?: string | null;
};

type ProfilePreferencesRow = {
  email: string | null;
  phone: string | null;
  organization_id: string | null;
  organizations: OrganizationPreferencesRow | OrganizationPreferencesRow[] | null;
};

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9-_]+/g, '_');

const normalizeRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
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

const normalizeItinerary = (input: ItineraryResult): ItineraryResult => {
  const duration = input.duration_days || input.days?.length || 1;
  return {
    ...input,
    duration_days: duration,
    trip_title: input.trip_title || input.title || 'My Itinerary',
    destination: input.destination || 'Destination',
    summary: input.summary || input.description || 'Detailed itinerary enclosed.',
    days: input.days || [],
  };
};

const stripActivityImages = (itinerary: ItineraryResult): ItineraryResult => ({
  ...itinerary,
  days: itinerary.days.map((day) => ({
    ...day,
    activities: (day.activities || []).map((activity) => ({
      ...activity,
      image: undefined,
      imageUrl: undefined,
    })),
  })),
});

const stripAllPdfImages = (
  itinerary: ItineraryResult,
  branding: ItineraryBranding,
): { itinerary: ItineraryResult; branding: ItineraryBranding } => ({
  itinerary: stripActivityImages(itinerary),
  branding: {
    ...branding,
    logoUrl: null,
  },
});

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
      .select('email, phone, organization_id, organizations(name, logo_url, primary_color, itinerary_template)')
      .eq('id', userId)
      .single();

    let profile = primaryResult.data as ProfilePreferencesRow | null;
    let error = primaryResult.error;

    if (error && isMissingColumnError(error, 'itinerary_template')) {
      const fallbackResult = await supabase
        .from('profiles')
        .select('email, phone, organization_id, organizations(name, logo_url, primary_color)')
        .eq('id', userId)
        .single();
      profile = fallbackResult.data as ProfilePreferencesRow | null;
      error = fallbackResult.error;
    }

    if (error) {
      throw error;
    }

    const organization = normalizeRelation(profile?.organizations || null);

    return {
      branding: {
        companyName: organization?.name || DEFAULT_ITINERARY_BRANDING.companyName,
        logoUrl: organization?.logo_url || null,
        primaryColor: organization?.primary_color || DEFAULT_ITINERARY_BRANDING.primaryColor,
        contactEmail: profile?.email || null,
        contactPhone: profile?.phone || null,
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

const renderLegacyPdfBuffer = async (
  itinerary: ItineraryResult,
  template: ReturnType<typeof normalizeItineraryTemplateId>,
  branding: ItineraryBranding,
) => {
  const enrichedItinerary = stripRepeatedPdfImages(itinerary);

  const document = React.createElement(ItineraryDocument, {
    data: enrichedItinerary,
    template,
    branding,
  }) as unknown as React.ReactElement<DocumentProps>;

  let stream;
  try {
    stream = await renderToStream(document);
  } catch (error) {
    logError('Primary legacy itinerary PDF render failed, retrying without activity images', error);
    try {
      const fallbackDocument = React.createElement(ItineraryDocument, {
        data: stripActivityImages(itinerary),
        template,
        branding,
      }) as unknown as React.ReactElement<DocumentProps>;
      stream = await renderToStream(fallbackDocument);
    } catch (secondaryError) {
      logError('Secondary legacy itinerary PDF render failed, retrying without remote images', secondaryError);
      const stripped = stripAllPdfImages(itinerary, branding);
      const finalDocument = React.createElement(ItineraryDocument, {
        data: stripped.itinerary,
        template,
        branding: stripped.branding,
      }) as unknown as React.ReactElement<DocumentProps>;
      stream = await renderToStream(finalDocument);
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

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
    const branding = {
      ...preferences.branding,
      ...(parsed.data.branding || {}),
    };
    const normalizedItinerary = normalizeItinerary(parsed.data.itinerary);
    const imageReadyItinerary = await populateItineraryImages(
      normalizedItinerary as unknown as Parameters<typeof populateItineraryImages>[0],
      {
        refreshAutoGenerated: true,
      },
    ) as unknown as ItineraryResult;

    const fileName =
      parsed.data.fileName ||
      `${sanitizeFileName(normalizedItinerary.trip_title || 'itinerary')}_${template}.pdf`;

    try {
      const origin = new URL(request.url).origin;
      const prepared = await prepareItineraryPrintPayload(imageReadyItinerary, branding, template, origin);
      const html = renderItineraryPrintHtml(prepared);
      const browser = await launchItineraryPdfBrowser();

      try {
        const page = await browser.newPage({
          deviceScaleFactor: 1,
          colorScheme: template === 'luxury_resort' ? 'dark' : 'light',
        });
        await page.emulateMedia({ media: 'print' });
        await page.setContent(html, { waitUntil: 'networkidle' });

        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
          margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });

        await page.close();

        return new NextResponse(new Uint8Array(pdf), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      } finally {
        await browser.close();
      }
    } catch (printError) {
      logError('HTML itinerary PDF render failed, falling back to legacy renderer', printError);
    }

    const legacyPdf = await renderLegacyPdfBuffer(imageReadyItinerary, template, branding);

    return new NextResponse(new Uint8Array(legacyPdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    logError('Error in POST /api/itinerary/pdf', error);
    return apiError('Failed to generate itinerary PDF', 500);
  }
}
