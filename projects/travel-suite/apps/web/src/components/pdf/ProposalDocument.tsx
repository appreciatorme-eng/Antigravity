/**
 * Proposal PDF Document Component
 *
 * Generates proposal PDF with itinerary, pricing, add-ons, and terms.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

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
  client_selected_price?: number | null;
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
      is_selected?: boolean;
    }>;
    accommodations: Array<{
      id: string;
      name: string;
      type?: string;
      check_in?: string;
      check_out?: string;
      price?: number;
      is_selected?: boolean;
    }>;
  }>;
  created_at: string;
}

interface ProposalAddOn {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  is_selected?: boolean | null;
}

interface ProposalDocumentProps {
  proposal: ProposalData;
  organizationName?: string;
  organizationLogo?: string | null;
  primaryColor?: string | null;
  addOns?: ProposalAddOn[];
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 28,
    borderBottom: 2,
    paddingBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 6,
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
    marginBottom: 10,
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
    marginRight: 8,
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
  addOnSection: {
    marginTop: 14,
    borderTop: 1,
    borderTopColor: '#bfdbfe',
    paddingTop: 10,
  },
  addOnTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  addOnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    padding: 8,
  },
  addOnName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  addOnMeta: {
    fontSize: 8,
    color: '#475569',
  },
  addOnPrice: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
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
  organizationLogo,
  primaryColor,
  addOns = [],
}) => {
  const resolvedPrimaryColor = primaryColor ?? '#00d084';
  const logoSrc = organizationLogo ?? undefined;

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

  const selectedActivities = proposal.days.flatMap((day) =>
    day.activities.filter((a) => a.is_selected !== false)
  );
  const optionalActivities = proposal.days.flatMap((day) =>
    day.activities.filter((a) => a.is_optional)
  );
  const selectedAccommodations = proposal.days.flatMap((day) =>
    day.accommodations.filter((acc) => acc.is_selected !== false)
  );
  const selectedAddOns = addOns.filter((addOn) => addOn.is_selected !== false);

  const activitiesTotal = selectedActivities.reduce((sum, activity) => sum + (activity.price || 0), 0);
  const accommodationTotal = selectedAccommodations.reduce((sum, acc) => sum + (acc.price || 0), 0);
  const addOnTotal = selectedAddOns.reduce(
    (sum, addOn) => sum + (Number(addOn.unit_price || 0) * Number(addOn.quantity || 1)),
    0
  );

  const computedPackageTotal = activitiesTotal + accommodationTotal + addOnTotal;
  const displayTotal =
    proposal.client_selected_price || proposal.total_price || computedPackageTotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { borderBottomColor: resolvedPrimaryColor }]}>
          <View style={styles.brandRow}>
            <Text style={[styles.brandName, { color: resolvedPrimaryColor }]}>{organizationName}</Text>
            {logoSrc ? <Image src={logoSrc} style={styles.brandLogo} /> : null}
          </View>

          <Text style={styles.title}>{proposal.title}</Text>
          <Text style={styles.subtitle}>Prepared for: {proposal.client_name}</Text>
          {proposal.client_email ? <Text style={styles.subtitle}>{proposal.client_email}</Text> : null}
          <Text style={styles.subtitle}>
            {proposal.destination} • {proposal.duration_days || proposal.days.length} Days
          </Text>
          {proposal.start_date ? (
            <Text style={styles.subtitle}>
              {formatDate(proposal.start_date)} - {formatDate(proposal.end_date)}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { borderBottomColor: resolvedPrimaryColor }]}>Trip Overview</Text>
          <Text style={{ fontSize: 10, color: '#4a4a4a', lineHeight: 1.5 }}>
            Welcome to your personalized {proposal.destination} tour package. This proposal includes
            a curated {proposal.days.length}-day itinerary with dynamic options for transport and upsells.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { borderBottomColor: resolvedPrimaryColor }]}>Detailed Itinerary</Text>

          {proposal.days.map((day) => (
            <View key={day.day_number}>
              <View style={[styles.dayHeader, { borderLeftColor: resolvedPrimaryColor }]}>
                <Text style={styles.dayTitle}>
                  Day {day.day_number}: {day.title}
                </Text>
                {day.description ? <Text style={styles.daySubtitle}>{day.description}</Text> : null}
              </View>

              {day.activities.length > 0 ? (
                <View>
                  {day.activities
                    .filter((activity) => activity.is_selected !== false)
                    .map((activity) => (
                      <View key={activity.id} style={styles.activityCard}>
                        <View style={styles.activityHeader}>
                          <Text style={styles.activityTitle}>{activity.title}</Text>
                          <View style={{ flexDirection: 'row' }}>
                            <Text style={[styles.activityBadge, { backgroundColor: resolvedPrimaryColor }]}>SELECTED</Text>
                            {activity.is_optional ? (
                              <Text style={styles.activityOptionalBadge}>OPTIONAL</Text>
                            ) : null}
                          </View>
                        </View>
                        {activity.time ? <Text style={styles.activityDetail}>⏰ {activity.time}</Text> : null}
                        {activity.location ? <Text style={styles.activityDetail}>📍 {activity.location}</Text> : null}
                        {activity.description ? (
                          <Text style={styles.activityDescription}>{activity.description}</Text>
                        ) : null}
                      </View>
                    ))}
                </View>
              ) : null}

              {day.accommodations.length > 0 ? (
                <View>
                  {day.accommodations
                    .filter((acc) => acc.is_selected !== false)
                    .map((acc) => (
                      <View key={acc.id} style={styles.accommodationCard}>
                        <Text style={styles.accommodationTitle}>🏨 {acc.name}</Text>
                        {acc.type ? <Text style={styles.activityDetail}>Type: {acc.type}</Text> : null}
                        {acc.check_in ? (
                          <Text style={styles.activityDetail}>Check-in: {formatDate(acc.check_in)}</Text>
                        ) : null}
                      </View>
                    ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.pricingSection}>
          <Text style={[styles.sectionTitle, { borderBottomColor: resolvedPrimaryColor }]}>Pricing Summary</Text>

          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Selected Activities ({selectedActivities.length})</Text>
            <Text style={styles.pricingValue}>{formatCurrency(activitiesTotal, proposal.currency)}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Accommodations ({selectedAccommodations.length} nights)</Text>
            <Text style={styles.pricingValue}>{formatCurrency(accommodationTotal, proposal.currency)}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Selected Add-ons / Vehicle</Text>
            <Text style={styles.pricingValue}>{formatCurrency(addOnTotal, proposal.currency)}</Text>
          </View>
          {optionalActivities.length > 0 ? (
            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Optional options available</Text>
              <Text style={styles.pricingValue}>{optionalActivities.length} activities</Text>
            </View>
          ) : null}

          {selectedAddOns.length > 0 ? (
            <View style={styles.addOnSection}>
              <Text style={styles.addOnTitle}>Selected Add-ons</Text>
              {selectedAddOns.map((addOn) => {
                const quantity = Number(addOn.quantity || 1);
                const unitPrice = Number(addOn.unit_price || 0);
                const lineTotal = quantity * unitPrice;
                return (
                  <View key={addOn.id} style={styles.addOnCard}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.addOnName}>{addOn.name}</Text>
                      <Text style={styles.addOnMeta}>
                        {addOn.category || 'Option'} • Qty {quantity}
                      </Text>
                      {addOn.description ? <Text style={styles.addOnMeta}>{addOn.description}</Text> : null}
                    </View>
                    <Text style={styles.addOnPrice}>{formatCurrency(lineTotal, proposal.currency)}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={[styles.totalRow, { borderTopColor: resolvedPrimaryColor }]}>
            <Text style={styles.totalLabel}>Total Package Price</Text>
            <Text style={[styles.totalValue, { color: resolvedPrimaryColor }]}>
              {formatCurrency(displayTotal, proposal.currency)}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated by {organizationName} • {new Date().toLocaleDateString()}
          {'\n'}
          This is a personalized travel proposal. Prices and availability are subject to confirmation.
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { borderBottomColor: resolvedPrimaryColor }]}>
          <Text style={styles.title}>Terms & Conditions</Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Booking & Payment</Text>
          <Text style={styles.termsText}>• A deposit of 25% of the total package price is required to confirm your booking.</Text>
          <Text style={styles.termsText}>• Full payment is due 30 days before the tour start date.</Text>
          <Text style={styles.termsText}>• Payment can be made via bank transfer, credit card, or UPI.</Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Cancellation Policy</Text>
          <Text style={styles.termsText}>• Cancellations made 45+ days before departure: 90% refund.</Text>
          <Text style={styles.termsText}>• Cancellations made 30-44 days before departure: 50% refund.</Text>
          <Text style={styles.termsText}>• Cancellations made 15-29 days before departure: 25% refund.</Text>
          <Text style={styles.termsText}>• Cancellations made less than 15 days before departure: no refund.</Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Inclusions</Text>
          <Text style={styles.termsText}>• Accommodations and activities marked as selected in this proposal.</Text>
          <Text style={styles.termsText}>• Transportation and chosen vehicle class where applicable.</Text>
          <Text style={styles.termsText}>• Professional ground support as listed in itinerary notes.</Text>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Exclusions</Text>
          <Text style={styles.termsText}>• International or domestic airfare unless specified.</Text>
          <Text style={styles.termsText}>• Travel insurance and personal expenses.</Text>
          <Text style={styles.termsText}>• Unselected optional upgrades and gratuities.</Text>
        </View>

        <View style={{ marginTop: 30, textAlign: 'center' }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 10 }}>Questions? Contact Us</Text>
          <Text style={{ fontSize: 9, color: '#666666' }}>Email: info@{organizationName.toLowerCase().replace(/\s/g, '')}.com</Text>
          <Text style={{ fontSize: 9, color: '#666666' }}>Phone: +91 XXX XXX XXXX</Text>
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
