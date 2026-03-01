/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Activity, Day, ItineraryResult } from '@/types/itinerary';
import type { ItineraryBranding, ItineraryTemplateId } from '../itinerary-types';

interface ItineraryTemplatePagesProps {
  itinerary: ItineraryResult;
  branding: ItineraryBranding;
  template: ItineraryTemplateId;
}

const PAGE_SIZE = 'A4';

const chunk = <T,>(items: T[], size: number): T[][] => {
  if (!items.length) return [];
  const parts: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    parts.push(items.slice(i, i + size));
  }
  return parts;
};

interface DayActivityBlock {
  day: Day;
  activities: Activity[];
  blockIndex: number;
  totalBlocks: number;
  activityOffset: number;
}

const buildDayActivityBlocks = (days: Day[], activitiesPerBlock: number): DayActivityBlock[] => {
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

    const chunks = chunk(dayActivities, activitiesPerBlock);
    chunks.forEach((activityGroup, index) => {
      blocks.push({
        day,
        activities: activityGroup,
        blockIndex: index,
        totalBlocks: chunks.length,
        activityOffset: index * activitiesPerBlock,
      });
    });
  }

  return blocks;
};

const getAllActivities = (itinerary: ItineraryResult): Activity[] =>
  itinerary.days.flatMap((day) => day.activities || []);

const getCoverImage = (itinerary: ItineraryResult): string | null => {
  const withImages = getAllActivities(itinerary).find((activity) => activity.image);
  return withImages?.image || null;
};

const getDayHero = (day: Day): string | null => day.activities.find((activity) => activity.image)?.image || null;

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

const PageFooter = ({
  companyName,
}: {
  companyName: string;
}) => (
  <Text
    fixed
    style={footerStyles.footer}
    render={({ pageNumber, totalPages }) => `${companyName}  •  Page ${pageNumber} of ${totalPages}`}
  />
);

const safariStyles = StyleSheet.create({
  coverPage: {
    position: 'relative',
    backgroundColor: '#111827',
    color: '#ffffff',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  coverContent: {
    position: 'absolute',
    top: 46,
    left: 42,
    right: 42,
  },
  coverBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  coverCompany: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  coverLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
  },
  coverKicker: {
    fontSize: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  coverTitle: {
    fontSize: 48,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    lineHeight: 1.1,
  },
  coverDestination: {
    fontSize: 22,
    marginBottom: 8,
  },
  coverSummary: {
    fontSize: 12,
    lineHeight: 1.5,
    maxWidth: 420,
  },
  coverBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 40,
    paddingRight: 40,
    backgroundColor: '#111827',
  },
  coverBottomCell: {
    flex: 1,
  },
  coverBottomLabel: {
    fontSize: 10,
    color: '#d1d5db',
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 1,
  },
  coverBottomValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  page: {
    backgroundColor: '#f3f4f6',
    paddingTop: 38,
    paddingBottom: 34,
    paddingLeft: 32,
    paddingRight: 32,
  },
  storyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: 10,
  },
  highlightsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    minHeight: 80,
  },
  highlightCardLast: {
    marginRight: 0,
  },
  highlightLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 10,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  daysPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  daysHeaderTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginLeft: 12,
  },
  daysHeaderPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  daysHeaderPillText: {
    color: '#ffffff',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
  },
  dayBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  dayTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dayImage: {
    width: 140,
    height: 96,
    borderRadius: 8,
    marginRight: 12,
  },
  dayHeadingWrap: {
    flex: 1,
  },
  dayKicker: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 2,
  },
  dayContinuation: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.8,
  },
  dayTitle: {
    fontSize: 19,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  activityList: {
    marginTop: 10,
  },
  activityRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  activityIndex: {
    width: 16,
    fontSize: 10,
    color: '#6b7280',
  },
  activityTextWrap: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 11,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  activityMeta: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.3,
  },
  closingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    marginTop: 10,
  },
  closingTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  closingBody: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 1.7,
    marginBottom: 16,
  },
  closingContact: {
    fontSize: 12,
    color: '#111827',
    marginBottom: 6,
  },
  closingAccentLine: {
    height: 3,
    width: 120,
    borderRadius: 999,
    marginBottom: 14,
  },
});

