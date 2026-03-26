/* ------------------------------------------------------------------
 * POST /api/admin/email/send
 * Send an email via the operator's connected Gmail account.
 * Requires admin role with organization + connected Gmail.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendViaGmail, getGmailEmail } from "@/lib/email/gmail-send";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

interface SendEmailBody {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId } = auth;
        const orgId = organizationId!;

        const raw = (await request.json()) as Partial<SendEmailBody>;

        if (!raw.to || !isValidEmail(raw.to)) {
            return apiError("Valid 'to' email address is required", 400);
        }
        if (!raw.subject || typeof raw.subject !== "string") {
            return apiError("'subject' is required", 400);
        }
        if (!raw.body || typeof raw.body !== "string") {
            return apiError("'body' is required", 400);
        }

        // Wrap plain text in minimal HTML
        const htmlBody = raw.body.startsWith("<")
            ? raw.body
            : `<div style="font-family:sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(raw.body)}</div>`;

        const replyHeaders = raw.threadId || raw.inReplyTo
            ? {
                threadId: raw.threadId,
                inReplyTo: raw.inReplyTo,
                references: raw.references ?? raw.inReplyTo,
            }
            : undefined;

        // Append org signature
        const admin = createAdminClient();
        const { data: org } = await admin
            .from("organizations")
            .select("name")
            .eq("id", orgId)
            .single();
        const senderEmail = await getGmailEmail(orgId) ?? "";
        const orgName = org?.name ?? "";
        const signatureHtml = orgName || senderEmail
            ? `<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-family:sans-serif;font-size:12px;color:#6b7280">${escapeHtml(orgName)}${orgName && senderEmail ? "<br/>" : ""}${escapeHtml(senderEmail)}</div>`
            : "";

        const messageId = await sendViaGmail(orgId, raw.to, raw.subject, htmlBody + signatureHtml, undefined, replyHeaders);

        if (!messageId) {
            return apiError("Gmail not connected or send failed. Connect Gmail in Settings.", 422);
        }

        return apiSuccess({
            message: {
                id: messageId,
                type: "text",
                direction: "out",
                body: raw.body,
                subject: raw.subject,
                timestamp: new Date().toISOString(),
                status: "sent",
            },
        });
    } catch (err) {
        logError("[email/send] Failed", err);
        return apiError("Failed to send email", 500);
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
