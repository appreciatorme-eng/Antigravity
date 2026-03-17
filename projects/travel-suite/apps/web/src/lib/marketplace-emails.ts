import {
    sendMarketplaceInquiryNotification,
    sendMarketplaceVerificationNotification,
} from "@/lib/email/notifications";

export type EmailResult = {
    success: boolean;
    skipped?: boolean;
    reason?: string;
    messageId?: string;
};

export async function sendInquiryNotification(params: {
    receiverEmail: string;
    senderOrgName: string;
    subject: string;
    message: string;
    inquiryUrl: string;
}): Promise<EmailResult> {
    try {
        const sent = await sendMarketplaceInquiryNotification({
            to: params.receiverEmail,
            senderOrgName: params.senderOrgName,
            subject: params.subject,
            message: params.message,
            inquiryUrl: params.inquiryUrl,
        });
        return { success: sent };
    } catch (error) {
        return {
            success: false,
            reason: error instanceof Error ? error.message : "email_send_failed",
        };
    }
}

export async function sendVerificationNotification(params: {
    receiverEmail: string;
    orgName: string;
    status: "verified" | "rejected";
    settingsUrl: string;
}): Promise<EmailResult> {
    try {
        const sent = await sendMarketplaceVerificationNotification({
            to: params.receiverEmail,
            orgName: params.orgName,
            status: params.status,
            settingsUrl: params.settingsUrl,
        });
        return { success: sent };
    } catch (error) {
        return {
            success: false,
            reason: error instanceof Error ? error.message : "email_send_failed",
        };
    }
}
