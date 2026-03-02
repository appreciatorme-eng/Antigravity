import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "node:fs";
import path from "node:path";

const FAQ_PATH = path.join(process.cwd(), "..", "..", "apps", "rag-assistant", "faq", "faq_tour_operator.jsonl");

interface FaqRow {
    id: string;
    question: string;
    answer: string;
    category: string;
    source: string;
}

function loadFaq(): FaqRow[] {
    try {
        const lines = fs.readFileSync(FAQ_PATH, "utf8").split("\n").filter(Boolean);
        return lines.map((line) => JSON.parse(line) as FaqRow);
    } catch {
        return [];
    }
}

function tokenize(text: string): Set<string> {
    return new Set(
        text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(Boolean)
    );
}

function retrieveContext(query: string, maxChunks = 5): FaqRow[] {
    const rows = loadFaq();
    const queryTokens = tokenize(query);
    return rows
        .map((row) => {
            const rowTokens = tokenize(`${row.question} ${row.answer}`);
            let overlap = 0;
            queryTokens.forEach((t) => { if (rowTokens.has(t)) overlap++; });
            return { row, score: overlap };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxChunks)
        .map((item) => item.row);
}

function buildSystemPrompt(context: FaqRow[]): string {
    const faqBlock = context.length > 0
        ? context.map((r) => `Q: ${r.question}\nA: ${r.answer}`).join("\n\n")
        : "No specific FAQ match found. Answer from general knowledge about tour operator software.";

    return `You are a friendly operations assistant for tour operators using GoBuddy Adventures.

Your job is to help tour operators run their daily business quickly and confidently.

## Rules
- Answer using the FAQ context below when available.
- Keep answers short, clear, and practical — 1 to 3 sentences max.
- Use simple business language, no jargon.
- For updates (price, stage, driver), always ask for confirmation before acting.
- Never expose another operator's data.
- If you are not sure, say so and suggest contacting support.

## FAQ Context
${faqBlock}`;
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: "No organization found" }, { status: 400 });
        }

        const body = await req.json() as { message?: string; history?: Array<{ role: string; content: string }> };
        const { message, history = [] } = body;

        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const context = retrieveContext(message);
        const systemPrompt = buildSystemPrompt(context);

        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
        }

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-6),
            { role: "user", content: message.trim() },
        ];

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages,
                max_tokens: 300,
                temperature: 0.4,
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
            return NextResponse.json(
                { error: err?.error?.message ?? "AI service error" },
                { status: 502 }
            );
        }

        const data = await res.json() as {
            choices: Array<{ message: { content: string } }>;
        };
        const reply = data.choices?.[0]?.message?.content?.trim() ?? "I could not generate a response. Please try again.";

        return NextResponse.json({
            reply,
            citations: context.slice(0, 2).map((r) => ({ id: r.id, question: r.question })),
        });
    } catch (error) {
        console.error("Assistant chat error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
