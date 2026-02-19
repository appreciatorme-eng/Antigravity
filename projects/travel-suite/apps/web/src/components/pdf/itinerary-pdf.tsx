"use client";

import type { ItineraryResult } from '@/types/itinerary';
import { createClient } from '@/lib/supabase/client';
import type { ItineraryBranding, ItineraryTemplateId } from './itinerary-types';
import {
  DEFAULT_ITINERARY_BRANDING,
  DEFAULT_ITINERARY_TEMPLATE,
  normalizeItineraryTemplateId,
} from './itinerary-types';

interface DownloadItineraryPdfParams {
  itinerary: ItineraryResult;
  template?: ItineraryTemplateId;
  fileName?: string;
  branding?: ItineraryBranding;
}

export interface ItineraryPdfPreferences {
  branding: ItineraryBranding;
  defaultTemplate: ItineraryTemplateId;
}

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9-_]+/g, '_');

const normalizeItinerary = (input: ItineraryResult): ItineraryResult => {
  const duration = input.duration_days || input.days?.length || 1;
  return {
    ...input,
    duration_days: duration,
    trip_title: input.trip_title || 'My Itinerary',
    destination: input.destination || 'Destination',
    summary: input.summary || input.description || 'Detailed itinerary enclosed.',
    days: input.days || [],
  };
};

const fetchImageForLocation = async (location: string): Promise<string | null> => {
  try {
    const response = await fetch(`/api/images?query=${encodeURIComponent(location)}`);
    if (!response.ok) return null;
    const payload = await response.json();
    return typeof payload?.url === 'string' ? payload.url : null;
  } catch {
    return null;
  }
};

const hydrateItineraryImages = async (itinerary: ItineraryResult): Promise<ItineraryResult> => {
  const clonedDays = itinerary.days.map((day) => ({
    ...day,
    activities: (day.activities || []).map((activity) => ({ ...activity })),
  }));

  const locationCandidates = Array.from(
    new Set(
      clonedDays
        .flatMap((day) => day.activities)
        .filter((activity) => !activity.image && activity.location)
        .map((activity) => activity.location.trim())
    )
  ).slice(0, 18);

  if (!locationCandidates.length) {
    return { ...itinerary, days: clonedDays };
  }

  const resolvedEntries = await Promise.all(
    locationCandidates.map(async (location) => ({
      location,
      image: await fetchImageForLocation(location),
    }))
  );

  const imageByLocation = new Map<string, string>();
  for (const entry of resolvedEntries) {
    if (entry.image) {
      imageByLocation.set(entry.location, entry.image);
    }
  }

  for (const day of clonedDays) {
    for (const activity of day.activities) {
      if (!activity.image && activity.location) {
        const fallbackImage = imageByLocation.get(activity.location.trim());
        if (fallbackImage) {
          activity.image = fallbackImage;
        }
      }
    }
  }

  return {
    ...itinerary,
    days: clonedDays,
  };
};

const stripActivityImages = (itinerary: ItineraryResult): ItineraryResult => ({
  ...itinerary,
  days: itinerary.days.map((day) => ({
    ...day,
    activities: (day.activities || []).map((activity) => ({
      ...activity,
      image: undefined,
    })),
  })),
});

const normalizeOrganizationRelation = (profile: any) => {
  const rawOrg = profile?.organizations;
  return Array.isArray(rawOrg) ? rawOrg[0] || null : rawOrg || null;
};

const isMissingColumnError = (error: unknown, column: string): boolean => {
  if (!error || typeof error !== 'object') return false;
  const record = error as { message?: string; details?: string; hint?: string };
  const blob = `${record.message || ''} ${record.details || ''} ${record.hint || ''}`.toLowerCase();
  const normalizedColumn = column.toLowerCase();
  return (
    blob.includes(`could not find the '${normalizedColumn}' column`) ||
    blob.includes(`column "${normalizedColumn}" does not exist`) ||
    (blob.includes(normalizedColumn) && blob.includes('schema cache'))
  );
};

export const fetchItineraryPdfPreferences = async (): Promise<ItineraryPdfPreferences> => {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        branding: DEFAULT_ITINERARY_BRANDING,
        defaultTemplate: DEFAULT_ITINERARY_TEMPLATE,
      };
    }

    let { data: profile, error } = await supabase
      .from('profiles')
      .select('email, phone, organization_id, organizations(name, logo_url, primary_color, itinerary_template)')
      .eq('id', user.id)
      .single();

    if (error && isMissingColumnError(error, 'itinerary_template')) {
      const fallbackResult = await supabase
        .from('profiles')
        .select('email, phone, organization_id, organizations(name, logo_url, primary_color)')
        .eq('id', user.id)
        .single();
      profile = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      throw error;
    }

    const organization = normalizeOrganizationRelation(profile);

    if (!organization) {
      return {
        branding: DEFAULT_ITINERARY_BRANDING,
        defaultTemplate: DEFAULT_ITINERARY_TEMPLATE,
      };
    }

    return {
      branding: {
        companyName: organization.name || DEFAULT_ITINERARY_BRANDING.companyName,
        logoUrl: organization.logo_url || null,
        primaryColor: organization.primary_color || DEFAULT_ITINERARY_BRANDING.primaryColor,
        contactEmail: (profile as any)?.email || null,
        contactPhone: (profile as any)?.phone || null,
      },
      defaultTemplate: normalizeItineraryTemplateId(organization.itinerary_template),
    };
  } catch {
    return {
      branding: DEFAULT_ITINERARY_BRANDING,
      defaultTemplate: DEFAULT_ITINERARY_TEMPLATE,
    };
  }
};

export const fetchItineraryBranding = async (): Promise<ItineraryBranding> => {
  const preferences = await fetchItineraryPdfPreferences();
  return preferences.branding;
};

export const downloadItineraryPdf = async ({
  itinerary,
  template,
  fileName,
  branding,
}: DownloadItineraryPdfParams): Promise<void> => {
  const { pdf } = await import('@react-pdf/renderer');
  const { default: ItineraryDocument } = await import('./ItineraryDocument');

  const preferences = await fetchItineraryPdfPreferences();
  const resolvedTemplate = template || preferences.defaultTemplate;

  const normalizedItinerary = normalizeItinerary(itinerary);
  const itineraryWithImages = await hydrateItineraryImages(normalizedItinerary);
  const resolvedBranding = {
    ...preferences.branding,
    ...(branding || {}),
  };

  let blob: Blob;
  try {
    blob = await pdf(
      <ItineraryDocument
        data={itineraryWithImages}
        template={resolvedTemplate}
        branding={resolvedBranding}
      />
    ).toBlob();
  } catch {
    blob = await pdf(
      <ItineraryDocument
        data={stripActivityImages(normalizedItinerary)}
        template={resolvedTemplate}
        branding={resolvedBranding}
      />
    ).toBlob();
  }

  const computedFileName =
    fileName || `${sanitizeFileName(normalizedItinerary.trip_title || 'itinerary')}_${resolvedTemplate}.pdf`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = computedFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
