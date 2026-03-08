import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { OperatorScorecardPayload } from "@/lib/admin/operator-scorecard";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#0f172a",
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 30,
  },
  header: {
    backgroundColor: "#0f172a",
    borderRadius: 18,
    color: "#ffffff",
    marginBottom: 18,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  eyebrow: {
    color: "#99f6e4",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: 700,
    marginTop: 10,
  },
  subhead: {
    color: "#cbd5e1",
    fontSize: 11,
    marginTop: 8,
  },
  scoreRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },
  scoreCard: {
    borderColor: "#cbd5e1",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    width: "32%",
  },
  scoreLabel: {
    color: "#64748b",
    fontSize: 10,
    textTransform: "uppercase",
  },
  scoreValue: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: 700,
    marginTop: 6,
  },
  scoreHint: {
    color: "#475569",
    fontSize: 10,
    marginTop: 8,
  },
  metricsGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  metricCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: "47%",
  },
  metricLabel: {
    color: "#64748b",
    fontSize: 10,
  },
  metricValue: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: 700,
    marginTop: 4,
  },
  metricSubvalue: {
    color: "#475569",
    fontSize: 9,
    marginTop: 5,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },
  listItem: {
    color: "#334155",
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  footer: {
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    color: "#64748b",
    fontSize: 9,
    marginTop: 18,
    paddingTop: 12,
  },
});

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function delta(value: number | null, suffix = "%") {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix}`;
}

export function OperatorScorecardDocument({
  scorecard,
}: {
  scorecard: OperatorScorecardPayload;
}) {
  return (
    <Document title={`Operator Scorecard ${scorecard.monthKey}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Antigravity Travel</Text>
          <Text style={styles.title}>{scorecard.organization.name} Performance Scorecard</Text>
          <Text style={styles.subhead}>
            {scorecard.monthLabel} · Subscription {scorecard.organization.subscriptionTier || "free"}
          </Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Overall score</Text>
            <Text style={styles.scoreValue}>{scorecard.score}</Text>
            <Text style={styles.scoreHint}>{scorecard.status.replace(/_/g, " ")}</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Revenue</Text>
            <Text style={styles.scoreValue}>{money(scorecard.metrics.revenueInr)}</Text>
            <Text style={styles.scoreHint}>{delta(scorecard.comparison.revenueDeltaPct)}</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Approval rate</Text>
            <Text style={styles.scoreValue}>{scorecard.metrics.approvalRate}%</Text>
            <Text style={styles.scoreHint}>{delta(scorecard.comparison.approvalDeltaPct)}</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Proposals created</Text>
            <Text style={styles.metricValue}>{scorecard.metrics.proposalsCreated}</Text>
            <Text style={styles.metricSubvalue}>Approved: {scorecard.metrics.proposalsApproved}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Payment conversion</Text>
            <Text style={styles.metricValue}>{scorecard.metrics.paymentConversionRate}%</Text>
            <Text style={styles.metricSubvalue}>Links sent: {scorecard.metrics.linksSent}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Review response rate</Text>
            <Text style={styles.metricValue}>
              {scorecard.metrics.reviewResponseRate === null ? "—" : `${scorecard.metrics.reviewResponseRate}%`}
            </Text>
            <Text style={styles.metricSubvalue}>
              Avg rating: {scorecard.metrics.averageRating === null ? "—" : `${scorecard.metrics.averageRating}/5`}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>WhatsApp reply speed</Text>
            <Text style={styles.metricValue}>
              {scorecard.metrics.avgWhatsAppReplyMinutes === null
                ? "—"
                : `${scorecard.metrics.avgWhatsAppReplyMinutes} min`}
            </Text>
            <Text style={styles.metricSubvalue}>
              Inbound: {scorecard.metrics.whatsappInboundCount} · Outbound: {scorecard.metrics.whatsappOutboundCount}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Shared itinerary cache</Text>
            <Text style={styles.metricValue}>
              {scorecard.metrics.cacheHitRate === null ? "—" : `${scorecard.metrics.cacheHitRate}%`}
            </Text>
            <Text style={styles.metricSubvalue}>
              Hits: {scorecard.metrics.cacheHits} · Misses: {scorecard.metrics.cacheMisses}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average paid value</Text>
            <Text style={styles.metricValue}>{money(scorecard.metrics.avgPaidValueInr)}</Text>
            <Text style={styles.metricSubvalue}>Payments collected: {scorecard.metrics.paymentsCollected}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What went well</Text>
          {scorecard.highlights.map((item) => (
            <Text key={item} style={styles.listItem}>• {item}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended next moves</Text>
          {scorecard.actions.map((item) => (
            <Text key={item} style={styles.listItem}>• {item}</Text>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated on {new Date(scorecard.generatedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })} for {scorecard.recipient.name}. Keep this PDF for monthly operating reviews.
        </Text>
      </Page>
    </Document>
  );
}
