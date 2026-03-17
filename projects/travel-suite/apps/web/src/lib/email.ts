import { sendWelcomeNotification } from "@/lib/email/notifications";

export type WelcomeEmailResult = {
    success: boolean;
    skipped?: boolean;
    reason?: string;
    messageId?: string;
};

type WelcomeEmailPayload = {
    toEmail: string;
    fullName?: string | null;
    loginUrl?: string | null;
};

export async function sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<WelcomeEmailResult> {
    const loginUrl = payload.loginUrl || process.env.NEXT_PUBLIC_APP_URL || "";
    const recipientName = payload.fullName?.trim() || "there";

    try {
        const sent = await sendWelcomeNotification({
            to: payload.toEmail,
            recipientName,
            loginUrl,
        });
        return sent
            ? { success: true }
            : { success: false, reason: "email_send_failed" };
    } catch (error) {
        return {
            success: false,
            reason: error instanceof Error ? error.message : "email_send_failed",
        };
    }
}
