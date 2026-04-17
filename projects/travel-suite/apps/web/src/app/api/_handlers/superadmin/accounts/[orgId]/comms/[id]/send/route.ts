import { createElement } from "react";
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { sendEmailForOrg } from "@/lib/email/send";
import { loadCommsSequences, updateCommsSequence } from "@/lib/platform/business-comms";
import { getAccountDetail, loadGodWorkItems, updateGodWorkItem } from "@/lib/platform/god-accounts";
import { runBusinessOsEventAutomation } from "@/lib/platform/business-os";
import { getClientIpFromRequest, logPlatformActionWithTarget } from "@/lib/platform/audit";
import { recordOrgActivityEvent } from "@/lib/platform/org-memory";
import { logError } from "@/lib/observability/logger";
import { ensureCollectionsPaymentLink } from "@/lib/payments/payment-links.server";

function normalizeMetadata(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function parseEmailDraft(value: string): { subject: string; body: string } {
    const trimmed = value.trim();
    if (!trimmed) {
        return {
            subject: "Trip Built update",
            body: "We have an update from Trip Built Ops.",
        };
    }
    if (!trimmed.toLowerCase().startsWith("subject:")) {
        return {
            subject: "Trip Built update",
            body: trimmed,
        };
    }
    const [subjectLine, ...rest] = trimmed.split("\n");
    return {
        subject: subjectLine.replace(/^subject:\s*/i, "").trim() || "Trip Built update",
        body: rest.join("\n").trim() || "We have an update from Trip Built Ops.",
    };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string; id: string }> },
) {
    const auth = await requireSuperAdmin(request);
    if (!auth.ok) return auth.response;

    const { orgId, id } = await params;

    try {
        const detail = await getAccountDetail(auth.adminClient as never, orgId);
        if (!detail) return apiError("Account not found", 404);

        const sequenceList = await loadCommsSequences(auth.adminClient as never, orgId, "all");
        const commsSequence = sequenceList.find((item) => item.id === id) ?? null;
        if (!commsSequence) return apiError("Communication sequence not found", 404);

        const metadata = normalizeMetadata(commsSequence.metadata) ?? {};
        if (metadata.send_state !== "approved_pending_send") {
            return apiError("Sequence is not approved for send", 409);
        }
        if (commsSequence.last_sent_at) {
            return apiError("Sequence has already been sent", 409);
        }
        if (commsSequence.channel !== "email" && commsSequence.channel !== "mixed") {
            return apiError("This sequence does not have an automated send adapter yet", 409);
        }

        const recipient = detail.members.find((member) => member.email && !member.is_suspended);
        if (!recipient?.email) {
            return apiError("No valid recipient email found for this account", 409);
        }

        const draftBody = typeof metadata.draft_body === "string" ? metadata.draft_body : "";
        const sequenceType = typeof metadata.sequence_type === "string" ? metadata.sequence_type : commsSequence.sequence_type ?? "";
        const overdueBalance = typeof detail.snapshot?.overdue_balance === "number" ? detail.snapshot.overdue_balance : 0;
        const orgName = detail.organization.name;

        let paymentLinkUrl: string | null = null;
        let paymentLinkToken: string | null = null;
        let paymentLinkId: string | null = null;
        let paymentLinkStatus: string | null = null;
        if (sequenceType === "collections" && overdueBalance > 0) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tripbuilt.com";
                const link = await ensureCollectionsPaymentLink(auth.adminClient as never, {
                    organizationId: orgId,
                    createdBy: auth.userId,
                    amountInr: overdueBalance,
                    description: `Outstanding balance — ${orgName}`,
                    clientName: orgName,
                    clientEmail: recipient.email ?? undefined,
                    baseUrl,
                });
                paymentLinkUrl = link.paymentUrl;
                paymentLinkToken = link.token;
                paymentLinkId = link.id;
                paymentLinkStatus = link.status;
            } catch (err) {
                logError("[comms/send] Failed to create collections payment link", err);
            }
        }

        const bodyWithPaymentLink = paymentLinkUrl && !draftBody.includes(paymentLinkUrl)
            ? `${draftBody}\n\n💳 Pay now: ${paymentLinkUrl}`
            : draftBody;

        const { subject, body } = parseEmailDraft(bodyWithPaymentLink);
        const sent = await sendEmailForOrg({
            orgId,
            to: recipient.email,
            subject,
            react: createElement(
                "div",
                {
                    style: {
                        fontFamily: "Arial, sans-serif",
                        backgroundColor: "#0b1020",
                        color: "#f5f5f5",
                        padding: "24px",
                        lineHeight: 1.6,
                    },
                },
                createElement("div", {
                    style: {
                        maxWidth: "640px",
                        margin: "0 auto",
                        backgroundColor: "#111827",
                        border: "1px solid #1f2937",
                        borderRadius: "16px",
                        padding: "24px",
                        whiteSpace: "pre-wrap",
                    },
                }, body),
            ),
        });
        if (!sent) {
            return apiError("Failed to send email", 502);
        }

        const now = new Date().toISOString();
        const updatedSequence = await updateCommsSequence(auth.adminClient as never, id, {
            status: "active",
            last_sent_at: now,
            step_index: commsSequence.step_index + 1,
            next_follow_up_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
            metadata: {
                ...metadata,
                send_state: "sent",
                sent_at: now,
                sent_by: auth.userId,
                sent_via: "email",
                recipient_email: recipient.email,
                recipient_name: recipient.full_name ?? null,
                payment_link_url: paymentLinkUrl,
                payment_link_token: paymentLinkToken,
                payment_link_id: paymentLinkId,
                payment_link_status: paymentLinkStatus,
            },
        });
        if (!updatedSequence) return apiError("Failed to update sent sequence", 500);

        const activeWorkItems = await loadGodWorkItems(auth.adminClient as never, {
            orgIds: [orgId],
            status: "active",
            limit: 50,
        });
        const linkedWorkItem = activeWorkItems.find((item) => {
            const workMetadata = normalizeMetadata(item.metadata);
            return workMetadata?.comms_sequence_id === id
                || (typeof metadata.approval_id === "string" && workMetadata?.approval_id === metadata.approval_id);
        }) ?? null;
        if (linkedWorkItem) {
            await updateGodWorkItem(auth.adminClient as never, linkedWorkItem.id, {
                status: "done",
                metadata: {
                    ...(normalizeMetadata(linkedWorkItem.metadata) ?? {}),
                    delivery_state: "sent",
                    delivery_sent_at: now,
                },
            });
        }

        await logPlatformActionWithTarget(
            auth.userId,
            `Sent approved customer communication for org ${orgId}`,
            "automation",
            "organization",
            orgId,
            {
                comms_sequence_id: id,
                work_item_id: linkedWorkItem?.id ?? null,
                recipient_email: recipient.email,
                channel: "email",
            },
            getClientIpFromRequest(request),
        );
        await recordOrgActivityEvent(auth.adminClient as never, {
            org_id: orgId,
            actor_id: auth.userId,
            event_type: "comms_sequence_sent",
            title: "Sent approved customer communication",
            detail: `${subject} → ${recipient.email}`,
            entity_type: "comms_sequence",
            entity_id: id,
            source: "business_os_autopilot",
            metadata: {
                recipient_email: recipient.email,
                work_item_id: linkedWorkItem?.id ?? null,
                approval_id: typeof metadata.approval_id === "string" ? metadata.approval_id : null,
            },
        });

        const automation = await runBusinessOsEventAutomation(auth.adminClient as never, {
            orgId,
            currentUserId: auth.userId,
            trigger: "comms_updated",
        });

        return NextResponse.json({
            sequence: updatedSequence,
            work_item_id: linkedWorkItem?.id ?? null,
            recipient_email: recipient.email,
            automation,
        }, { status: 201 });
    } catch (error) {
        logError("[superadmin/accounts/:orgId/comms/:id/send POST]", error);
        return apiError("Failed to send communication sequence", 500);
    }
}
