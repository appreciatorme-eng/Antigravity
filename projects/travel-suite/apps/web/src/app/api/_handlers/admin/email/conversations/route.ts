/* ------------------------------------------------------------------
 * GET /api/admin/email/conversations
 * Returns email threads as ChannelConversation[] for the unified inbox.
 * Supports both Gmail API (OAuth) and IMAP/SMTP (app password).
 * Requires admin role with organization.
 * ------------------------------------------------------------------ */

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { GmailAuthExpiredError, getEmailProvider } from "@/lib/email/gmail-auth";
import type { EmailMessage } from "@/lib/email/provider";
import { apiSuccess, apiError } from "@/lib/api/response";
import { logError } from "@/lib/observability/logger";

// ---------------------------------------------------------------------------
// Gmail → Inbox mapping
// ---------------------------------------------------------------------------

interface InboxAttachment {
    readonly attachmentId: string;
    readonly filename: string;
    readonly mimeType: string;
    readonly size: number;
}

interface InboxMessage {
    readonly id: string;
    readonly type: "text";
    readonly direction: "in" | "out";
    readonly body: string;
    readonly subject?: string;
    readonly timestamp: string;
    readonly status: "sent" | "delivered" | "read";
    readonly messageIdHeader?: string | null;
    readonly attachments?: readonly InboxAttachment[];
}

interface InboxContact {
    readonly id: string;
    readonly name: string;
    readonly phone: string;
    readonly type: "client" | "driver" | "lead";
    readonly email?: string;
    readonly avatarColor?: string;
}

interface CrmProfile {
    readonly id: string;
    readonly full_name: string | null;
    readonly email: string | null;
    readonly phone_normalized: string | null;
    readonly role: string | null;
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
    msg: EmailMessage,
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
        attachments: msg.attachments.length > 0 ? msg.attachments : undefined,
    };
}

function threadsToConversations(
    threads: readonly import("@/lib/email/provider").EmailThread[],
    connectedEmail: string,
    profileMap: ReadonlyMap<string, CrmProfile>,
): InboxConversation[] {
    return threads.map((thread) => {
        const messages = thread.messages.map((m) => mapMessage(m, connectedEmail));

        // The contact is the first non-self participant
        const counterpart = thread.messages.find(
            (m) => m.fromEmail.toLowerCase() !== connectedEmail.toLowerCase(),
        );
        const contactEmail = counterpart?.fromEmail ?? thread.messages[0].fromEmail;
        const contactName = counterpart?.from ?? thread.messages[0].from;

        // Match against CRM profiles by email
        const profile = profileMap.get(contactEmail.toLowerCase());
        const contactType: "client" | "driver" | "lead" =
            profile?.role === "driver" ? "driver" : profile ? "client" : "lead";

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
                id: profile?.id ?? `email_contact_${contactEmail}`,
                name: profile?.full_name ?? contactName ?? contactEmail,
                phone: profile?.phone_normalized ?? "",
                type: contactType,
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

        const folder = (url.searchParams.get("folder") ?? "inbox") as "inbox" | "sent" | "starred";
        const searchQuery = url.searchParams.get("q") ?? "";

        const provider = await getEmailProvider(orgId);
        if (!provider) {
            return apiSuccess({ conversations: [], gmailConnected: false });
        }

        const result = await provider.fetchThreads({
            folder,
            query: searchQuery || undefined,
            maxResults,
            pageToken,
        });

        if (!result) {
            return apiSuccess({ conversations: [], gmailConnected: false });
        }

        const connectedEmail = provider.getEmail();

        // Collect unique counterpart emails for CRM matching
        const contactEmails = new Set<string>();
        for (const thread of result.threads) {
            const counterpart = thread.messages.find(
                (m) => m.fromEmail.toLowerCase() !== connectedEmail.toLowerCase(),
            );
            const email = counterpart?.fromEmail ?? thread.messages[0]?.fromEmail;
            if (email) contactEmails.add(email.toLowerCase());
        }

        // Match email senders to CRM profiles
        const profileMap = new Map<string, CrmProfile>();
        if (contactEmails.size > 0) {
            const admin = createAdminClient();
            const { data: profiles } = await admin
                .from("profiles")
                .select("id, full_name, email, phone_normalized, role")
                .in("email", Array.from(contactEmails))
                .eq("organization_id", orgId);

            for (const p of (profiles ?? []) as CrmProfile[]) {
                if (p.email) profileMap.set(p.email.toLowerCase(), p);
            }
        }

        const conversations = threadsToConversations(result.threads, connectedEmail, profileMap);

        return apiSuccess({
            conversations,
            gmailConnected: true,
            nextPageToken: result.nextPageToken,
        });
    } catch (err) {
        if (err instanceof GmailAuthExpiredError) {
            return apiSuccess({ conversations: [], gmailConnected: false, gmailAuthExpired: true });
        }
        logError("[email/conversations] Failed", err);
        return apiError("Failed to load email conversations", 500);
    }
}
