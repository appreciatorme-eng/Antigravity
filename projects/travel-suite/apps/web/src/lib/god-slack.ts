export interface SlackBlock {
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    elements?: unknown[];
    accessory?: unknown;
    fields?: unknown[];
}

export type SlackWebhookSource = "SLACK_OPS_WEBHOOK_URL" | "SLACK_WEBHOOK_URL";

export interface SlackWebhookConfig {
    readonly configured: boolean;
    readonly source: SlackWebhookSource | null;
    readonly url: string | null;
}

export function resolveSlackWebhookConfig(): SlackWebhookConfig {
    const opsWebhook = process.env.SLACK_OPS_WEBHOOK_URL?.trim();
    if (opsWebhook) {
        return {
            configured: true,
            source: "SLACK_OPS_WEBHOOK_URL",
            url: opsWebhook,
        };
    }

    const defaultWebhook = process.env.SLACK_WEBHOOK_URL?.trim();
    if (defaultWebhook) {
        return {
            configured: true,
            source: "SLACK_WEBHOOK_URL",
            url: defaultWebhook,
        };
    }

    return {
        configured: false,
        source: null,
        url: null,
    };
}

/**
 * Sends a rich message to the operations Slack channel using Block Kit.
 * Best for Human-in-the-Loop workflows (propose action, wait for approval).
 */
export async function sendOpsAlert(text: string, blocks?: SlackBlock[]) {
    const webhook = resolveSlackWebhookConfig();

    if (!webhook.url) {
        console.warn("[god-slack] Missing Slack webhook (SLACK_OPS_WEBHOOK_URL/SLACK_WEBHOOK_URL). Alert would have been:", text);
        return false;
    }

    try {
        const payload = blocks ? { text, blocks } : { text };
        
        const response = await fetch(webhook.url, {
            method: "POST", // eslint-disable-line no-restricted-syntax -- server-side Slack webhook, not a mutation endpoint
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
 * Structures a Human-In-The-Loop AI proposal message.
 * Approve/Reject is done in the Autopilot UI at /god/autopilot — no interactive
 * Slack buttons are used since there is no Slack interactivity webhook.
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
            text: { type: "plain_text", text: `${colorEmoji} AI Proposal: ${title}`, emoji: true },
        },
        {
            type: "section",
            text: { type: "mrkdwn", text: `*Reasoning:*\n${reasoning}` },
        },
        {
            type: "section",
            text: { type: "mrkdwn", text: `*Payload/Action:*\n\`\`\`${actionPayload}\`\`\`` },
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `👉 Approve or reject at <https://tripbuilt.com/god/autopilot|tripbuilt.com/god/autopilot>`,
                },
            ],
        },
    ];

    return sendOpsAlert(`AI Proposal: ${title}`, blocks);
}
