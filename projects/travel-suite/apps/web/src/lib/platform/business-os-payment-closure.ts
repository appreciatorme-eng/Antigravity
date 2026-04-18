import { createAdminClient } from "@/lib/supabase/admin";
import { loadCommsSequences, updateCommsSequence } from "@/lib/platform/business-comms";
import { recordPaymentLinkEvent } from "@/lib/payments/payment-links.server";

export type CapturedPaymentEntity = {
    id: string;
    order_id: string;
};

type PaymentClosureLogger = {
    info?: (message: string, extra?: Record<string, unknown>) => void;
    error?: (message: string, error: unknown, extra?: Record<string, unknown>) => void;
};

export async function syncCapturedPaymentLinks(
    supabase: ReturnType<typeof createAdminClient>,
    payment: CapturedPaymentEntity,
    logger: PaymentClosureLogger = {},
): Promise<string | null> {
    const orderId = payment.order_id?.trim();
    if (!orderId) return null;

    const { data: links, error } = await supabase
        .from("payment_links")
        .select("token, organization_id, status")
        .eq("razorpay_order_id", orderId)
        .limit(20);

    if (error) {
        logger.error?.("Failed to lookup payment links for captured payment", error, {
            payment_event_type: "payment.captured",
            payment_order_id: orderId,
        });
        return null;
    }

    let matchedOrgId: string | null = null;
    let markedPaid = 0;
    for (const link of links ?? []) {
        matchedOrgId = matchedOrgId ?? link.organization_id ?? null;
        if (!link.token || (link.status !== "pending" && link.status !== "viewed")) continue;
        try {
            await recordPaymentLinkEvent(supabase as never, {
                token: link.token,
                event: "paid",
                razorpayPaymentId: payment.id,
                metadata: {
                    source: "payments_webhook",
                    payment_event_type: "payment.captured",
                },
                _callerVerified: true,
            });
            markedPaid += 1;
        } catch (err) {
            logger.error?.("Failed to mark payment link as paid from captured webhook", err, {
                payment_event_type: "payment.captured",
                payment_order_id: orderId,
                payment_link_token: link.token,
            });
        }
    }

    if (markedPaid > 0) {
        logger.info?.("Marked payment links as paid from captured webhook", {
            payment_event_type: "payment.captured",
            payment_order_id: orderId,
            links_marked_paid: markedPaid,
        });
    }

    return matchedOrgId;
}

export async function autoCloseCollectionsWorkItems(
    supabase: ReturnType<typeof createAdminClient>,
    organizationId: string,
    paymentId: string,
    logger: PaymentClosureLogger = {},
): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- god_work_items not present in generated payment webhook db type
        const rawDb = supabase as any;
        const { data: items } = await rawDb
            .from("god_work_items")
            .select("id, metadata, status")
            .eq("org_id", organizationId)
            .eq("kind", "collections")
            .in("status", ["open", "in_progress", "blocked", "snoozed"]);

        if (!items || items.length === 0) return;

        await Promise.all(
            (items as Array<{ id: string; metadata: unknown }>).map((item) =>
                rawDb
                    .from("god_work_items")
                    .update({
                        status: "done",
                        metadata: {
                            ...((item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata))
                                ? item.metadata
                                : {}),
                            auto_closed: true,
                            auto_closed_reason: "payment_captured",
                            auto_closed_payment_id: paymentId,
                            auto_closed_at: new Date().toISOString(),
                            source: "payments_webhook",
                        },
                    })
                    .eq("id", item.id),
            ),
        );

        logger.info?.("Auto-closed collections work items after payment", {
            payment_event_type: "payment.captured",
            organization_id: organizationId,
            work_items_closed: items.length,
        });
    } catch (err) {
        logger.error?.("Failed to auto-close collections work items", err, {
            payment_event_type: "payment.captured",
            organization_id: organizationId,
        });
    }
}

export async function autoCloseCollectionsSequence(
    supabase: ReturnType<typeof createAdminClient>,
    organizationId: string,
    paymentId: string,
    logger: PaymentClosureLogger = {},
): Promise<void> {
    try {
        const sequences = await loadCommsSequences(supabase as never, organizationId, "active");
        const collectionsSequences = sequences.filter((seq) => seq.sequence_type === "collections");
        if (collectionsSequences.length === 0) return;

        await Promise.all(
            collectionsSequences.map((seq) =>
                updateCommsSequence(supabase as never, seq.id, {
                    status: "completed",
                    metadata: {
                        ...(seq.metadata ?? {}),
                        auto_closed: true,
                        auto_closed_reason: "payment_captured",
                        auto_closed_payment_id: paymentId,
                        auto_closed_at: new Date().toISOString(),
                    },
                }),
            ),
        );

        logger.info?.("Auto-closed collections sequences after payment", {
            payment_event_type: "payment.captured",
            organization_id: organizationId,
            sequences_closed: collectionsSequences.length,
        });
    } catch (err) {
        logger.error?.("Failed to auto-close collections sequences", err, {
            payment_event_type: "payment.captured",
            organization_id: organizationId,
        });
    }
}
