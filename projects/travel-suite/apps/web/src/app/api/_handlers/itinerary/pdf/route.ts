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
import { populateItineraryImages } from '@/lib/image-search';
import { logError } from '@/lib/observability/logger';
import { createClient } from '@/lib/supabase/server';
import type { ItineraryResult } from '@/types/itinerary';

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

async function fetchServerPdfPreferences() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      branding: DEFAULT_ITINERARY_BRANDING,
      defaultTemplate: DEFAULT_ITINERARY_TEMPLATE,
    };
  }

  const primaryResult = await supabase
    .from('profiles')
    .select('email, phone, organization_id, organizations(name, logo_url, primary_color, itinerary_template)')
    .eq('id', user.id)
    .single();

  let profile = primaryResult.data as ProfilePreferencesRow | null;
  let error = primaryResult.error;

  if (error && isMissingColumnError(error, 'itinerary_template')) {
    const fallbackResult = await supabase
      .from('profiles')
      .select('email, phone, organization_id, organizations(name, logo_url, primary_color)')
      .eq('id', user.id)
      .single();
    profile = fallbackResult.data as ProfilePreferencesRow | null;
    error = fallbackResult.error;
  }

  if (error) {
    throw error;
  }

  const organization = normalizeRelation(profile?.organizations || null);

  return {
    userId: user.id,
    branding: {
      companyName: organization?.name || DEFAULT_ITINERARY_BRANDING.companyName,
      logoUrl: organization?.logo_url || null,
      primaryColor: organization?.primary_color || DEFAULT_ITINERARY_BRANDING.primaryColor,
      contactEmail: profile?.email || null,
      contactPhone: profile?.phone || null,
    } satisfies ItineraryBranding,
    defaultTemplate: normalizeItineraryTemplateId(organization?.itinerary_template),
  };
}

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError('Invalid itinerary PDF payload', 400, {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }

    const preferences = await fetchServerPdfPreferences();
    if (!preferences.userId) {
      return apiError('Unauthorized', 401);
    }

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
    const enrichedItinerary = stripRepeatedPdfImages(imageReadyItinerary);

    const document = React.createElement(ItineraryDocument, {
      data: enrichedItinerary,
      template,
      branding,
    }) as unknown as React.ReactElement<DocumentProps>;

    let stream;
    try {
      stream = await renderToStream(document);
    } catch (error) {
      logError('Primary itinerary PDF render failed, retrying without activity images', error);
      const fallbackDocument = React.createElement(ItineraryDocument, {
        data: stripActivityImages(normalizedItinerary),
        template,
        branding,
      }) as unknown as React.ReactElement<DocumentProps>;
      stream = await renderToStream(fallbackDocument);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const fileName =
      parsed.data.fileName ||
      `${sanitizeFileName(normalizedItinerary.trip_title || 'itinerary')}_${template}.pdf`;

    return new NextResponse(Buffer.concat(chunks), {
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
