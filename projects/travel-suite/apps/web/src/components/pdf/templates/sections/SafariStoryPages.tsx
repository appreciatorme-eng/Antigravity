/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Image, Page, Text, View } from '@react-pdf/renderer';
import { PageFooter, PAGE_SIZE, TemplateRendererProps, buildDayActivityBlocks, chunkDayBlocks, getAllActivities, getCoverImage, getDayHero } from './shared';
import { safariStyles } from './safariStyles';

const SafariStoryCoverPage = ({ itinerary, branding, brandColor, coverImage, activityCount, dayCount }: TemplateRendererProps & {
  brandColor: string;
  coverImage: string | null;
  activityCount: number;
  dayCount: number;
}) => (
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
      {branding.clientName ? (
        <Text style={{ fontSize: 24, fontStyle: 'italic', marginBottom: 16, color: brandColor }}>
          A private expedition for {branding.clientName}
        </Text>
      ) : null}
      <Text style={safariStyles.coverDestination}>{itinerary.destination}</Text>
      <Text style={safariStyles.coverSummary}>
        {itinerary.summary || 'A carefully sequenced itinerary built for an immersive, practical travel experience.'}
      </Text>
    </View>

    <View style={safariStyles.coverBottomBar}>
      <View style={safariStyles.coverBottomCell}>
        <Text style={safariStyles.coverBottomLabel}>Duration</Text>
        <Text style={safariStyles.coverBottomValue}>{itinerary.duration_days || dayCount || 1} Days</Text>
      </View>
      <View style={safariStyles.coverBottomCell}>
        <Text style={safariStyles.coverBottomLabel}>Activities</Text>
        <Text style={safariStyles.coverBottomValue}>{activityCount}</Text>
      </View>
      <View style={safariStyles.coverBottomCell}>
        <Text style={safariStyles.coverBottomLabel}>Style</Text>
        <Text style={safariStyles.coverBottomValue}>{itinerary.budget || 'Custom'}</Text>
      </View>
    </View>
  </Page>
);

const SafariStoryOverviewPage = ({ itinerary, branding, brandColor }: TemplateRendererProps & { brandColor: string }) => {
  const expectationTips = (itinerary.tips && itinerary.tips.length > 0
    ? itinerary.tips
    : [
        'Planned timing windows for each activity block.',
        'Location-aware sequencing to reduce unnecessary transfers.',
        'Consistent visual format for sharing with clients.',
      ]).slice(0, 6);

  return (
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
            <Text style={safariStyles.highlightValue}>{itinerary.interests?.slice(0, 2).join(', ') || 'General'}</Text>
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
        {expectationTips.map((tip, index) => (
          <Text key={`${tip}-${index}`} style={[safariStyles.pageSubtitle, { marginBottom: 4 }]}>
            • {tip}
          </Text>
        ))}
      </View>

      <PageFooter companyName={branding.companyName} />
    </Page>
  );
};

const SafariStoryDayPages = ({ itinerary, branding, brandColor }: TemplateRendererProps & { brandColor: string }) => {
  const dayGroups = chunkDayBlocks(buildDayActivityBlocks(itinerary.days || [], 5), 2);

  return (
    <>
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
              <View key={`safari-day-${block.day.day_number}-block-${block.blockIndex}`} style={safariStyles.dayBlock}>
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
                    <Text style={safariStyles.activityMeta}>{(block.day.activities || []).length} activities planned</Text>
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
    </>
  );
};

const SafariStoryClosingPage = ({ branding, brandColor }: TemplateRendererProps & { brandColor: string }) => (
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
);

export const SafariStoryPages = ({ itinerary, branding }: TemplateRendererProps) => {
  const brandColor = branding.primaryColor || '#f26430';

  return (
    <>
      <SafariStoryCoverPage
        itinerary={itinerary}
        branding={branding}
        brandColor={brandColor}
        coverImage={getCoverImage(itinerary)}
        activityCount={getAllActivities(itinerary).length}
        dayCount={(itinerary.days || []).length}
      />
      <SafariStoryOverviewPage itinerary={itinerary} branding={branding} brandColor={brandColor} />
      <SafariStoryDayPages itinerary={itinerary} branding={branding} brandColor={brandColor} />
      <SafariStoryClosingPage itinerary={itinerary} branding={branding} brandColor={brandColor} />
    </>
  );
};
