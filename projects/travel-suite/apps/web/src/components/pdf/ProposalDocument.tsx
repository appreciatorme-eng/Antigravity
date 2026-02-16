/**
 * Proposal PDF Document Component
 *
 * Generates beautiful PDF from proposal data
 * Includes: Itinerary, pricing, T&C, branding
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts (optional - for better typography)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
// });

interface ProposalData {
  id: string;
  title: string;
  client_name: string;
  client_email?: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  total_price: number;
  currency: string;
  status: string;
  days: Array<{
    day_number: number;
    title: string;
    description?: string;
    activities: Array<{
      id: string;
      title: string;
      description?: string;
      time?: string;
      location?: string;
      price?: number;
      is_optional: boolean;
      is_included: boolean;
    }>;
    accommodations: Array<{
      id: string;
      name: string;
      type?: string;
      check_in?: string;
      check_out?: string;
      price?: number;
    }>;
  }>;
  created_at: string;
}

interface ProposalDocumentProps {
  proposal: ProposalData;
  organizationName?: string;
  organizationLogo?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: '#00d084',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#124ea2',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#124ea2',
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: '#00d084',
    paddingBottom: 5,
  },
  dayHeader: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    marginBottom: 10,
    marginTop: 15,
    borderLeft: 4,
    borderLeftColor: '#00d084',
  },
  dayTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#124ea2',
    marginBottom: 3,
  },
  daySubtitle: {
    fontSize: 10,
    color: '#666666',
  },
  activityCard: {
    marginBottom: 12,
    marginLeft: 15,
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  activityTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    flex: 1,
  },
  activityBadge: {
    fontSize: 8,
    backgroundColor: '#00d084',
    color: '#ffffff',
    padding: '3 8',
    borderRadius: 3,
  },
  activityOptionalBadge: {
    fontSize: 8,
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    padding: '3 8',
    borderRadius: 3,
    marginLeft: 5,
  },
  activityDetail: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 9,
    color: '#4a4a4a',
    marginTop: 5,
    lineHeight: 1.4,
  },
  accommodationCard: {
    marginBottom: 10,
    marginLeft: 15,
    padding: 10,
    backgroundColor: '#fff7ed',
    borderRadius: 4,
    borderLeft: 2,
    borderLeftColor: '#f59e0b',
  },
  accommodationTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  pricingSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 10,
    color: '#4a4a4a',
  },
  pricingValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTop: 2,
    borderTopColor: '#00d084',
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#124ea2',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#00d084',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: 1,
    borderTopColor: '#cccccc',
    paddingTop: 10,
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
  termsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fafafa',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  termsText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#4a4a4a',
    marginBottom: 5,
  },
});

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({
  proposal,
  organizationName = 'Travel Suite',
}) => {
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate totals
  const includedActivities = proposal.days.flatMap((day) =>
    day.activities.filter((a) => a.is_included && !a.is_optional)
  );
  const optionalActivities = proposal.days.flatMap((day) =>
    day.activities.filter((a) => a.is_optional)
  );
  const accommodations = proposal.days.flatMap((day) => day.accommodations);

  const includedTotal = includedActivities.reduce((sum, a) => sum + (a.price || 0), 0);
  const accommodationTotal = accommodations.reduce((sum, a) => sum + (a.price || 0), 0);
  const basePrice = includedTotal + accommodationTotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{proposal.title}</Text>
          <Text style={styles.subtitle}>Prepared for: {proposal.client_name}</Text>
          {proposal.client_email && (
            <Text style={styles.subtitle}>{proposal.client_email}</Text>
          )}
          <Text style={styles.subtitle}>
            {proposal.destination} • {proposal.duration_days || proposal.days.length} Days
          </Text>
          {proposal.start_date && (
            <Text style={styles.subtitle}>
              {formatDate(proposal.start_date)} - {formatDate(proposal.end_date)}
            </Text>
          )}
        </View>

        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Overview</Text>
          <Text style={{ fontSize: 10, color: '#4a4a4a', lineHeight: 1.5 }}>
            Welcome to your personalized {proposal.destination} tour package! This proposal includes
            a carefully curated {proposal.days.length}-day itinerary designed specifically for you.
            All included activities, accommodations, and services are detailed below.
          </Text>
        </View>

        {/* Day-by-Day Itinerary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Itinerary</Text>

          {proposal.days.map((day) => (
            <View key={day.day_number}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>
                  Day {day.day_number}: {day.title}
                </Text>
                {day.description && (
                  <Text style={styles.daySubtitle}>{day.description}</Text>
                )}
              </View>

              {/* Activities */}
              {day.activities.length > 0 && (
                <View>
                  {day.activities
                    .filter((a) => a.is_included)
                    .map((activity) => (
                      <View key={activity.id} style={styles.activityCard}>
                        <View style={styles.activityHeader}>
                          <Text style={styles.activityTitle}>{activity.title}</Text>
                          <View style={{ flexDirection: 'row' }}>
                            <Text style={styles.activityBadge}>INCLUDED</Text>
                            {activity.is_optional && (
                              <Text style={styles.activityOptionalBadge}>OPTIONAL</Text>
                            )}
                          </View>
                        </View>
                        {activity.time && (
                          <Text style={styles.activityDetail}>⏰ {activity.time}</Text>
                        )}
                        {activity.location && (
                          <Text style={styles.activityDetail}>📍 {activity.location}</Text>
                        )}
                        {activity.description && (
                          <Text style={styles.activityDescription}>
                            {activity.description}
                          </Text>
                        )}
                      </View>
                    ))}
                </View>
              )}

              {/* Accommodations */}
              {day.accommodations.length > 0 && (
                <View>
                  {day.accommodations.map((acc) => (
                    <View key={acc.id} style={styles.accommodationCard}>
                      <Text style={styles.accommodationTitle}>🏨 {acc.name}</Text>
                      {acc.type && (
                        <Text style={styles.activityDetail}>Type: {acc.type}</Text>
                      )}
                      {acc.check_in && (
                        <Text style={styles.activityDetail}>
                          Check-in: {formatDate(acc.check_in)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Base Package Price</Text>
            <Text style={styles.pricingValue}>
              {formatCurrency(basePrice, proposal.currency)}
            </Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Included Activities ({includedActivities.length})</Text>
            <Text style={styles.pricingValue}>
              {formatCurrency(includedTotal, proposal.currency)}
            </Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Accommodations ({accommodations.length} nights)</Text>
            <Text style={styles.pricingValue}>
              {formatCurrency(accommodationTotal, proposal.currency)}
            </Text>
          </View>
          {optionalActivities.length > 0 && (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Optional Add-ons Available</Text>
              <Text style={styles.pricingValue}>
                {optionalActivities.length} options
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Package Price</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(proposal.total_price, proposal.currency)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by {organizationName} • {new Date().toLocaleDateString()}
          {'\n'}
          This is a personalized travel proposal. Prices and availability subject to confirmation.
        </Text>
      </Page>

      {/* Second Page - Terms & Conditions */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Terms & Conditions</Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Booking & Payment</Text>
          <Text style={styles.termsText}>
            • A deposit of 25% of the total package price is required to confirm your booking.
          </Text>
          <Text style={styles.termsText}>
            • Full payment is due 30 days before the tour start date.
          </Text>
          <Text style={styles.termsText}>
            • Payment can be made via bank transfer, credit card, or UPI.
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Cancellation Policy</Text>
          <Text style={styles.termsText}>
            • Cancellations made 45+ days before departure: 90% refund
          </Text>
          <Text style={styles.termsText}>
            • Cancellations made 30-44 days before departure: 50% refund
          </Text>
          <Text style={styles.termsText}>
            • Cancellations made 15-29 days before departure: 25% refund
          </Text>
          <Text style={styles.termsText}>
            • Cancellations made less than 15 days before departure: No refund
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Inclusions</Text>
          <Text style={styles.termsText}>
            • All accommodations as per itinerary
          </Text>
          <Text style={styles.termsText}>
            • Activities marked as "INCLUDED" in the itinerary
          </Text>
          <Text style={styles.termsText}>
            • Transportation between destinations as mentioned
          </Text>
          <Text style={styles.termsText}>
            • Professional tour guide services
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Exclusions</Text>
          <Text style={styles.termsText}>
            • International/domestic airfare unless specified
          </Text>
          <Text style={styles.termsText}>
            • Travel insurance (highly recommended)
          </Text>
          <Text style={styles.termsText}>
            • Personal expenses (laundry, phone calls, etc.)
          </Text>
          <Text style={styles.termsText}>
            • Optional activities not marked as included
          </Text>
          <Text style={styles.termsText}>
            • Tips and gratuities
          </Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Important Notes</Text>
          <Text style={styles.termsText}>
            • Valid passport required (minimum 6 months validity)
          </Text>
          <Text style={styles.termsText}>
            • Visa requirements are the traveler's responsibility
          </Text>
          <Text style={styles.termsText}>
            • Travel insurance is strongly recommended
          </Text>
          <Text style={styles.termsText}>
            • Itinerary may be modified due to weather or unforeseen circumstances
          </Text>
          <Text style={styles.termsText}>
            • Prices quoted are subject to availability and confirmation
          </Text>
        </View>

        <View style={{ marginTop: 30, textAlign: 'center' }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 10 }}>
            Questions? Contact Us
          </Text>
          <Text style={{ fontSize: 9, color: '#666666' }}>
            Email: info@{organizationName.toLowerCase().replace(/\s/g, '')}.com
          </Text>
          <Text style={{ fontSize: 9, color: '#666666' }}>
            Phone: +91 XXX XXX XXXX
          </Text>
        </View>

        <Text style={styles.footer}>
          {organizationName} • Powered by Travel Suite
          {'\n'}
          © {new Date().getFullYear()} All rights reserved
        </Text>
      </Page>
    </Document>
  );
};
