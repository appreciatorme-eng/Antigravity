/* ------------------------------------------------------------------
 * POST /api/admin/email/read
 * Mark a Gmail thread as read (removes UNREAD label from all messages).
 * Requires admin role with organization + connected Gmail.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { getGmailConnection, getValidAccessToken } from "@/lib/email/gmail-auth";
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

        const { organizationId } = auth;
        const orgId = organizationId!;

        const raw = (await request.json()) as Partial<ReadBody>;

        if (!raw.threadId || typeof raw.threadId !== "string") {
            return apiError("'threadId' is required", 400);
        }

        const conn = await getGmailConnection(orgId);
        if (!conn) {
            return apiError("Gmail not connected", 422);
        }

        const accessToken = await getValidAccessToken(conn);

        const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/threads/${raw.threadId}/modify`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    removeLabelIds: ["UNREAD"],
                }),
            },
        );

        if (!res.ok) {
            const errText = await res.text();
            logError(`[email/read] Gmail API error ${res.status}`, errText);
            return apiError("Failed to mark thread as read", 502);
        }

        return apiSuccess({ threadId: raw.threadId, markedRead: true });
    } catch (err) {
        logError("[email/read] Failed", err);
        return apiError("Failed to mark email as read", 500);
    }
}
