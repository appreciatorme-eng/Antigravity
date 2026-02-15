/**
 * PDF Export for Proposals
 *
 * Generates beautiful PDF documents using @react-pdf/renderer
 * Matches the public proposal viewer design
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// PDF Styles (matching Stitch design system)
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#f5efe6',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1b140a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6f5b3e',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    width: 12,
    height: 12,
    color: '#9c7c46',
  },
  metaText: {
    fontSize: 12,
    color: '#6f5b3e',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    border: '1px solid #eadfcd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b140a',
    marginBottom: 12,
  },
  description: {
    fontSize: 12,
    color: '#6f5b3e',
    lineHeight: 1.6,
  },
  priceBox: {
    backgroundColor: '#f6efe4',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    border: '2px solid #9c7c46',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6f5b3e',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9c7c46',
  },
  dayCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    border: '1px solid #eadfcd',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid #eadfcd',
  },
  dayNumber: {
    fontSize: 14,
    color: '#bda87f',
    fontWeight: 'bold',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b140a',
  },
  dayDescription: {
    fontSize: 11,
    color: '#6f5b3e',
    marginBottom: 12,
    lineHeight: 1.5,
  },
  activitySection: {
    marginBottom: 12,
  },
  activitySectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1b140a',
    marginBottom: 8,
  },
  activity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f1e6',
    borderRadius: 4,
  },
  activityLeft: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 9,
    color: '#bda87f',
    fontWeight: 'bold',
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1b140a',
  },
  activityBadge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginLeft: 4,
  },
  optionalBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  premiumBadge: {
    backgroundColor: '#f3e8ff',
    color: '#6b21a8',
  },
  selectedBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  activityDescription: {
    fontSize: 10,
    color: '#6f5b3e',
    marginTop: 2,
  },
  activityLocation: {
    fontSize: 9,
    color: '#bda87f',
    marginTop: 2,
  },
  activityPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9c7c46',
  },
  accommodationSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    border: '1px solid #fbbf24',
  },
  accommodationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1b140a',
    marginBottom: 8,
  },
  accommodationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accommodationLeft: {
    flex: 1,
  },
  hotelName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1b140a',
    marginBottom: 2,
  },
  starRating: {
    fontSize: 10,
    color: '#fbbf24',
    marginBottom: 2,
  },
  roomType: {
    fontSize: 10,
    color: '#6f5b3e',
    marginBottom: 2,
  },
  amenities: {
    fontSize: 9,
    color: '#bda87f',
  },
  accommodationPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9c7c46',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #eadfcd',
  },
  footerText: {
    fontSize: 10,
    color: '#bda87f',
    textAlign: 'center',
  },
  poweredBy: {
    fontSize: 9,
    color: '#bda87f',
    textAlign: 'center',
    marginTop: 8,
  },
});

interface ProposalPDFProps {
  proposal: {
    title: string;
    destination?: string;
    duration_days?: number;
    description?: string;
    total_price: number;
    status: string;
  };
  days: Array<{
    id: string;
    day_number: number;
    title: string | null;
    description: string | null;
  }>;
  activities: Record<string, Array<{
    id: string;
    time: string | null;
    title: string;
    description: string | null;
    location: string | null;
    price: number;
    is_optional: boolean;
    is_premium: boolean;
    is_selected: boolean;
  }>>;
  accommodations: Record<string, {
    id: string;
    hotel_name: string;
    star_rating: number;
    room_type: string | null;
    price_per_night: number;
    amenities: string[] | null;
  }>;
}

export const ProposalPDF: React.FC<ProposalPDFProps> = ({
  proposal,
  days,
  activities,
  accommodations,
}) => {
  // Calculate total selected price
  const totalSelectedPrice = Object.values(activities)
    .flat()
    .filter((a) => a.is_selected)
    .reduce((sum, a) => sum + a.price, 0) +
    Object.values(accommodations).reduce((sum, acc) => sum + acc.price_per_night, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{proposal.title}</Text>
          <View style={styles.metaRow}>
            {proposal.destination && (
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>📍 {proposal.destination}</Text>
              </View>
            )}
            {proposal.duration_days && (
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>📅 {proposal.duration_days} days</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Text style={styles.metaText}>💰 ${totalSelectedPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Total Price Box */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Total Price (Selected Activities)</Text>
          <Text style={styles.priceValue}>${totalSelectedPrice.toFixed(2)}</Text>
        </View>

        {/* Description */}
        {proposal.description && (
          <View style={styles.section}>
            <Text style={styles.description}>{proposal.description}</Text>
          </View>
        )}

        {/* Days */}
        {days.map((day) => {
          const dayActivities = activities[day.id] || [];
          const dayAccommodation = accommodations[day.id];

          return (
            <View key={day.id} style={styles.dayCard} wrap={false}>
              <View style={styles.dayHeader}>
                <View>
                  <Text style={styles.dayNumber}>Day {day.day_number}</Text>
                  <Text style={styles.dayTitle}>{day.title || `Day ${day.day_number}`}</Text>
                </View>
              </View>

              {day.description && (
                <Text style={styles.dayDescription}>{day.description}</Text>
              )}

              {/* Activities */}
              {dayActivities.length > 0 && (
                <View style={styles.activitySection}>
                  <Text style={styles.activitySectionTitle}>
                    Activities ({dayActivities.filter((a) => a.is_selected).length} selected)
                  </Text>
                  {dayActivities
                    .filter((a) => a.is_selected)
                    .map((activity) => (
                      <View key={activity.id} style={styles.activity}>
                        <View style={styles.activityLeft}>
                          <View style={styles.activityHeader}>
                            {activity.time && (
                              <Text style={styles.activityTime}>{activity.time}</Text>
                            )}
                            <Text style={styles.activityTitle}>{activity.title}</Text>
                            {activity.is_optional && (
                              <Text style={[styles.activityBadge, styles.optionalBadge]}>
                                Optional
                              </Text>
                            )}
                            {activity.is_premium && (
                              <Text style={[styles.activityBadge, styles.premiumBadge]}>
                                Premium
                              </Text>
                            )}
                          </View>
                          {activity.description && (
                            <Text style={styles.activityDescription}>{activity.description}</Text>
                          )}
                          {activity.location && (
                            <Text style={styles.activityLocation}>📍 {activity.location}</Text>
                          )}
                        </View>
                        {activity.price > 0 && (
                          <Text style={styles.activityPrice}>${activity.price.toFixed(2)}</Text>
                        )}
                      </View>
                    ))}
                </View>
              )}

              {/* Accommodation */}
              {dayAccommodation && (
                <View style={styles.accommodationSection}>
                  <Text style={styles.accommodationTitle}>🏨 Accommodation</Text>
                  <View style={styles.accommodationContent}>
                    <View style={styles.accommodationLeft}>
                      <Text style={styles.hotelName}>{dayAccommodation.hotel_name}</Text>
                      <Text style={styles.starRating}>
                        {'⭐'.repeat(dayAccommodation.star_rating)}
                      </Text>
                      {dayAccommodation.room_type && (
                        <Text style={styles.roomType}>{dayAccommodation.room_type}</Text>
                      )}
                      {dayAccommodation.amenities && dayAccommodation.amenities.length > 0 && (
                        <Text style={styles.amenities}>
                          {dayAccommodation.amenities.join(' • ')}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.accommodationPrice}>
                      ${dayAccommodation.price_per_night.toFixed(2)}/night
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This proposal includes all selected activities and accommodations.
          </Text>
          <Text style={styles.footerText}>
            Please contact your travel operator for any questions or modifications.
          </Text>
          <Text style={styles.poweredBy}>
            Generated with Travel Suite • www.travelsuite.app
          </Text>
        </View>
      </Page>
    </Document>
  );
};
