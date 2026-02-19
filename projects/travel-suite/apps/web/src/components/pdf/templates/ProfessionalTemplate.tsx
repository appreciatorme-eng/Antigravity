/**
 * Professional Itinerary PDF Template
 * Matches ProfessionalItineraryView web UI design
 * Features:
 * - Cover page with operator branding
 * - Timeline-style day sections
 * - Rich activity descriptions
 * - Inclusions/Exclusions section
 * - Dynamic operator colors
 */

import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import type { ItineraryResult, Day, Activity } from '@/types/itinerary';
import type { ItineraryBranding } from '../itinerary-types';

interface Props {
  itinerary: ItineraryResult;
  branding?: ItineraryBranding;
}

// Register fonts for better typography
// Note: These would need to be added to the project
// Font.register({
//   family: 'Cormorant',
//   src: '/fonts/CormorantGaramond-Bold.ttf',
// });

const createStyles = (primaryColor: string = '#00d084') => StyleSheet.create({
  // Page styles
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  coverPage: {
    padding: 0,
    backgroundColor: '#1e293b', // slate-800
  },

  // Cover page styles
  coverContainer: {
    flex: 1,
    padding: 60,
    justifyContent: 'space-between',
  },
  coverPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  logo: {
    height: 50,
    objectFit: 'contain',
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  destinationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  destinationText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 24,
    lineHeight: 1.2,
  },
  coverSummary: {
    fontSize: 14,
    color: '#e2e8f0', // gray-200
    marginBottom: 32,
    lineHeight: 1.6,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },

  // Content page styles
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 20,
    marginTop: 10,
  },

  // Day card styles
  dayCard: {
    marginBottom: 16,
    borderRadius: 8,
    border: `1pt solid #e2e8f0`,
    overflow: 'hidden',
  },
  dayHeader: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderBottom: `1pt solid #e2e8f0`,
  },
  dayBadge: {
    borderRadius: 4,
    border: `1pt solid ${primaryColor}`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  dayBadgeText: {
    color: primaryColor,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  dayTheme: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  dayMeta: {
    fontSize: 9,
    color: '#64748b',
  },

  // Activity styles
  activityContainer: {
    padding: 16,
    borderBottom: `1pt solid #f1f5f9`,
  },
  activityLastChild: {
    borderBottom: 'none',
  },
  activityImage: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
    borderRadius: 8,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  activityLocation: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 12,
  },
  metadataContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  activityDescription: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.6,
  },
  transportBox: {
    backgroundColor: '#eff6ff',
    border: '1pt solid #bfdbfe',
    borderRadius: 6,
    padding: 10,
    marginTop: 12,
  },
  transportText: {
    fontSize: 9,
    color: '#1e40af',
  },
  transportLabel: {
    fontFamily: 'Helvetica-Bold',
  },

  // Inclusions/Exclusions styles
  inclusionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  inclusionCard: {
    flex: 1,
    border: '2pt solid #d1fae5',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 16,
  },
  exclusionCard: {
    flex: 1,
    border: '2pt solid #fecdd3',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  inclusionIcon: {
    backgroundColor: '#10b981',
  },
  exclusionIcon: {
    backgroundColor: '#ef4444',
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  inclusionTitle: {
    color: '#047857',
  },
  exclusionTitle: {
    color: '#991b1b',
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 9,
    marginTop: 1,
  },
  inclusionBullet: {
    color: '#10b981',
  },
  exclusionBullet: {
    color: '#ef4444',
  },
  listText: {
    fontSize: 9,
    flex: 1,
  },
  inclusionText: {
    color: '#065f46',
  },
  exclusionText: {
    color: '#7f1d1d',
  },

  // Footer styles
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1pt solid #e2e8f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 4,
  },

  // Timeline dot (simulated with View)
  timelineDot: {
    position: 'absolute',
    left: -8,
    top: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: primaryColor,
    border: '2pt solid #ffffff',
  },
});

