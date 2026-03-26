/* ------------------------------------------------------------------
 * GET /api/admin/email/conversations
 * Returns Gmail threads as ChannelConversation[] for the unified inbox.
 * Requires admin role with organization.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { fetchGmailThreads, type GmailMessageParsed } from "@/lib/email/gmail-read";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Gmail → Inbox mapping
// ---------------------------------------------------------------------------

interface InboxMessage {
    readonly id: string;
    readonly type: "text";
    readonly direction: "in" | "out";
    readonly body: string;
    readonly subject?: string;
    readonly timestamp: string;
    readonly status: "sent" | "delivered" | "read";
    readonly messageIdHeader?: string | null;
}

interface InboxContact {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
    readonly type: "client";
    readonly email?: string;
    readonly avatarColor?: string;
}

interface InboxConversation {
    readonly id: string;
    readonly channel: "email";
    readonly unreadCount: number;
    readonly contact: InboxContact;
    readonly messages: readonly InboxMessage[];
    readonly threadId: string;
    readonly subject: string;
    readonly lastMessageIdHeader: string | null;
}

const AVATAR_COLORS = [
    "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
    "#8b5cf6", "#ef4444", "#14b8a6", "#f97316", "#06b6d4",
];

function hashColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function mapMessage(
    msg: GmailMessageParsed,
    connectedEmail: string,
): InboxMessage {
    const isOutbound = msg.fromEmail.toLowerCase() === connectedEmail.toLowerCase();
    // Prefer plain text for inbox display, fall back to stripped HTML
    let body = msg.bodyText || msg.snippet;
    if (!body && msg.bodyHtml) {
        body = msg.bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }

    return {
        id: msg.id,
        type: "text",
        direction: isOutbound ? "out" : "in",
        body,
        subject: msg.subject || undefined,
        timestamp: msg.date,
        status: "read",
        messageIdHeader: msg.messageIdHeader,
    };
}

function threadsToConversations(
    threads: readonly import("@/lib/email/gmail-read").GmailThread[],
    connectedEmail: string,
): InboxConversation[] {
    return threads.map((thread) => {
        const messages = thread.messages.map((m) => mapMessage(m, connectedEmail));

        // The contact is the first non-self participant
        const counterpart = thread.messages.find(
            (m) => m.fromEmail.toLowerCase() !== connectedEmail.toLowerCase(),
        );
        const contactEmail = counterpart?.fromEmail ?? thread.messages[0].fromEmail;
        const contactName = counterpart?.from ?? thread.messages[0].from;

        const unreadCount = thread.messages.filter(
            (m) => m.labelIds.includes("UNREAD") && m.fromEmail.toLowerCase() !== connectedEmail.toLowerCase(),
        ).length;

        const subject = thread.messages[0]?.subject || "(No subject)";
        const lastMsg = thread.messages[thread.messages.length - 1];

        return {
            id: `email_${thread.id}`,
            channel: "email" as const,
            unreadCount,
            threadId: thread.id,
            subject,
            lastMessageIdHeader: lastMsg?.messageIdHeader ?? null,
            contact: {
                id: `email_contact_${contactEmail}`,
                name: contactName || contactEmail,
                phone: "",
                type: "client" as const,
                email: contactEmail,
                avatarColor: hashColor(contactEmail),
            },
            messages,
        };
    });
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<Response> {
    try {
        const auth = await requireAdmin(request, { requireOrganization: true });
        if (!auth.ok) return auth.response;

        const { organizationId } = auth;
        const orgId = organizationId!;

        const url = new URL(request.url);
        const pageToken = url.searchParams.get("pageToken") ?? undefined;
        const maxResults = Math.min(
            Number(url.searchParams.get("maxResults") ?? "20"),
            50,
        );

        const result = await fetchGmailThreads(orgId, {
            query: "in:inbox newer_than:30d",
            maxResults,
            pageToken,
        });

        if (!result) {
            return apiSuccess({ conversations: [], gmailConnected: false });
        }

        // Get the connected email to determine in/out direction
        const { getGmailEmail } = await import("@/lib/email/gmail-send");
        const connectedEmail = await getGmailEmail(orgId) ?? "";

        const conversations = threadsToConversations(result.threads, connectedEmail);

        return apiSuccess({
            conversations,
            gmailConnected: true,
            nextPageToken: result.nextPageToken,
        });
    } catch (err) {
        logError("[email/conversations] Failed", err);
        return apiError("Failed to load email conversations", 500);
    }
}
