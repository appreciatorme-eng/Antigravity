import sharp from 'sharp';
import type { Activity, Day, ItineraryResult } from '@/types/itinerary';
import type { ItineraryBranding, ItineraryTemplateId } from '@/components/pdf/itinerary-types';

export type ItineraryPrintDensity = 'immersive' | 'balanced' | 'dense';

export interface PreparedPrintActivity extends Activity {
  printImage?: string | null;
  printImageVariant: 'feature' | 'supporting' | 'none';
  repeatedImage: boolean;
}

export interface PreparedPrintDay extends Omit<Day, 'activities'> {
  dayHeroImage?: string | null;
  activities: PreparedPrintActivity[];
}

export interface PreparedPrintItinerary extends Omit<ItineraryResult, 'days'> {
  days: PreparedPrintDay[];
}

export interface PreparedPrintBranding extends ItineraryBranding {
  logoDataUrl?: string | null;
}

export interface PreparedPrintPayload {
  itinerary: PreparedPrintItinerary;
  branding: PreparedPrintBranding;
  template: ItineraryTemplateId;
  density: ItineraryPrintDensity;
  coverImage?: string | null;
  imageStats: {
    uniqueActivityImages: number;
    repeatedImagesRemoved: number;
  };
}

const normalizeImageKey = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    if (trimmed.startsWith('data:')) return trimmed.slice(0, 80);
    const url = new URL(trimmed);
    return `${url.origin}${url.pathname}`.toLowerCase();
  } catch {
    return trimmed.split('?')[0].toLowerCase();
  }
};

const resolveAbsoluteUrl = (rawUrl: string, baseUrl: string) => {
  if (!rawUrl) return null;
  if (rawUrl.startsWith('data:')) return rawUrl;
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  if (rawUrl.startsWith('/')) return `${baseUrl}${rawUrl}`;
  return null;
};

const getTotalActivities = (itinerary: ItineraryResult) =>
  itinerary.days.reduce((count, day) => count + (day.activities?.length || 0), 0);

export const resolvePrintDensity = (itinerary: ItineraryResult): ItineraryPrintDensity => {
  const dayCount = itinerary.days?.length || itinerary.duration_days || 0;
  const activityCount = getTotalActivities(itinerary);

  if (dayCount >= 7 || activityCount >= 30) return 'dense';
  if (dayCount <= 3 && activityCount <= 12) return 'immersive';
  return 'balanced';
};

const imageTargetWidth = (variant: 'cover' | 'feature' | 'supporting' | 'logo') => {
  switch (variant) {
    case 'cover':
      return 1800;
    case 'feature':
      return 1100;
    case 'supporting':
      return 720;
    case 'logo':
      return 320;
  }
};

const toDataUrl = (buffer: Buffer, mime: string) => `data:${mime};base64,${buffer.toString('base64')}`;