export default function ProfessionalTemplate({ itinerary, branding }: Props) {
  const primaryColor = branding?.primaryColor || '#00d084';
  const styles = createStyles(primaryColor);

  // Split tips into inclusions/exclusions (first half = inclusions)
  const tips = itinerary.tips || [];
  const midpoint = Math.ceil(tips.length / 2);
  const inclusions = tips.slice(0, midpoint);
  const exclusions = tips.slice(midpoint);

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContainer}>
          {/* Logo */}
          {branding?.logoUrl && (
            <Image src={branding.logoUrl} style={styles.logo} />
          )}

          <View>
            {/* Destination Badge */}
            <View style={styles.destinationBadge}>
              <Text style={styles.destinationText}>
                📍 {itinerary.destination}
              </Text>
            </View>

            {/* Trip Title */}
            <Text style={styles.coverTitle}>
              {itinerary.trip_title}
            </Text>

            {/* Summary */}
            <Text style={styles.coverSummary}>
              {itinerary.summary}
            </Text>

            {/* Metadata */}
            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataText}>
                  📅 {itinerary.duration_days} Days
                </Text>
              </View>
              {itinerary.budget && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataText}>
                    💰 {itinerary.budget}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>

      {/* Day-by-Day Itinerary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Day-by-Day Itinerary</Text>

        {itinerary.days.map((day, dayIndex) => (
          <View key={day.day_number} style={styles.dayCard} wrap={false}>
            {/* Day Header */}
            <View style={styles.dayHeader}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>
                  Day {day.day_number}
                </Text>
              </View>
              <Text style={styles.dayTheme}>{day.theme}</Text>
              <Text style={styles.dayMeta}>
                {day.activities?.length || 0} {day.activities?.length === 1 ? 'Activity' : 'Activities'}
              </Text>
            </View>

            {/* Activities */}
            {day.activities?.map((activity, actIndex) => (
              <View
                key={actIndex}
                style={[
                  styles.activityContainer,
                  actIndex === day.activities.length - 1 && styles.activityLastChild
                ]}
              >
                {/* Activity Image (if available) */}
                {activity.image && (
                  <Image src={activity.image} style={styles.activityImage} />
                )}

                {/* Activity Title & Location */}
                <Text style={styles.activityTitle}>{activity.title}</Text>
                {activity.location && (
                  <Text style={styles.activityLocation}>
                    📍 {activity.location}
                  </Text>
                )}

                {/* Metadata Row */}
                <View style={styles.metadataContainer}>
                  {activity.time && (
                    <View style={styles.metadata}>
                      <Text style={styles.metadataLabel}>
                        🕐 {activity.time}
                      </Text>
                    </View>
                  )}
                  {activity.duration && (
                    <View style={styles.metadata}>
                      <Text style={styles.metadataLabel}>
                        ⏱️ {activity.duration}
                      </Text>
                    </View>
                  )}
                  {activity.cost && (
                    <View style={styles.metadata}>
                      <Text style={styles.metadataLabel}>
                        💵 {activity.cost}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                {activity.description && (
                  <Text style={styles.activityDescription}>
                    {activity.description}
                  </Text>
                )}

                {/* Transport Info */}
                {activity.transport && (
                  <View style={styles.transportBox}>
                    <Text style={styles.transportText}>
                      <Text style={styles.transportLabel}>Getting there: </Text>
                      {activity.transport}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </Page>

      {/* Inclusions & Exclusions (if tips provided) */}
      {tips.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.inclusionsGrid}>
            {/* What's Included */}
            <View style={styles.inclusionCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, styles.inclusionIcon]} />
                <Text style={[styles.cardTitle, styles.inclusionTitle]}>
                  What's Included
                </Text>
              </View>
              {inclusions.map((item, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={[styles.bullet, styles.inclusionBullet]}>✓</Text>
                  <Text style={[styles.listText, styles.inclusionText]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            {/* What's Not Included */}
            <View style={styles.exclusionCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, styles.exclusionIcon]} />
                <Text style={[styles.cardTitle, styles.exclusionTitle]}>
                  What's Not Included
                </Text>
              </View>
              {exclusions.map((item, idx) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={[styles.bullet, styles.exclusionBullet]}>✕</Text>
                  <Text style={[styles.listText, styles.exclusionText]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Generated with {branding?.companyName || 'Travel Suite'}
            </Text>
            <Text style={styles.footerText}>
              This itinerary is subject to availability and may be customized to your preferences
            </Text>
            {branding?.contactEmail && (
              <Text style={styles.footerText}>
                Contact: {branding.contactEmail}
                {branding.contactPhone && ` • ${branding.contactPhone}`}
              </Text>
            )}
          </View>
        </Page>
      )}
    </Document>
  );
}