const SafariStoryPages = ({
  itinerary,
  branding,
}: {
  itinerary: ItineraryResult;
  branding: ItineraryBranding;
}) => {
  const brandColor = branding.primaryColor || '#f26430';
  const days = itinerary.days || [];
  const dayBlocks = buildDayActivityBlocks(days, 5);
  const dayGroups = chunk(dayBlocks, 2);
  const coverImage = getCoverImage(itinerary);
  const allActivities = getAllActivities(itinerary);

  return (
    <>
      <Page size={PAGE_SIZE} style={safariStyles.coverPage}>
        {coverImage ? <Image src={coverImage} style={safariStyles.coverImage} /> : null}
        <View style={safariStyles.coverOverlay} />

        <View style={safariStyles.coverContent}>
          <View style={safariStyles.coverBrandRow}>
            <Text style={safariStyles.coverCompany}>{branding.companyName}</Text>
            {branding.logoUrl ? <Image src={branding.logoUrl} style={safariStyles.coverLogo} /> : null}
          </View>

          <Text style={safariStyles.coverKicker}>Curated Itinerary</Text>
          <Text style={safariStyles.coverTitle}>{itinerary.trip_title}</Text>
          {branding?.clientName && (
            <Text style={{ fontSize: 24, fontStyle: 'italic', marginBottom: 16, color: brandColor }}>
              A private expedition for {branding.clientName}
            </Text>
          )}
          <Text style={safariStyles.coverDestination}>{itinerary.destination}</Text>
          <Text style={safariStyles.coverSummary}>
            {itinerary.summary || 'A carefully sequenced itinerary built for an immersive, practical travel experience.'}
          </Text>
        </View>

        <View style={safariStyles.coverBottomBar}>
          <View style={safariStyles.coverBottomCell}>
            <Text style={safariStyles.coverBottomLabel}>Duration</Text>
            <Text style={safariStyles.coverBottomValue}>
              {itinerary.duration_days || days.length || 1} Days
            </Text>
          </View>
          <View style={safariStyles.coverBottomCell}>
            <Text style={safariStyles.coverBottomLabel}>Activities</Text>
            <Text style={safariStyles.coverBottomValue}>{allActivities.length}</Text>
          </View>
          <View style={safariStyles.coverBottomCell}>
            <Text style={safariStyles.coverBottomLabel}>Style</Text>
            <Text style={safariStyles.coverBottomValue}>{itinerary.budget || 'Custom'}</Text>
          </View>
        </View>
      </Page>

      <Page size={PAGE_SIZE} style={safariStyles.page}>
        <View style={safariStyles.storyCard}>
          <Text style={[safariStyles.pageTitle, { color: brandColor }]}>Trip Story</Text>
          <Text style={safariStyles.pageSubtitle}>
            {itinerary.description || itinerary.summary || 'Built around your preferences, this plan balances logistics, pace, and memorable moments.'}
          </Text>
          <Text style={safariStyles.pageSubtitle}>
            This template keeps the visual structure fixed while adapting page count and activity density automatically for shorter or longer trips.
          </Text>

          <View style={safariStyles.highlightsRow}>
            <View style={safariStyles.highlightCard}>
              <Text style={safariStyles.highlightLabel}>Destination</Text>
              <Text style={safariStyles.highlightValue}>{itinerary.destination}</Text>
              <Text style={safariStyles.highlightText}>Primary route anchor</Text>
            </View>
            <View style={safariStyles.highlightCard}>
              <Text style={safariStyles.highlightLabel}>Interests</Text>
              <Text style={safariStyles.highlightValue}>
                {itinerary.interests?.slice(0, 2).join(', ') || 'General'}
              </Text>
              <Text style={safariStyles.highlightText}>Preference-driven sequencing</Text>
            </View>
            <View style={[safariStyles.highlightCard, safariStyles.highlightCardLast]}>
              <Text style={safariStyles.highlightLabel}>Flow</Text>
              <Text style={safariStyles.highlightValue}>Day-by-day</Text>
              <Text style={safariStyles.highlightText}>Automatic pagination for length</Text>
            </View>
          </View>
        </View>

        <View style={safariStyles.storyCard}>
          <Text style={[safariStyles.pageTitle, { fontSize: 20, marginBottom: 8 }]}>What To Expect</Text>
          {(itinerary.tips && itinerary.tips.length > 0 ? itinerary.tips : [
            'Planned timing windows for each activity block.',
            'Location-aware sequencing to reduce unnecessary transfers.',
            'Consistent visual format for sharing with clients.',
          ]).slice(0, 6).map((tip, index) => (
            <Text key={`${tip}-${index}`} style={[safariStyles.pageSubtitle, { marginBottom: 4 }]}>
              • {tip}
            </Text>
          ))}
        </View>

        <PageFooter companyName={branding.companyName} />
      </Page>

      {dayGroups.map((group, groupIndex) => (
        <Page key={`safari-days-${groupIndex}`} size={PAGE_SIZE} style={safariStyles.page}>
          <View style={safariStyles.daysPageHeader}>
            <View style={[safariStyles.daysHeaderPill, { backgroundColor: brandColor }]}>
              <Text style={safariStyles.daysHeaderPillText}>Itinerary</Text>
            </View>
            <Text style={safariStyles.daysHeaderTitle}>
              Day Plan {group[0]?.day.day_number || 1} - {group[group.length - 1]?.day.day_number || 1}
            </Text>
          </View>

          {group.map((block) => {
            const hero = block.blockIndex === 0 ? getDayHero(block.day) : null;
            const isContinuation = block.blockIndex > 0;

            return (
              <View
                key={`safari-day-${block.day.day_number}-block-${block.blockIndex}`}
                style={safariStyles.dayBlock}
              >
                <View style={safariStyles.dayTopRow}>
                  {hero ? <Image src={hero} style={safariStyles.dayImage} /> : null}
                  <View style={safariStyles.dayHeadingWrap}>
                    <Text style={safariStyles.dayKicker}>Day {block.day.day_number}</Text>
                    {isContinuation ? (
                      <Text style={safariStyles.dayContinuation}>
                        Continued ({block.blockIndex + 1}/{block.totalBlocks})
                      </Text>
                    ) : null}
                    <Text style={[safariStyles.dayTitle, { color: brandColor }]}>{block.day.theme}</Text>
                    <Text style={safariStyles.activityMeta}>
                      {(block.day.activities || []).length} activities planned
                    </Text>
                  </View>
                </View>

                <View style={safariStyles.activityList}>
                  {block.activities.map((activity, index) => (
                    <View key={`${activity.title}-${index}`} style={safariStyles.activityRow}>
                      <Text style={safariStyles.activityIndex}>{block.activityOffset + index + 1}.</Text>
                      <View style={safariStyles.activityTextWrap}>
                        <Text style={safariStyles.activityTitle}>{activity.title}</Text>
                        <Text style={safariStyles.activityMeta}>
                          {activity.time ? `${activity.time}  •  ` : ''}
                          {activity.location || 'Location details in final itinerary'}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {block.activities.length === 0 ? (
                    <Text style={safariStyles.activityMeta}>Detailed activities will be confirmed closer to departure.</Text>
                  ) : null}
                </View>
              </View>
            );
          })}

          <PageFooter companyName={branding.companyName} />
        </Page>
      ))}

      <Page size={PAGE_SIZE} style={safariStyles.page}>
        <View style={safariStyles.closingCard}>
          <Text style={[safariStyles.closingTitle, { color: brandColor }]}>Ready To Share</Text>
          <View style={[safariStyles.closingAccentLine, { backgroundColor: brandColor }]} />
          <Text style={safariStyles.closingBody}>
            This proposal-ready itinerary can be shared as-is, or attached to your interactive proposal flow where clients can choose vehicle type and optional upgrades.
          </Text>
          <Text style={safariStyles.closingContact}>Operator: {branding.companyName}</Text>
          {branding.contactPhone ? <Text style={safariStyles.closingContact}>Phone: {branding.contactPhone}</Text> : null}
          {branding.contactEmail ? <Text style={safariStyles.closingContact}>Email: {branding.contactEmail}</Text> : null}
        </View>

        <PageFooter companyName={branding.companyName} />
      </Page>
    </>
  );
};

const urbanStyles = StyleSheet.create({
  page: {
    backgroundColor: '#f8fafc',
    paddingTop: 26,
    paddingBottom: 30,
    paddingLeft: 30,
    paddingRight: 30,
  },
  masthead: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 10,
    marginBottom: 14,
  },
  mastheadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  company: {
    fontSize: 12,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
  contacts: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'right',
    lineHeight: 1.4,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 8,
    marginLeft: 10,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 14,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 10,
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  heroTitle: {
    fontSize: 24,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  heroMeta: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
  },
  heroPrice: {
    fontSize: 22,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
  },
  heroPriceLabel: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 12,
    color: '#334155',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  daySection: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 9,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayHeading: {
    fontSize: 12,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
  },
  daySubheading: {
    fontSize: 10,
    color: '#475569',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  activityTitle: {
    fontSize: 10,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
    marginRight: 8,
  },
  privateBadge: {
    fontSize: 7,
    color: '#ffffff',
    backgroundColor: '#1d4ed8',
    borderRadius: 3,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 4,
    paddingRight: 4,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  activityMeta: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.35,
  },
  thumbnailRow: {
    flexDirection: 'row',
    marginTop: 5,
  },
  thumbnail: {
    width: 42,
    height: 32,
    borderRadius: 4,
    marginRight: 4,
  },
  closingPanel: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  closingTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  closingBody: {
    fontSize: 11,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 6,
    lineHeight: 1.5,
  },
  closingInfo: {
    fontSize: 10,
    textAlign: 'center',
    color: '#334155',
    lineHeight: 1.4,
  },
});

const UrbanBriefPages = ({
  itinerary,
  branding,
}: {
  itinerary: ItineraryResult;
  branding: ItineraryBranding;
}) => {
  const accent = branding.primaryColor || '#1d4ed8';
  const days = itinerary.days || [];
  const dayBlocks = buildDayActivityBlocks(days, 4);
  const dayGroups = chunk(dayBlocks, 3);
  const coverImage = getCoverImage(itinerary);
  const activityCount = getAllActivities(itinerary).length;

  return (
    <>
      <Page size={PAGE_SIZE} style={urbanStyles.page}>
        <View style={urbanStyles.masthead}>
          <View style={urbanStyles.mastheadRow}>
            <View style={{ flex: 1 }}>
              <Text style={urbanStyles.company}>{branding.companyName}</Text>
              <Text style={urbanStyles.contacts}>
                {branding.contactPhone ? `Phone: ${branding.contactPhone}` : 'Phone: available on request'}
                {'\n'}
                {branding.contactEmail || 'Email: support@travelsuite.app'}
              </Text>
            </View>
            {branding.logoUrl ? <Image src={branding.logoUrl} style={urbanStyles.logo} /> : null}
          </View>
        </View>

        <View style={urbanStyles.heroCard}>
          {coverImage ? <Image src={coverImage} style={urbanStyles.heroImage} /> : null}
          <View style={urbanStyles.heroTitleRow}>
            <View style={urbanStyles.heroTitleWrap}>
              <Text style={urbanStyles.heroTitle}>{itinerary.trip_title}</Text>
              <Text style={urbanStyles.heroMeta}>
                {itinerary.destination}
                {'\n'}
                {(itinerary.duration_days || days.length || 1).toString()} days • {activityCount.toString()} activities
              </Text>
            </View>
            <View>
              <Text style={urbanStyles.heroPriceLabel}>Template</Text>
              <Text style={[urbanStyles.heroPrice, { color: accent }]}>Brief</Text>
            </View>
          </View>
        </View>

        <Text style={urbanStyles.sectionTitle}>Overview</Text>
        <View style={[urbanStyles.activityCard, { marginBottom: 12 }]}>
          <Text style={urbanStyles.activityDescription}>
            {itinerary.summary || 'A fixed-format itinerary brief with dynamic day count and pricing-ready sections.'}
          </Text>
        </View>

        <Text style={urbanStyles.sectionTitle}>Inclusions Snapshot</Text>
        {(itinerary.interests && itinerary.interests.length > 0 ? itinerary.interests : ['Sightseeing', 'Transfers', 'Daily planning'])
          .slice(0, 6)
          .map((item, index) => (
            <View key={`${item}-${index}`} style={urbanStyles.activityCard}>
              <View style={urbanStyles.activityHeader}>
                <Text style={urbanStyles.activityTitle}>{item}</Text>
                <Text style={[urbanStyles.privateBadge, { backgroundColor: accent }]}>Included</Text>
              </View>
              <Text style={urbanStyles.activityDescription}>Configured by your operator for this itinerary package.</Text>
            </View>
          ))}

        <PageFooter companyName={branding.companyName} />
      </Page>

      {dayGroups.map((group, groupIndex) => (
        <Page key={`urban-days-${groupIndex}`} size={PAGE_SIZE} style={urbanStyles.page}>
          <Text style={[urbanStyles.sectionTitle, { color: accent }]}>Itinerary</Text>

          {group.map((block) => {
            const isContinuation = block.blockIndex > 0;

            return (
              <View
                key={`urban-day-${block.day.day_number}-block-${block.blockIndex}`}
                style={urbanStyles.daySection}
              >
                <View style={urbanStyles.dayHeaderRow}>
                  <View>
                    <Text style={urbanStyles.dayHeading}>Day {block.day.day_number}</Text>
                    <Text style={urbanStyles.daySubheading}>{block.day.theme}</Text>
                    {isContinuation ? (
                      <Text style={urbanStyles.daySubheading}>
                        Continued ({block.blockIndex + 1}/{block.totalBlocks})
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[urbanStyles.privateBadge, { backgroundColor: accent }]}>PRIVATE</Text>
                </View>

                {block.activities.map((activity, index) => {
                  const thumbnails = block.activities
                    .filter((candidate) => candidate.image)
                    .slice(index, index + 3);

                  return (
                    <View key={`${activity.title}-${index}`} style={urbanStyles.activityCard}>
                      <View style={urbanStyles.activityHeader}>
                        <Text style={urbanStyles.activityTitle}>{activity.title}</Text>
                        <Text style={[urbanStyles.privateBadge, { backgroundColor: accent }]}>Private</Text>
                      </View>
                      <Text style={urbanStyles.activityMeta}>
                        {activity.time ? `${activity.time} • ` : ''}
                        {activity.location || 'Location shared in final confirmation'}
                      </Text>
                      {activity.description ? (
                        <Text style={urbanStyles.activityDescription}>{activity.description}</Text>
                      ) : null}

                      {thumbnails.length > 0 ? (
                        <View style={urbanStyles.thumbnailRow}>
                          {thumbnails.map((thumb, thumbIndex) => (
                            <Image
                              key={`${activity.title}-thumb-${thumbIndex}`}
                              src={thumb.image as string}
                              style={urbanStyles.thumbnail}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}

                {block.activities.length === 0 ? (
                  <Text style={urbanStyles.daySubheading}>
                    Detailed activities for this day will be shared before departure.
                  </Text>
                ) : null}
              </View>
            );
          })}

          <PageFooter companyName={branding.companyName} />
        </Page>
      ))}

      <Page size={PAGE_SIZE} style={urbanStyles.page}>
        <View style={[urbanStyles.closingPanel, { borderTopColor: accent }]}>
          <Text style={[urbanStyles.closingTitle, { color: accent }]}>Thank You</Text>
          <Text style={urbanStyles.closingBody}>We look forward to hosting you.</Text>
          <Text style={urbanStyles.closingInfo}>{branding.companyName}</Text>
          {branding.contactPhone ? <Text style={urbanStyles.closingInfo}>{branding.contactPhone}</Text> : null}
          {branding.contactEmail ? <Text style={urbanStyles.closingInfo}>{branding.contactEmail}</Text> : null}
        </View>

        <PageFooter companyName={branding.companyName} />
      </Page>
    </>
  );
};

export const ItineraryTemplatePages: React.FC<ItineraryTemplatePagesProps> = ({
  itinerary,
  branding,
  template,
}) => {
  // Note: Professional template is imported as a complete Document
  // So we return null here and handle it separately in ItineraryDocument
  if (template === 'professional') {
    return null;
  }

  if (template === 'urban_brief') {
    return <UrbanBriefPages itinerary={itinerary} branding={branding} />;
  }

  return <SafariStoryPages itinerary={itinerary} branding={branding} />;
};