const processImage = async (
  inputUrl: string,
  baseUrl: string,
  variant: 'cover' | 'feature' | 'supporting' | 'logo',
): Promise<string | null> => {
  const resolved = resolveAbsoluteUrl(inputUrl, baseUrl);
  if (!resolved) return null;
  if (resolved.startsWith('data:')) return resolved;

  const response = await fetch(resolved, {
    headers: resolved.includes('wikipedia.org') ? { 'User-Agent': 'TripBuilt PDF Renderer/1.0' } : undefined,
    cache: 'force-cache',
  }).catch(() => null);

  if (!response?.ok) return null;

  const contentType = response.headers.get('content-type') || '';
  const arrayBuffer = await response.arrayBuffer();
  const sourceBuffer = Buffer.from(arrayBuffer);
  const targetWidth = imageTargetWidth(variant);

  try {
    if (variant === 'logo') {
      const output = await sharp(sourceBuffer, { density: 180 })
        .resize({ width: targetWidth, fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
      return toDataUrl(output, 'image/png');
    }

    const output = await sharp(sourceBuffer, { density: 180 })
      .rotate()
      .resize({ width: targetWidth, withoutEnlargement: true })
      .jpeg({ quality: variant === 'cover' ? 74 : 68, mozjpeg: true, progressive: true })
      .toBuffer();
    return toDataUrl(output, 'image/jpeg');
  } catch {
    if (contentType.startsWith('image/')) {
      return toDataUrl(sourceBuffer, contentType);
    }
    return null;
  }
};

const chooseCoverSource = (itinerary: ItineraryResult): string | null => {
  for (const day of itinerary.days || []) {
    for (const activity of day.activities || []) {
      const candidate = activity.image || activity.imageUrl;
      if (!candidate) continue;
      if ((activity.image_confidence || 'low') === 'high') return candidate;
    }
  }

  for (const day of itinerary.days || []) {
    for (const activity of day.activities || []) {
      const candidate = activity.image || activity.imageUrl;
      if (candidate) return candidate;
    }
  }

  return null;
};

const featureSlotsPerDay = (density: ItineraryPrintDensity) => {
  if (density === 'immersive') return 3;
  if (density === 'balanced') return 2;
  return 1;
};

export const prepareItineraryPrintPayload = async (
  itinerary: ItineraryResult,
  branding: ItineraryBranding,
  template: ItineraryTemplateId,
  baseUrl: string,
): Promise<PreparedPrintPayload> => {
  const density = resolvePrintDensity(itinerary);
  const assetCache = new Map<string, Promise<string | null>>();
  const repetitionCounts = new Map<string, number>();

  for (const day of itinerary.days || []) {
    for (const activity of day.activities || []) {
      const candidate = activity.image || activity.imageUrl;
      if (!candidate) continue;
      const key = normalizeImageKey(candidate);
      if (!key) continue;
      repetitionCounts.set(key, (repetitionCounts.get(key) || 0) + 1);
    }
  }

  const getCachedAsset = (rawUrl: string, variant: 'cover' | 'feature' | 'supporting' | 'logo') => {
    const cacheKey = `${variant}:${normalizeImageKey(rawUrl)}`;
    if (!assetCache.has(cacheKey)) {
      assetCache.set(cacheKey, processImage(rawUrl, baseUrl, variant));
    }
    return assetCache.get(cacheKey)!;
  };

  const coverSource = chooseCoverSource(itinerary);
  const coverImage = coverSource ? await getCachedAsset(coverSource, 'cover') : null;
  const logoDataUrl = branding.logoUrl ? await getCachedAsset(branding.logoUrl, 'logo') : null;

  const seenImageKeys = new Set<string>();
  let repeatedImagesRemoved = 0;
  let uniqueActivityImages = 0;

  const preparedDays: PreparedPrintDay[] = await Promise.all(
    (itinerary.days || []).map(async (day) => {
      let slotsUsed = 0;
      let dayHeroImage: string | null = null;

      const preparedActivities: PreparedPrintActivity[] = await Promise.all(
        (day.activities || []).map(async (activity) => {
          const candidate = activity.image || activity.imageUrl;
          if (!candidate) {
            return {
              ...activity,
              printImage: null,
              printImageVariant: 'none' as const,
              repeatedImage: false,
            };
          }

          const imageKey = normalizeImageKey(candidate);
          const repeated = repetitionCounts.get(imageKey)! > 1 && seenImageKeys.has(imageKey);
          const confidence = activity.image_confidence || 'low';
          const suppressForDensity = density === 'dense' && slotsUsed >= featureSlotsPerDay(density);
          const suppressLowConfidence = confidence === 'low' && slotsUsed >= 1;
          const shouldHide = repeated || suppressForDensity || suppressLowConfidence;

          if (shouldHide) {
            if (repeated) repeatedImagesRemoved += 1;
            return {
              ...activity,
              printImage: null,
              printImageVariant: 'none' as const,
              repeatedImage: repeated,
            };
          }

          const imageVariant = slotsUsed === 0 ? 'feature' : 'supporting';
          const processed = await getCachedAsset(candidate, imageVariant);
          if (!processed) {
            return {
              ...activity,
              printImage: null,
              printImageVariant: 'none' as const,
              repeatedImage: false,
            };
          }

          seenImageKeys.add(imageKey);
          slotsUsed += 1;
          uniqueActivityImages += 1;
          if (!dayHeroImage) {
            dayHeroImage = processed;
          }

          return {
            ...activity,
            printImage: processed,
            printImageVariant: imageVariant,
            repeatedImage: false,
          };
        }),
      );

      return {
        ...day,
        dayHeroImage,
        activities: preparedActivities,
      };
    }),
  );

  return {
    itinerary: {
      ...itinerary,
      days: preparedDays,
    },
    branding: {
      ...branding,
      logoDataUrl,
    },
    template,
    density,
    coverImage,
    imageStats: {
      uniqueActivityImages,
      repeatedImagesRemoved,
    },
  };
};
