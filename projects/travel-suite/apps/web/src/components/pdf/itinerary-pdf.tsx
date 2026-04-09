"use client";

import { authedFetch } from '@/lib/api/authed-fetch';
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
  branding?: Partial<ItineraryBranding>;
}

export interface ItineraryPdfPreferences {
  branding: ItineraryBranding;
  defaultTemplate: ItineraryTemplateId;
}

interface OrganizationPreferencesRow {
  name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  itinerary_template?: string | null;
}

interface ProfilePreferencesRow {
  email: string | null;
  phone: string | null;
  organization_id: string | null;
  organizations: OrganizationPreferencesRow | OrganizationPreferencesRow[] | null;
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

const normalizeOrganizationRelation = (profile: ProfilePreferencesRow | null): OrganizationPreferencesRow | null => {
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
    blob.includes(`column ${normalizedColumn} does not exist`) ||
    blob.includes(`column organizations.${normalizedColumn} does not exist`) ||
    (blob.includes('column') && blob.includes(normalizedColumn) && blob.includes('does not exist')) ||
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
        contactEmail: profile?.email || null,
        contactPhone: profile?.phone || null,
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

const getFileNameFromDisposition = (header: string | null): string | null => {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const simpleMatch = header.match(/filename="?([^"]+)"?/i);
  return simpleMatch?.[1] || null;
};

export const downloadItineraryPdf = async ({
  itinerary,
  template,
  fileName,
  branding,
}: DownloadItineraryPdfParams): Promise<void> => {
  const preferences = await fetchItineraryPdfPreferences();
  const resolvedTemplate = template || preferences.defaultTemplate;
  const normalizedItinerary = normalizeItinerary(itinerary);
  const resolvedBranding = {
    ...preferences.branding,
    ...(branding || {}),
  };
  const computedFileName =
    fileName || `${sanitizeFileName(normalizedItinerary.trip_title || 'itinerary')}_${resolvedTemplate}.pdf`;

  const response = await authedFetch('/api/itinerary/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itinerary: normalizedItinerary,
      template: resolvedTemplate,
      branding: resolvedBranding,
      fileName: computedFileName,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || 'Failed to generate itinerary PDF');
  }

  const renderer = response.headers.get('x-itinerary-pdf-renderer');
  if (renderer === 'legacy-react-pdf') {
    const rawError = response.headers.get('x-itinerary-pdf-error');
    const printError = rawError ? decodeURIComponent(rawError) : null;
    throw new Error(
      printError
        ? `The premium print PDF renderer failed: ${printError}`
        : 'The premium print PDF renderer is unavailable right now. The server fell back to the old export path.',
    );
  }

  const blob = await response.blob();
  const responseFileName = getFileNameFromDisposition(response.headers.get('content-disposition'));
  const finalFileName = responseFileName || computedFileName;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
