/* ------------------------------------------------------------------
 * GET /api/admin/email/attachment?messageId=X&attachmentId=Y
 * Proxies a Gmail attachment download. Returns binary with correct
 * Content-Type and Content-Disposition headers.
 * Requires admin role with organization + connected Gmail.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { getGmailConnection, getValidAccessToken } from "@/lib/email/gmail-auth";
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

        const conn = await getGmailConnection(orgId);
        if (!conn) return apiError("Gmail not connected", 422);

        const accessToken = await getValidAccessToken(conn);

        const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (!res.ok) {
            const errText = await res.text();
            logError(`[email/attachment] Gmail API error ${res.status}`, errText);
            return apiError("Failed to fetch attachment", 502);
        }

        const data = (await res.json()) as { data?: string; size?: number };
        if (!data.data) {
            return apiError("Attachment data is empty", 404);
        }

        // Gmail returns base64url-encoded data
        const base64 = data.data.replace(/-/g, "+").replace(/_/g, "/");
        const buffer = Buffer.from(base64, "base64");

        return new Response(buffer, {
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
