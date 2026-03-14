import React from 'react';
import { StyleSheet, Text } from '@react-pdf/renderer';
import type { ItineraryBranding } from '@/components/pdf/itinerary-types';
import type { Activity, Day, ItineraryResult } from '@/types/itinerary';

export const PAGE_SIZE = 'A4';

export interface TemplateRendererProps {
  itinerary: ItineraryResult;
  branding: ItineraryBranding;
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
