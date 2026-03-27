/* ------------------------------------------------------------------
 * POST /api/admin/email/delete
 * Delete or archive an email message.
 * Supports Gmail API (OAuth) and IMAP/SMTP (app password).
 * Requires admin role with organization + connected email.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { getEmailProvider } from "@/lib/email/gmail-auth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

interface DeleteBody {
    messageId: string;
    action: "delete" | "archive";
}

export async function POST(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const orgId = auth.organizationId!;
        const raw = (await request.json()) as Partial<DeleteBody>;

        if (!raw.messageId || typeof raw.messageId !== "string") {
            return apiError("'messageId' is required", 400);
        }

        const action = raw.action === "archive" ? "archive" : "delete";

        const provider = await getEmailProvider(orgId);
        if (!provider) {
            return apiError("Email not connected", 422);
        }

        let success = false;

        if (action === "archive" && provider.archiveMessage) {
            success = await provider.archiveMessage(raw.messageId);
        } else if (action === "delete" && provider.deleteMessage) {
            success = await provider.deleteMessage(raw.messageId);
        } else {
            return apiError(`${action} is not supported for this email provider`, 422);
        }

        if (!success) {
            return apiError(`Failed to ${action} email`, 502);
        }

        return apiSuccess({ messageId: raw.messageId, action });
    } catch (err) {
        logError("[email/delete] Failed", err);
        return apiError("Failed to process email action", 500);
    }
}
