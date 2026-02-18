export type EmailResult = {
    success: boolean;
    skipped?: boolean;
    reason?: string;
    messageId?: string;
};

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.WELCOME_FROM_EMAIL || "marketplace@itinerary.ai";

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<EmailResult> {
    if (!apiKey) {
        console.warn("Missing RESEND_API_KEY. Skipping email.");
        return { success: false, skipped: true, reason: "missing_api_key" };
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: fromEmail,
                to,
                subject,
                html,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return { success: false, reason: error };
        }

        const data = await response.json();
        return { success: true, messageId: data.id };
    } catch (error: any) {
        return { success: false, reason: error.message };
    }
}

export async function sendInquiryNotification(params: {
    receiverEmail: string;
    senderOrgName: string;
    subject: string;
    message: string;
    inquiryUrl: string;
}) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e3a8a;">New Partnership Inquiry</h2>
            <p><strong>${params.senderOrgName}</strong> has sent you a new inquiry on the Tour Operator Marketplace.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Subject</p>
                <p style="margin: 5px 0 15px 0; font-weight: bold;">${params.subject}</p>
                
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Message</p>
                <p style="margin: 5px 0 0 0;">${params.message}</p>
            </div>

            <a href="${params.inquiryUrl}" style="display: block; text-align: center; background: #2563eb; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold;">View in Inbox</a>
            
            <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                Sent via the Travel Suite Partner Marketplace.
            </p>
        </div>
    `;

    return sendEmail({
        to: params.receiverEmail,
        subject: `[Marketplace] New Inquiry from ${params.senderOrgName}`,
        html
    });
}

export async function sendVerificationNotification(params: {
    receiverEmail: string;
    orgName: string;
    status: 'verified' | 'rejected';
    settingsUrl: string;
}) {
    const isApproved = params.status === 'verified';

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: ${isApproved ? '#059669' : '#dc2626'};">
                Marketplace Verification ${isApproved ? 'Approved' : 'Update'}
            </h2>
            <p>Hello,</p>
            <p>Your request for "Verified Partner" status for <strong>${params.orgName}</strong> has been <strong>${params.status}</strong> by the administration.</p>
            
            ${isApproved ? `
                <p>You now have the "Verified Partner" badge on your profile and can access the Document Vaults of other verified operators.</p>
            ` : `
                <p>Unfortunately, we could not verify your profile at this time. Please ensure your organization details and bio are complete before requesting again.</p>
            `}

            <a href="${params.settingsUrl}" style="display: block; text-align: center; background: #2563eb; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">
                Go to Marketplace Settings
            </a>
            
            <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                Quality and Trust are the core of our partner network.
            </p>
        </div>
    `;

    return sendEmail({
        to: params.receiverEmail,
        subject: `[Marketplace] Verification Status: ${params.status}`,
        html
    });
}
