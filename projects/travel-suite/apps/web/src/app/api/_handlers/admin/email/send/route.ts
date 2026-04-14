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

        // Append professional org signature
        const admin = createAdminClient();
        const [{ data: org }, { data: senderProfile }] = await Promise.all([
            admin
                .from("organizations")
                .select("name, logo_url, legal_name, billing_city, billing_state")
                .eq("id", orgId)
                .single(),
            admin
                .from("profiles")
                .select("full_name, role, phone_normalized")
                .eq("id", auth.userId)
                .single(),
        ]);
        const orgRow = org as { name?: string; logo_url?: string; legal_name?: string; billing_city?: string; billing_state?: string } | null;
        const profileRow = senderProfile as { full_name?: string; role?: string; phone_normalized?: string } | null;
        const senderEmail = provider.getEmail();

        const signatureHtml = buildSignatureHtml({
            senderName: profileRow?.full_name ?? null,
            senderRole: profileRow?.role ?? null,
            senderPhone: profileRow?.phone_normalized ?? null,
            senderEmail,
            orgName: orgRow?.name ?? null,
            orgLogoUrl: orgRow?.logo_url ?? null,
            orgCity: orgRow?.billing_city ?? null,
            orgState: orgRow?.billing_state ?? null,
        });

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

interface SignatureData {
    readonly senderName: string | null;
    readonly senderRole: string | null;
    readonly senderPhone: string | null;
    readonly senderEmail: string;
    readonly orgName: string | null;
    readonly orgLogoUrl: string | null;
    readonly orgCity: string | null;
    readonly orgState: string | null;
}

function buildSignatureHtml(data: SignatureData): string {
    const lines: string[] = [];

    // Sender name + role
    const nameParts: string[] = [];
    if (data.senderName) nameParts.push(`<strong>${escapeHtml(data.senderName)}</strong>`);
    if (data.senderRole && data.senderRole !== "admin") nameParts.push(escapeHtml(data.senderRole));
    if (nameParts.length > 0) lines.push(nameParts.join(" · "));

    // Organization name
    if (data.orgName) lines.push(escapeHtml(data.orgName));

    // Location
    const locationParts: string[] = [];
    if (data.orgCity) locationParts.push(escapeHtml(data.orgCity));
    if (data.orgState) locationParts.push(escapeHtml(data.orgState));
    if (locationParts.length > 0) lines.push(locationParts.join(", "));

    // Contact info
    const contactParts: string[] = [];
    if (data.senderEmail) contactParts.push(escapeHtml(data.senderEmail));
    if (data.senderPhone) {
        const formatted = data.senderPhone.length > 10
            ? `+${data.senderPhone.slice(0, 2)} ${data.senderPhone.slice(2, 7)} ${data.senderPhone.slice(7)}`
            : data.senderPhone;
        contactParts.push(escapeHtml(formatted));
    }
    if (contactParts.length > 0) lines.push(contactParts.join(" | "));

    if (lines.length === 0) return "";

    // Logo (optional)
    const logoHtml = data.orgLogoUrl
        ? `<img src="${escapeHtml(data.orgLogoUrl)}" alt="${escapeHtml(data.orgName ?? "")}" width="80" height="auto" style="margin-bottom:8px;border-radius:4px" /><br/>`
        : "";

    return `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:sans-serif;font-size:12px;color:#6b7280;line-height:1.6">${logoHtml}${lines.join("<br/>")}</div>`;
}
