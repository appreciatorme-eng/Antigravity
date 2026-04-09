import React from 'react';
import { StyleSheet, Text } from '@react-pdf/renderer';
import {
  ITINERARY_PRINT_TEMPLATE_META,
  type ItineraryBranding,
  type ItineraryTemplateId,
} from '@/components/pdf/itinerary-types';
import type { Activity, Day, ItineraryResult } from '@/types/itinerary';

export const PAGE_SIZE = 'A4';

export interface TemplateRendererProps {
  itinerary: ItineraryResult;
  branding: ItineraryBranding;
  template?: ItineraryTemplateId;
}

const chunk = <T,>(items: T[], size: number): T[][] => {
  if (!items.length) return [];
  const parts: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    parts.push(items.slice(i, i + size));
  }
  return parts;
};

export interface DayActivityBlock {
  day: Day;
  activities: Activity[];
  blockIndex: number;
  totalBlocks: number;
  activityOffset: number;
}

export const buildDayActivityBlocks = (days: Day[], activitiesPerBlock: number): DayActivityBlock[] => {
  const blocks: DayActivityBlock[] = [];

  for (const day of days) {
    const dayActivities = day.activities || [];
    if (dayActivities.length === 0) {
      blocks.push({
        day,
        activities: [],
        blockIndex: 0,
        totalBlocks: 1,
        activityOffset: 0,
      });
      continue;
    }

    const activityChunks = chunk(dayActivities, activitiesPerBlock);
    activityChunks.forEach((activityGroup, index) => {
      blocks.push({
        day,
        activities: activityGroup,
        blockIndex: index,
        totalBlocks: activityChunks.length,
        activityOffset: index * activitiesPerBlock,
      });
    });
  }

  return blocks;
};

export const chunkDayBlocks = (blocks: DayActivityBlock[], size: number): DayActivityBlock[][] => chunk(blocks, size);

export const getAllActivities = (itinerary: ItineraryResult): Activity[] =>
  itinerary.days.flatMap((day) => day.activities || []);

export type PdfDensityProfile = 'short' | 'standard' | 'extended';

export const getPdfDensityProfile = (itinerary: ItineraryResult): PdfDensityProfile => {
  const activityCount = getAllActivities(itinerary).length;
  const dayCount = itinerary.days?.length || itinerary.duration_days || 0;

  if (dayCount >= 7 || activityCount >= 28) {
    return 'extended';
  }

  if (dayCount <= 3 && activityCount <= 12) {
    return 'short';
  }

  return 'standard';
};

export const getPdfTemplateMeta = (template: ItineraryTemplateId = 'safari_story') =>
  ITINERARY_PRINT_TEMPLATE_META[template];

export const getActivitiesPerBlock = (
  itinerary: ItineraryResult,
  family: 'safari_story' | 'urban_brief' | 'professional',
): number => {
  const density = getPdfDensityProfile(itinerary);
  if (family === 'professional') {
    return density === 'extended' ? 5 : density === 'short' ? 3 : 4;
  }
  if (family === 'urban_brief') {
    return density === 'extended' ? 5 : density === 'short' ? 3 : 4;
  }
  return density === 'extended' ? 6 : density === 'short' ? 4 : 5;
};

export const getBlocksPerPage = (
  itinerary: ItineraryResult,
  family: 'safari_story' | 'urban_brief' | 'professional',
): number => {
  const density = getPdfDensityProfile(itinerary);
  if (family === 'professional') {
    return density === 'extended' ? 1 : 2;
  }
  if (family === 'urban_brief') {
    return density === 'extended' ? 4 : density === 'short' ? 2 : 3;
  }
  return density === 'extended' ? 3 : 2;
};

const normalizeImageKey = (url: string): string => url.split('?')[0]?.trim().toLowerCase();

export const stripRepeatedPdfImages = (itinerary: ItineraryResult): ItineraryResult => {
  const imageCounts = new Map<string, number>();
  for (const activity of getAllActivities(itinerary)) {
    const image = activity.image || activity.imageUrl;
    if (!image) continue;
    const key = normalizeImageKey(image);
    if (!key) continue;
    imageCounts.set(key, (imageCounts.get(key) ?? 0) + 1);
  }

  const density = getPdfDensityProfile(itinerary);

  return {
    ...itinerary,
    days: itinerary.days.map((day) => {
      let retainedForDay = 0;
      return {
        ...day,
        activities: (day.activities || []).map((activity) => {
          const image = activity.image || activity.imageUrl;
          if (!image) return activity;

          const key = normalizeImageKey(image);
          const repeated = key ? (imageCounts.get(key) ?? 0) > 1 : false;
          const confidence = activity.image_confidence ?? 'low';
          const isLowConfidence = confidence !== 'high';
          const shouldCompact = density === 'extended' && retainedForDay >= 1 && isLowConfidence;
          const shouldDropDuplicate = repeated && retainedForDay >= 1 && isLowConfidence;

          if (shouldCompact || shouldDropDuplicate) {
            return {
              ...activity,
              image: undefined,
              imageUrl: undefined,
            };
          }

          retainedForDay += 1;
          return activity;
        }),
      };
    }),
  };
};

export const getCoverImage = (itinerary: ItineraryResult): string | null => {
  const withImages = getAllActivities(itinerary).find((activity) => activity.image);
  return withImages?.image || null;
};

export const getDayHero = (day: Day): string | null =>
  day.activities.find((activity) => activity.image)?.image || null;

const footerStyles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 6,
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
  },
});

export const PageFooter = ({ companyName }: { companyName: string }) => (
  <Text
    fixed
    style={footerStyles.footer}
    render={({ pageNumber, totalPages }) => `${companyName}  •  Page ${pageNumber} of ${totalPages}`}
  />
);
