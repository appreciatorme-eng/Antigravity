/* ------------------------------------------------------------------
 * POST /api/admin/email/send
 * Send an email via the operator's connected email account.
 * Supports Gmail API (OAuth) and IMAP/SMTP (app password).
 * Requires admin role with organization + connected email.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailProvider } from "@/lib/email/gmail-auth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

interface SendEmailAttachment {
    filename: string;
    content: string; // base64-encoded
    contentType: string;
}

interface SendEmailBody {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
    references?: string;
    attachments?: SendEmailAttachment[];
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

        // Reject oversized attachments (Gmail limit: 25MB; base64 inflates ~33%)
        if (raw.attachments && raw.attachments.length > 0) {
            const totalBytes = raw.attachments.reduce((sum, att) => sum + (att.content?.length ?? 0) * 0.75, 0);
            if (totalBytes > 20 * 1024 * 1024) {
                return apiError("Attachments exceed 20MB limit. Remove some files and try again.", 413);
            }
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

        // Get email provider
        const provider = await getEmailProvider(orgId);
        if (!provider) {
            return apiError("Email not connected. Connect your email in Settings.", 422);
        }

        // Append org signature
        const admin = createAdminClient();
        const { data: org } = await admin
            .from("organizations")
            .select("name")
            .eq("id", orgId)
            .single();
        const senderEmail = provider.getEmail();
        const orgName = org?.name ?? "";
        const signatureHtml = orgName || senderEmail
            ? `<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;font-family:sans-serif;font-size:12px;color:#6b7280">${escapeHtml(orgName)}${orgName && senderEmail ? "<br/>" : ""}${escapeHtml(senderEmail)}</div>`
            : "";

        const messageId = await provider.sendEmail({
            to: raw.to,
            cc: raw.cc,
            bcc: raw.bcc,
            subject: raw.subject,
            htmlBody: htmlBody + signatureHtml,
            attachments: raw.attachments?.map((att) => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType,
            })),
            replyHeaders,
        });

        if (!messageId) {
            return apiError("Failed to send email. Please try again.", 422);
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
