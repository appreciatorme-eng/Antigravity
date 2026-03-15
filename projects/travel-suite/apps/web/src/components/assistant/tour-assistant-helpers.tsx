"use client";

import type React from "react";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    citations?: Array<{ id: string; question: string }>;
    actionResult?: { success: boolean; message: string; data?: unknown };
    actionProposal?: { actionName: string; params: Record<string, unknown>; confirmationMessage: string };
    suggestedActions?: Array<{ label: string; prefilledMessage: string }>;
}

export const WELCOME =
    "Hi! I'm GoBuddy, your operations co-pilot. I can look up live data from your business -- trips, clients, invoices, drivers, proposals. Ask me anything!";

export const QUICK_PROMPTS = [
    "What's happening today?",
    "Show me overdue invoices",
    "Any trips without drivers?",
    "Client follow-ups needed",
];

const NUMERIC_KEYS = [
    "revenue",
    "amount",
    "total",
    "count",
    "value",
    "trips",
    "invoices",
    "clients",
] as const;
const LABEL_KEYS = ["name", "label", "date", "period", "month", "week", "day"] as const;

function parseInlineMarkdown(line: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    const inlinePattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlinePattern.exec(line)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(line.slice(lastIndex, match.index));
        }
        if (match[2] !== null && match[2] !== undefined) {
            nodes.push(<strong key={match.index}>{match[2]}</strong>);
        } else if (match[3] !== null && match[3] !== undefined) {
            nodes.push(<em key={match.index}>{match[3]}</em>);
        } else if (match[4] !== null && match[4] !== undefined) {
            nodes.push(
                <code
                    key={match.index}
                    className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                    style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd" }}
                >
                    {match[4]}
                </code>,
            );
        } else if (
            match[5] !== null &&
            match[5] !== undefined &&
            match[6] !== null &&
            match[6] !== undefined
        ) {
            nodes.push(
                <a
                    key={match.index}
                    href={match[6]}
                    target="_blank"
                    className="underline"
                    style={{ color: "#67e8f9" }}
                    rel="noreferrer"
                >
                    {match[5]}
                </a>,
            );
        }
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
        nodes.push(line.slice(lastIndex));
    }
    return nodes;
}

export function MarkdownContent({ text }: { text: string }) {
    if (!text) return null;

    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch) {
            elements.push(
                <p key={i} className="font-semibold text-sm mt-1 mb-0.5">
                    {parseInlineMarkdown(headingMatch[1])}
                </p>,
            );
            i++;
            continue;
        }

        if (/^[\-\*]\s+/.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^[\-\*]\s+/.test(lines[i])) {
                const content = lines[i].replace(/^[\-\*]\s+/, "");
                items.push(
                    <li key={i} className="ml-4 list-disc text-xs">
                        {parseInlineMarkdown(content)}
                    </li>,
                );
                i++;
            }
            elements.push(<ul key={`ul-${i}`}>{items}</ul>);
            continue;
        }

        if (/^\d+\.\s+/.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
                const content = lines[i].replace(/^\d+\.\s+/, "");
                items.push(
                    <li key={i} className="ml-4 list-decimal text-xs">
                        {parseInlineMarkdown(content)}
                    </li>,
                );
                i++;
            }
            elements.push(<ol key={`ol-${i}`}>{items}</ol>);
            continue;
        }

        if (line.trim() === "") {
            elements.push(<div key={i} className="h-1.5" />);
            i++;
            continue;
        }

        elements.push(
            <p key={i} className="text-sm">
                {parseInlineMarkdown(line)}
            </p>,
        );
        i++;
    }

    return <div className="space-y-0.5 text-sm leading-relaxed">{elements}</div>;
}

export function isChartData(data: unknown): boolean {
    if (!Array.isArray(data) || data.length < 2 || data.length > 20) return false;
    return data.every((item) => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
        const obj = item as Record<string, unknown>;
        return NUMERIC_KEYS.some((key) => typeof obj[key] === "number");
    });
}

export function getChartDataKey(obj: Record<string, unknown>): string {
    return NUMERIC_KEYS.find((key) => typeof obj[key] === "number") ?? "value";
}

export function getChartLabelKey(obj: Record<string, unknown>): string {
    return LABEL_KEYS.find((key) => key in obj) ?? "name";
}
