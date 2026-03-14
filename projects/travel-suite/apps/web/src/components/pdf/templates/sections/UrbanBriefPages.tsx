/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Image, Page, Text, View } from '@react-pdf/renderer';
import { PageFooter, PAGE_SIZE, TemplateRendererProps, buildDayActivityBlocks, chunkDayBlocks, getAllActivities, getCoverImage } from './shared';
import { urbanStyles } from './urbanStyles';

const UrbanBriefHeroPage = ({ itinerary, branding, accent, coverImage, activityCount, dayCount }: TemplateRendererProps & {
  accent: string;
  coverImage: string | null;
  activityCount: number;
  dayCount: number;
}) => (
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
            {(itinerary.duration_days || dayCount || 1).toString()} days • {activityCount.toString()} activities
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
);

const UrbanBriefItineraryPages = ({ itinerary, branding, accent }: TemplateRendererProps & { accent: string }) => {
  const dayGroups = chunkDayBlocks(buildDayActivityBlocks(itinerary.days || [], 4), 3);

  return (
    <>
      {dayGroups.map((group, groupIndex) => (
        <Page key={`urban-days-${groupIndex}`} size={PAGE_SIZE} style={urbanStyles.page}>
          <Text style={[urbanStyles.sectionTitle, { color: accent }]}>Itinerary</Text>

          {group.map((block) => {
            const isContinuation = block.blockIndex > 0;

            return (
              <View key={`urban-day-${block.day.day_number}-block-${block.blockIndex}`} style={urbanStyles.daySection}>
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
                  const thumbnails = block.activities.filter((candidate) => candidate.image).slice(index, index + 3);

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
                      {activity.description ? <Text style={urbanStyles.activityDescription}>{activity.description}</Text> : null}

                      {thumbnails.length > 0 ? (
                        <View style={urbanStyles.thumbnailRow}>
                          {thumbnails.map((thumb, thumbIndex) => (
                            <Image key={`${activity.title}-thumb-${thumbIndex}`} src={thumb.image as string} style={urbanStyles.thumbnail} />
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
    </>
  );
};

const UrbanBriefClosingPage = ({ branding, accent }: TemplateRendererProps & { accent: string }) => (
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
);

export const UrbanBriefPages = ({ itinerary, branding }: TemplateRendererProps) => {
  const accent = branding.primaryColor || '#1d4ed8';

  return (
    <>
      <UrbanBriefHeroPage
        itinerary={itinerary}
        branding={branding}
        accent={accent}
        coverImage={getCoverImage(itinerary)}
        activityCount={getAllActivities(itinerary).length}
        dayCount={(itinerary.days || []).length}
      />
      <UrbanBriefItineraryPages itinerary={itinerary} branding={branding} accent={accent} />
      <UrbanBriefClosingPage itinerary={itinerary} branding={branding} accent={accent} />
    </>
  );
};
