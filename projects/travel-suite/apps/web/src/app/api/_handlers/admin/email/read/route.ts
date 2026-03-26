/* ------------------------------------------------------------------
 * POST /api/admin/email/read
 * Mark an email thread as read.
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

interface ReadBody {
    threadId: string;
}

export async function POST(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const orgId = auth.organizationId!;
        const raw = (await request.json()) as Partial<ReadBody>;

        if (!raw.threadId || typeof raw.threadId !== "string") {
            return apiError("'threadId' is required", 400);
        }

        const provider = await getEmailProvider(orgId);
        if (!provider) {
            return apiError("Email not connected", 422);
        }

        const success = await provider.markAsRead(raw.threadId);
        if (!success) {
            return apiError("Failed to mark thread as read", 502);
        }

        return apiSuccess({ threadId: raw.threadId, markedRead: true });
    } catch (err) {
        logError("[email/read] Failed", err);
        return apiError("Failed to mark email as read", 500);
    }
}
