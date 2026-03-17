import "server-only";

import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { logError } from "@/lib/observability/logger";
import { env } from "@/lib/config/env";
import { sendOperatorScorecardNotification } from "@/lib/email/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { OperatorScorecardDocument } from "@/components/pdf/OperatorScorecardDocument";
import {
  buildOperatorScorecardPayload,
  type OperatorScorecardPayload,
  upsertOperatorScorecard,
} from "@/lib/admin/operator-scorecard";

type AdminClient = ReturnType<typeof createAdminClient>;
type ScorecardLookupRow = { id: string; emailed_at: string | null; month_key: string };
type AnyAdminClient = AdminClient & {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: ScorecardLookupRow | null; error: Error | null }>;
        };
      };
    };
  };
};

function scorecardFilename(payload: OperatorScorecardPayload) {
  return `operator-scorecard-${payload.monthKey}.pdf`;
}

export async function renderOperatorScorecardPdf(
  payload: OperatorScorecardPayload,
): Promise<Buffer> {
  const document = React.createElement(OperatorScorecardDocument, {
    scorecard: payload,
  }) as React.ReactElement<DocumentProps>;

  return renderToBuffer(document);
}

export async function deliverOperatorScorecard(args: {
  organizationId: string;
  monthKey?: string;
  force?: boolean;
  adminClient?: AdminClient;
}) {
  const admin = args.adminClient || createAdminClient();
  const payload = await buildOperatorScorecardPayload({
    organizationId: args.organizationId,
    monthKey: args.monthKey,
    adminClient: admin,
  });
  const typedAdmin = admin as unknown as AnyAdminClient;
  const existing = await typedAdmin
    .from("operator_scorecards")
    .select("id, emailed_at, month_key")
    .eq("organization_id", args.organizationId)
    .eq("month_key", payload.monthKey)
    .maybeSingle();

  if (!args.force && existing.data?.emailed_at) {
    return {
      skipped: true,
      reason: "already_emailed",
      monthKey: existing.data.month_key,
    };
  }

  const pdfBuffer = await renderOperatorScorecardPdf(payload);

  const emailSent = await sendOperatorScorecardNotification({
    to: payload.recipient.email,
    recipientName: payload.recipient.name,
    organizationName: payload.organization.name,
    monthLabel: payload.monthLabel,
    score: payload.score,
    status: payload.status,
    highlights: payload.highlights,
    actions: payload.actions,
    revenueLabel: `₹${Math.round(payload.metrics.revenueInr).toLocaleString("en-IN")}`,
    approvalRateLabel: `${payload.metrics.approvalRate}%`,
    dashboardUrl: `${env.app.url || "https://app.tripbuilt.com"}/admin`,
    attachment: {
      filename: scorecardFilename(payload),
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  });

  const persisted = await upsertOperatorScorecard({
    organizationId: args.organizationId,
    monthKey: payload.monthKey,
    adminClient: admin,
    status: emailSent ? "emailed" : "failed",
    emailedAt: emailSent ? new Date().toISOString() : null,
    pdfGeneratedAt: new Date().toISOString(),
    lastError: emailSent ? null : "Email delivery failed",
  });

  return {
    skipped: false,
    emailSent,
    payload,
    row: persisted.row,
  };
}

export async function deliverMonthlyOperatorScorecards(args: {
  monthKey?: string;
  organizationId?: string;
  force?: boolean;
}) {
  const admin = createAdminClient();
  let query = admin
    .from("organizations")
    .select("id");

  if (args.organizationId) {
    query = query.eq("id", args.organizationId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  for (const organization of data || []) {
    results.processed += 1;
    try {
      const outcome = await deliverOperatorScorecard({
        organizationId: organization.id,
        monthKey: args.monthKey,
        force: args.force,
        adminClient: admin,
      });

      if (outcome.skipped) {
        results.skipped += 1;
      } else if (outcome.emailSent) {
        results.sent += 1;
      } else {
        results.failed += 1;
      }
    } catch (error) {
      results.failed += 1;
      logError("[operator-scorecards] delivery failed", error, {
        organizationId: organization.id,
      });
    }
  }

  return results;
}
