import { NextResponse } from 'next/server';
import { sanitizeEmail, sanitizePhone, sanitizeText } from '@/lib/security/sanitize';
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { enforcePublicRouteRateLimit } from "@/lib/security/public-rate-limit";
import { captureServerAnalyticsEvent } from '@/lib/analytics/server';
import {
  sendProposalApprovedNotification,
  sendProposalRejectedNotification,
} from "@/lib/email/notifications";
import { trackFunnelEvent } from '@/lib/funnel/track';
import {
  type ProposalPackageTier,
  parseTierPricing,
  tierPrice,
} from '@/lib/proposals/types';
import {
  createPaymentLinkRecord,
  recordPaymentLinkEvent,
} from "@/lib/payments/payment-links.server";
import { sendEvolutionText } from "@/lib/whatsapp-evolution.server";
import {
  buildPublicPayload,
  getRequestIp,
  loadOperatorContact,
  loadProposalByToken,
  normalizeProposal,
  PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_MAX,
  PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_WINDOW_MS,
  PUBLIC_PROPOSAL_READ_RATE_LIMIT_MAX,
  PUBLIC_PROPOSAL_READ_RATE_LIMIT_WINDOW_MS,
  recalculateProposalPrice,
  sanitizeIdentifier,
  sanitizeShareToken,
  supabaseAdmin,
  syncLinkedProposalToTrip,
  withRateLimitHeaders,
} from "./public-proposal-utils";
import { logError } from "@/lib/observability/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await params;
    const token = sanitizeShareToken(rawToken);
    if (!token) {
      return NextResponse.json({ error: 'Invalid proposal token' }, { status: 400 });
    }

    const rateLimitResponse = await enforcePublicRouteRateLimit(request, {
      identifier: token,
      limit: PUBLIC_PROPOSAL_READ_RATE_LIMIT_MAX,
      windowMs: PUBLIC_PROPOSAL_READ_RATE_LIMIT_WINDOW_MS,
      prefix: "public:proposal:read",
      message: "Too many requests. Please try again later.",
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const payload = await buildPublicPayload(token);

    if ('error' in payload) {
      return NextResponse.json({ error: payload.error }, { status: payload.status });
    }

    return NextResponse.json(payload);
  } catch (error) {
    logError("Error loading public proposal", error);
    return NextResponse.json(
      {
        error: 'Failed to process proposal',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token: rawToken } = await params;
    const token = sanitizeShareToken(rawToken);
    if (!token) {
      return NextResponse.json({ error: 'Invalid proposal token' }, { status: 400 });
    }

    const limiter = await enforceRateLimit({
      identifier: `${getRequestIp(request)}:${token}`,
      limit: PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_MAX,
      windowMs: PUBLIC_PROPOSAL_ACTION_RATE_LIMIT_WINDOW_MS,
      prefix: "public:proposal:actions",
    });

    if (!limiter.success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((limiter.reset - Date.now()) / 1000));
      const response = NextResponse.json(
        { error: "Too many actions. Please try again later." },
        { status: 429 }
      );
      response.headers.set("retry-after", String(retryAfterSeconds));
      return withRateLimitHeaders(response, limiter);
    }

    const loaded = await loadProposalByToken(token);

    if ('error' in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    const proposal = normalizeProposal(loaded.proposal);
    const body = await request.json();
    const action = sanitizeText(body?.action, { maxLength: 40 });

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'toggleActivity') {
      const activityId = sanitizeIdentifier(body.activityId);
      const selected = !!body.selected;
      if (!activityId) {
        return NextResponse.json({ error: 'Activity id is required' }, { status: 400 });
      }

      const { data: activity } = await supabaseAdmin
        .from('proposal_activities')
        .select('id, proposal_day_id')
        .eq('id', activityId)
        .maybeSingle();

      if (!activity) {
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
      }

      const { data: day } = await supabaseAdmin
        .from('proposal_days')
        .select('id')
        .eq('id', activity.proposal_day_id)
        .eq('proposal_id', proposal.id)
        .maybeSingle();

      if (!day) {
        return NextResponse.json({ error: 'Activity does not belong to this proposal' }, { status: 403 });
      }

      const { error: activityError } = await supabaseAdmin
        .from('proposal_activities')
        .update({ is_selected: selected })
        .eq('id', activityId);

      if (activityError) {
        logError("[proposals] toggle activity error", activityError);
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
      }

      const recalculated = await recalculateProposalPrice(proposal.id);
      if (recalculated.error) {
        return NextResponse.json({ error: recalculated.error }, { status: 400 });
      }

      await syncLinkedProposalToTrip({
        adminClient: supabaseAdmin,
        proposalId: proposal.id,
      });

      return NextResponse.json({ success: true, client_selected_price: recalculated.price });
    }

    if (action === 'toggleAddOn') {
      const addOnId = sanitizeIdentifier(body.addOnId);
      const selected = !!body.selected;
      if (!addOnId) {
        return NextResponse.json({ error: 'Add-on id is required' }, { status: 400 });
      }

      const { data: addOn } = await supabaseAdmin
        .from('proposal_add_ons')
        .select('id, category')
        .eq('id', addOnId)
        .eq('proposal_id', proposal.id)
        .maybeSingle();

      if (!addOn) {
        return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
      }

      if (String(addOn.category || '').toLowerCase() === 'transport' && selected) {
        await supabaseAdmin
          .from('proposal_add_ons')
          .update({ is_selected: false })
          .eq('proposal_id', proposal.id)
          .ilike('category', 'transport');
      }

      const { error: addOnError } = await supabaseAdmin
        .from('proposal_add_ons')
        .update({ is_selected: selected })
        .eq('id', addOnId);

      if (addOnError) {
        logError("[proposals] toggle add-on error", addOnError);
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
      }

      const recalculated = await recalculateProposalPrice(proposal.id);
      if (recalculated.error) {
        return NextResponse.json({ error: recalculated.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, client_selected_price: recalculated.price });
    }

    if (action === 'selectVehicle') {
      const addOnId = sanitizeIdentifier(body.addOnId);
      if (!addOnId) {
        return NextResponse.json({ error: 'Vehicle add-on id is required' }, { status: 400 });
      }

      const { data: addOn } = await supabaseAdmin
        .from('proposal_add_ons')
        .select('id, category')
        .eq('id', addOnId)
        .eq('proposal_id', proposal.id)
        .maybeSingle();

      if (!addOn || String(addOn.category || '').toLowerCase() !== 'transport') {
        return NextResponse.json({ error: 'Vehicle option not found' }, { status: 404 });
      }

      await supabaseAdmin
        .from('proposal_add_ons')
        .update({ is_selected: false })
        .eq('proposal_id', proposal.id)
        .ilike('category', 'transport');

      const { error: vehicleError } = await supabaseAdmin
        .from('proposal_add_ons')
        .update({ is_selected: true })
        .eq('id', addOnId);

      if (vehicleError) {
        logError("[proposals] select vehicle error", vehicleError);
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
      }

      const recalculated = await recalculateProposalPrice(proposal.id);
      if (recalculated.error) {
        return NextResponse.json({ error: recalculated.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, client_selected_price: recalculated.price });
    }

    if (action === 'comment') {
      const authorName = sanitizeText(body.authorName, { maxLength: 120 });
      const authorEmail = sanitizeEmail(body.authorEmail);
      const comment = sanitizeText(body.comment, { maxLength: 2000, preserveNewlines: true });
      const proposalDayId = sanitizeIdentifier(body.proposalDayId);

      if (!authorName || !comment) {
        return NextResponse.json({ error: 'Name and comment are required' }, { status: 400 });
      }

      if (proposalDayId) {
        const { data: day } = await supabaseAdmin
          .from('proposal_days')
          .select('id')
          .eq('id', proposalDayId)
          .eq('proposal_id', proposal.id)
          .maybeSingle();

        if (!day) {
          return NextResponse.json({ error: 'Invalid day reference' }, { status: 400 });
        }
      }

      const { error: commentError } = await supabaseAdmin.from('proposal_comments').insert({
        proposal_id: proposal.id,
        proposal_day_id: proposalDayId,
        author_name: authorName,
        author_email: authorEmail,
        comment,
      });

      if (commentError) {
        logError("[proposals] insert comment error", commentError);
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
      }

      if (proposal.status !== 'approved') {
        await supabaseAdmin
          .from('proposals')
          .update({ status: 'commented' })
          .eq('id', proposal.id);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'approve') {
      const approvedBy = sanitizeText(body.approvedBy, { maxLength: 120 });
      const approvedEmail = sanitizeEmail(body.approvedEmail);
      const requestPayment = body.requestPayment === true;
      if (!approvedBy) {
        return NextResponse.json({ error: 'Approver name is required' }, { status: 400 });
      }

      const { error: approveError } = await supabaseAdmin
        .from('proposals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: approvedBy,
        })
        .eq('id', proposal.id);

      if (approveError) {
        logError("[proposals] approve error", approveError);
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
      }

      if (proposal.organization_id) {
        trackFunnelEvent({
          supabase: supabaseAdmin,
          organizationId: proposal.organization_id,
          eventType: 'payment_initiated',
          profileId: proposal.client_id,
          metadata: {
            proposal_id: proposal.id,
            approved_by: approvedBy,
            request_payment: requestPayment,
          },
        });
      }

      let paymentRequestQueued = false;
      let paymentRequestError: string | undefined;
      let paymentLinkUrl: string | null = null;
      let paymentLinkToken: string | null = null;
      let approvedTravelerName: string | null = null;
      if (requestPayment) {
        const nowIso = new Date().toISOString();
        let operatorUserId: string | null = null;
        let clientName: string | null = null;
        let clientPhone: string | null = null;
        let clientEmail: string | null = approvedEmail;

        if (proposal.created_by) {
          const { data: operatorProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', proposal.created_by)
            .maybeSingle();

          if (operatorProfile) {
            operatorUserId = sanitizeIdentifier(operatorProfile.id);
          }
        }

        if (proposal.client_id) {
          const { data: clientProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email, phone, phone_whatsapp')
            .eq('id', proposal.client_id)
            .maybeSingle();

          if (clientProfile) {
            clientName = sanitizeText(clientProfile.full_name, { maxLength: 120 });
            clientPhone = sanitizePhone(clientProfile.phone_whatsapp) || sanitizePhone(clientProfile.phone);
            clientEmail = clientEmail || sanitizeEmail(clientProfile.email);
          }
        }

        approvedTravelerName = clientName;

        const quotedAmount = Math.round(
          (proposal.client_selected_price ?? proposal.total_price ?? 0) * 100
        );

        if (!proposal.organization_id || !operatorUserId || quotedAmount <= 0) {
          paymentRequestError =
            'Unable to create a payment link for this proposal yet. Please contact the operator.';
        } else {
          try {
            const { link } = await createPaymentLinkRecord(supabaseAdmin, {
              organizationId: proposal.organization_id,
              createdBy: operatorUserId,
              proposalId: proposal.id,
              clientId: proposal.client_id || undefined,
              clientName: clientName || approvedBy,
              clientPhone: clientPhone || undefined,
              clientEmail: clientEmail || undefined,
              amount: quotedAmount,
              currency: 'INR',
              description: `${proposal.title} payment`,
              baseUrl: new URL(request.url).origin,
            });

            paymentLinkUrl = link.paymentUrl;
            paymentLinkToken = link.token;
            paymentRequestQueued = true;

            if (clientPhone) {
              const { data: connection } = await supabaseAdmin
                .from("whatsapp_connections")
                .select("session_name, session_token, status")
                .eq("organization_id", proposal.organization_id)
                .maybeSingle();

              if (
                connection?.status === "connected" &&
                connection.session_name &&
                connection.session_token
              ) {
                const travelerName = clientName || approvedBy;
                const amountLabel = `₹${(quotedAmount / 100).toLocaleString("en-IN")}`;
                await sendEvolutionText(
                  connection.session_name,
                  clientPhone,
                  `Hi ${travelerName}, your proposal "${proposal.title}" has been approved.\n\nPay securely here: ${link.paymentUrl}\nAmount due: ${amountLabel}\n\nIf you need help before paying, reply to this message.`,
                );

                await recordPaymentLinkEvent(supabaseAdmin, {
                  token: link.token,
                  event: "sent",
                  baseUrl: new URL(request.url).origin,
                  metadata: {
                    channel: "whatsapp",
                    sent_at: nowIso,
                  },
                });
              }
            }
          } catch (paymentError) {
            logError("[proposals] payment link error", paymentError);
            paymentRequestError = "Failed to create payment link";
          }
        }
      }

      void captureServerAnalyticsEvent({
        event: 'proposal_approved',
        distinctId: proposal.client_id || proposal.id,
        properties: {
          proposal_id: proposal.id,
          organization_id: proposal.organization_id,
          approved_by: approvedBy,
          request_payment: requestPayment,
        },
      });

      const operatorContact = await loadOperatorContact(proposal.organization_id, proposal.created_by);
      if (operatorContact?.email) {
        const travelerName = approvedTravelerName || approvedBy;
        void sendProposalApprovedNotification({
          to: operatorContact.email,
          operatorName: operatorContact.name,
          travelerName,
          proposalTitle: proposal.title,
          paymentUrl: paymentLinkUrl,
        });
      }

      return NextResponse.json({
        success: true,
        status: 'approved',
        request_payment: requestPayment,
        payment_request_queued: paymentRequestQueued,
        payment_link_url: paymentLinkUrl,
        payment_link_token: paymentLinkToken,
        warning: paymentRequestError,
      });
    }

    if (action === 'reject') {
      const rejectedBy = sanitizeText(body.rejectedBy, { maxLength: 120 }) || 'Traveler';

      const { error: rejectError } = await supabaseAdmin
        .from('proposals')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);

      if (rejectError) {
        logError("[proposals] reject error", rejectError);
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
      }

      const operatorContact = await loadOperatorContact(proposal.organization_id, proposal.created_by);
      if (operatorContact?.email) {
        void sendProposalRejectedNotification({
          to: operatorContact.email,
          operatorName: operatorContact.name,
          travelerName: rejectedBy,
          proposalTitle: proposal.title,
        });
      }

      return NextResponse.json({
        success: true,
        status: 'rejected',
      });
    }

    if (action === 'selectTier') {
      const tierValue = sanitizeText(body.tier, { maxLength: 20 });
      const validTiers: ProposalPackageTier[] = ['core', 'plus', 'signature'];
      if (!tierValue || !validTiers.includes(tierValue as ProposalPackageTier)) {
        return NextResponse.json(
          { error: 'Invalid tier. Must be core, plus, or signature' },
          { status: 400 }
        );
      }

      if (proposal.status === 'approved' || proposal.status === 'converted') {
        return NextResponse.json(
          { error: 'Cannot change tier on an approved or converted proposal' },
          { status: 400 }
        );
      }

      const tier = tierValue as ProposalPackageTier;
      const pricing = parseTierPricing(proposal.tier_pricing);
      const price = tierPrice(pricing, tier);

      const updatePayload: { package_tier: string; client_selected_price?: number } = {
        package_tier: tier,
      };
      if (price !== null) {
        updatePayload.client_selected_price = price;
      }

      const { error: tierError } = await supabaseAdmin
        .from('proposals')
        .update(updatePayload)
        .eq('id', proposal.id);

      if (tierError) {
        logError("[proposals] select tier error", tierError);
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        package_tier: tier,
        client_selected_price: price,
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    logError("Error processing public proposal action", error);
    return NextResponse.json(
      {
        error: 'Failed to process proposal',
      },
      { status: 500 }
    );
  }
}
