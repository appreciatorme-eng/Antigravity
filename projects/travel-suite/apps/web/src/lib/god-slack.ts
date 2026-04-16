import { env } from "@/lib/env";

export interface SlackBlock {
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    elements?: any[];
    accessory?: any;
    fields?: any[];
}

/**
 * Sends a rich message to the operations Slack channel using Block Kit.
 * Best for Human-in-the-Loop workflows (propose action, wait for approval).
 */
export async function sendOpsAlert(text: string, blocks?: SlackBlock[]) {
    // If no webhook URL is defined, just log to console (graceful fallback)
    const webhookUrl = process.env.SLACK_OPS_WEBHOOK_URL;
    
    if (!webhookUrl) {
        console.warn("[god-slack] Missing SLACK_OPS_WEBHOOK_URL. Alert would have been:", text);
        return false;
    }

    try {
        const payload = blocks ? { text, blocks } : { text };
        
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error("[god-slack] Failed to send Slack alert:", response.statusText);
            return false;
        }

        return true;
    } catch (error) {
        console.error("[god-slack] Error sending Slack alert:", error);
        return false;
    }
}

/**
 * Specifically structures a Human-In-The-Loop AI proposal message.
 * Embeds an interactive block so an operator can Approve/Reject right in Slack.
 */
export async function sendHitlProposal(
    title: string, 
    reasoning: string, 
    actionPayload: string, 
    riskLevel: "medium" | "high" | "critical" = "medium"
) {
    const colorEmoji = riskLevel === "critical" ? "🚨" : riskLevel === "high" ? "⚠️" : "ℹ️";
    
    const blocks: SlackBlock[] = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `${colorEmoji} AI Proposal: ${title}`,
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Reasoning:*\n${reasoning}`
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Payload/Action:*\n\`\`\`${actionPayload}\`\`\``
            }
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "✅ Approve Action",
                        emoji: true
                    },
                    style: "primary",
                    value: `approve_${Buffer.from(actionPayload).toString('base64')}`,
                    action_id: "hitl_approve"
                },
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "❌ Reject",
                        emoji: true
                    },
                    style: "danger",
                    value: "reject",
                    action_id: "hitl_reject"
                }
            ]
        }
    ];

    return sendOpsAlert(`AI Proposal: ${title}`, blocks);
}
