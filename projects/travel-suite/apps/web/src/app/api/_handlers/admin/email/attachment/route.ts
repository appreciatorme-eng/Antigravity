/* ------------------------------------------------------------------
 * GET /api/admin/email/attachment?messageId=X&attachmentId=Y
 * Proxies an email attachment download.
 * Supports Gmail API (OAuth) and IMAP/SMTP (app password).
 * Requires admin role with organization + connected email.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { getEmailProvider } from "@/lib/email/gmail-auth";
import { apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

export async function GET(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const orgId = auth.organizationId!;
        const url = new URL(request.url);
        const messageId = url.searchParams.get("messageId");
        const attachmentId = url.searchParams.get("attachmentId");
        const filename = url.searchParams.get("filename") ?? "attachment";
        const mimeType = url.searchParams.get("mimeType") ?? "application/octet-stream";

        if (!messageId || !attachmentId) {
            return apiError("'messageId' and 'attachmentId' are required", 400);
        }

        const provider = await getEmailProvider(orgId);
        if (!provider) return apiError("Email not connected", 422);

        const buffer = await provider.getAttachment(messageId, attachmentId);
        if (!buffer) {
            return apiError("Attachment not found or empty", 404);
        }

        return new Response(new Uint8Array(buffer), {
            headers: {
                "Content-Type": mimeType,
                "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
                "Content-Length": String(buffer.length),
                "Cache-Control": "private, max-age=3600",
            },
        });
    } catch (err) {
        logError("[email/attachment] Failed", err);
        return apiError("Failed to download attachment", 500);
    }
}
