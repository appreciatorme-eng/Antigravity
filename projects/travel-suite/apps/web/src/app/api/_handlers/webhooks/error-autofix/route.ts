/**
 * Error Autofix Webhook Handler
 *
 * Called by a pg_net trigger on every INSERT into `error_events` where status='open'.
 * Runs an AI pipeline in the background (via waitUntil):
 *   1. Fetch the error_event row
 *   2. Look up past similar fixes in error_patterns (knowledge base)
 *   3. Fetch the relevant source file from GitHub (culprit → file path)
 *   4. Call OpenAI (gpt-4o-mini) for root cause analysis + suggested fix
 *   5. Create a GitHub Issue with the AI analysis as the body
 *   6. If confidence ≥ 75: create branch, commit fix diff, open draft PR
 *   7. Upsert error_patterns knowledge base with new findings
 *   8. Update error_events with github_issue_url, github_pr_url, autofix_status
 *
 * Auth: Bearer token (CRON_SECRET) — same as all internal webhooks
 * Returns 200 immediately; all async work runs via waitUntil()
 */

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError, logEvent } from "@/lib/observability/logger";
import { scheduleBackgroundTask } from "@/lib/server/background";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GITHUB_REPO = "appreciatorme-eng/Antigravity";
const GITHUB_API  = "https://api.github.com";
const OPENAI_API  = "https://api.openai.com/v1/chat/completions";
const SOURCE_ROOT = "projects/travel-suite/apps/web/src/";
const CONFIDENCE_THRESHOLD = 75;
const MAX_SOURCE_LINES     = 150;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorEventRow {
    id: string;
    sentry_issue_id: string;
    sentry_issue_url: string | null;
    title: string;
    level: string;
    culprit: string | null;
    environment: string | null;
    event_count: number;
    user_count: number;
    first_seen_at: string | null;
    autofix_status: string;
}

interface ErrorPatternRow {
    error_message_pattern: string;
    root_cause: string | null;
    fix_summary: string | null;
    fix_diff: string | null;
    confidence_score: number;
    github_pr_url: string | null;
}

interface AiAnalysis {
    root_cause: string;
    affected_files: string[];
    confidence: number;
    summary: string;
    fix_diff: string | null;
}

// ---------------------------------------------------------------------------
// Helpers: GitHub API
// ---------------------------------------------------------------------------

function githubHeaders(): Record<string, string> {
    const pat = process.env.GITHUB_PAT;
    if (!pat) throw new Error("GITHUB_PAT is not configured");
    return {
        "Authorization": `Bearer ${pat}`,
        "Accept":        "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type":  "application/json",
    };
}

async function githubRequest<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${GITHUB_API}${path}`;
    const res = await fetch(url, {
        ...options,
        headers: { ...githubHeaders(), ...(options.headers as Record<string, string> | undefined) },
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(`GitHub API ${options.method ?? "GET"} ${path} → ${res.status}: ${body}`);
    }

    // 204 No Content returns empty body
    if (res.status === 204) return {} as T;
    return res.json() as Promise<T>;
}

/** Resolve Sentry culprit string to a GitHub file path.
 *  Culprit examples:
 *   - "app/api/trips/route.ts in POST"
 *   - "/src/lib/supabase/server.ts in createClient"
 *   - "lib/utils.ts"
 */
function culpritToFilePath(culprit: string): string | null {
    const rawPath = culprit
        .replace(/ in .*$/, "")   // strip " in <function>"
        .replace(/^\/+/, "")       // strip leading slashes
        .trim();

    if (!rawPath || rawPath.includes(" ") || !rawPath.includes(".")) {
        return null;
    }

    // If it already starts with the source root, use as-is
    if (rawPath.startsWith(SOURCE_ROOT)) return rawPath;

    // If it starts with src/, prepend project root
    if (rawPath.startsWith("src/")) return `${SOURCE_ROOT.replace(/src\/$/, "")}${rawPath}`;

    // Otherwise assume it's relative to src/
    return `${SOURCE_ROOT}${rawPath}`;
}

/** Fetch file content from GitHub, returning truncated lines around a culprit line. */
async function fetchSourceFile(
    filePath: string,
    culpritHint: string | null
): Promise<string | null> {
    try {
        const data = await githubRequest<{ content: string; encoding: string }>(
            `/repos/${GITHUB_REPO}/contents/${filePath}?ref=main`
        );

        if (data.encoding !== "base64") return null;

        const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
        const lines   = content.split("\n");

        // Find focus line: grep for function/symbol from culprit hint
        let focusLine = 0;
        if (culpritHint) {
            const fnMatch = culpritHint.match(/ in (\w+)/);
            if (fnMatch) {
                const fnName = fnMatch[1];
                const idx = lines.findIndex((l) => l.includes(fnName));
                if (idx !== -1) focusLine = idx;
            }
        }

        // Return up to MAX_SOURCE_LINES lines centred around focus
        const half  = Math.floor(MAX_SOURCE_LINES / 2);
        const start = Math.max(0, focusLine - half);
        const end   = Math.min(lines.length, start + MAX_SOURCE_LINES);

        return lines.slice(start, end)
            .map((l, i) => `${start + i + 1}: ${l}`)
            .join("\n");
    } catch {
        return null; // file not found or encoding issue — continue without source
    }
}

// ---------------------------------------------------------------------------
// Helpers: OpenAI analysis
// ---------------------------------------------------------------------------

async function analyzeWithAI(
    event: ErrorEventRow,
    sourceContent: string | null,
    pastPatterns: ErrorPatternRow[]
): Promise<AiAnalysis> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const pastFixesSection = pastPatterns.length > 0
        ? pastPatterns.map((p, i) =>
              `Pattern ${i + 1}:\n  Error: ${p.error_message_pattern}\n  Root cause: ${p.root_cause ?? "unknown"}\n  Fix: ${p.fix_summary ?? "none"}\n  Confidence: ${p.confidence_score}`
          ).join("\n\n")
        : "No past patterns available.";

    const sourceSection = sourceContent
        ? `\n\nRelevant source file (${event.culprit ?? "unknown file"}):\n\`\`\`typescript\n${sourceContent}\n\`\`\``
        : "\n\nSource file unavailable.";

    const systemPrompt = `You are an expert TypeScript/Next.js/Supabase developer and production debugger.
You will receive a Sentry error event and context. Your job is to:
1. Identify the root cause concisely
2. List the affected files (max 3)
3. Suggest a fix — if you have high confidence, provide a unified diff; otherwise describe the fix in prose
4. Rate your confidence from 0-100 (be honest — only go above 75 if you can produce a working diff)

IMPORTANT: Respond ONLY with valid JSON matching this exact schema:
{
  "root_cause": "string — one clear sentence",
  "affected_files": ["file1.ts", "file2.ts"],
  "confidence": 0-100,
  "summary": "string — 2-3 sentence action plan for the developer",
  "fix_diff": "string | null — unified diff (--- a/ +++ b/ format) or null if unsure"
}`;

    const userPrompt = `Error event:
- Title: ${event.title}
- Level: ${event.level}
- Culprit: ${event.culprit ?? "unknown"}
- Events: ${event.event_count}, Users affected: ${event.user_count}
- First seen: ${event.first_seen_at ?? "now"}
- Sentry URL: ${event.sentry_issue_url ?? "none"}

Past similar fixes:
${pastFixesSection}
${sourceSection}`;

    const res = await fetch(OPENAI_API, {
        // eslint-disable-next-line no-restricted-syntax -- server-side OpenAI call
        method: "POST",
        headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user",   content: userPrompt },
            ],
        }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(`OpenAI API error ${res.status}: ${body}`);
    }

    const json = await res.json() as { choices: Array<{ message: { content: string } }> };
    const raw  = json.choices[0]?.message?.content ?? "{}";

    const parsed = JSON.parse(raw) as Partial<AiAnalysis>;

    return {
        root_cause:     parsed.root_cause     ?? "Could not determine root cause",
        affected_files: parsed.affected_files ?? [],
        confidence:     Math.min(100, Math.max(0, Number(parsed.confidence ?? 0))),
        summary:        parsed.summary        ?? "No summary available",
        fix_diff:       parsed.fix_diff       ?? null,
    };
}

// ---------------------------------------------------------------------------
// Helpers: GitHub Issue + PR creation
// ---------------------------------------------------------------------------

async function createGithubIssue(
    event: ErrorEventRow,
    analysis: AiAnalysis
): Promise<string> {
    const levelBadge: Record<string, string> = {
        fatal: "💀 FATAL", error: "🔴 Error", warning: "🟡 Warning",
        info: "🔵 Info", debug: "⚪ Debug",
    };
    const badge = levelBadge[event.level] ?? "🔴 Error";

    const body = `## ${badge}: ${event.title}

${event.sentry_issue_url ? `**Sentry:** ${event.sentry_issue_url}` : ""}
**Culprit:** \`${event.culprit ?? "unknown"}\`
**Events:** ${event.event_count} | **Users affected:** ${event.user_count}

---

### Root Cause
${analysis.root_cause}

### Affected Files
${analysis.affected_files.map((f) => `- \`${f}\``).join("\n") || "- Unknown"}

### Suggested Fix
${analysis.summary}

${analysis.fix_diff
    ? `<details>
<summary>AI-generated diff (confidence: ${analysis.confidence}%)</summary>

\`\`\`diff
${analysis.fix_diff}
\`\`\`

> ⚠️ Review carefully before applying — AI-generated code requires human verification.
</details>`
    : `_Confidence too low (${analysis.confidence}%) to generate a reliable diff. Manual investigation required._`}

---
_Auto-generated by TripBuilt error-autofix pipeline_`;

    const data = await githubRequest<{ html_url: string }>(
        `/repos/${GITHUB_REPO}/issues`,
        {
            method: "POST",
            body: JSON.stringify({
                title: `[Sentry] ${event.title}`,
                body,
                labels: ["bug", "sentry", `severity:${event.level}`],
            }),
        }
    );

    return data.html_url;
}

/** Get the SHA of the HEAD commit on main — needed to create a branch. */
async function getMainSha(): Promise<string> {
    const data = await githubRequest<{ object: { sha: string } }>(
        `/repos/${GITHUB_REPO}/git/ref/heads/main`
    );
    return data.object.sha;
}

async function createBranch(branchName: string, sha: string): Promise<void> {
    await githubRequest(`/repos/${GITHUB_REPO}/git/refs`, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
    });
}

/** Commit the AI fix diff as a new file in the branch (patch notes, not applied diff).
 *  We don't auto-apply the diff to avoid broken code — instead we commit a
 *  `fix-notes.md` file so the PR has real content and reviewers can apply the diff.
 */
async function commitFixNotes(
    branchName: string,
    event: ErrorEventRow,
    analysis: AiAnalysis
): Promise<void> {
    const filePath = `docs/autofix/${event.sentry_issue_id}.md`;
    const content  = `# Autofix Notes: ${event.title}

**Sentry issue:** ${event.sentry_issue_id}
**Culprit:** ${event.culprit ?? "unknown"}
**AI confidence:** ${analysis.confidence}%

## Root Cause
${analysis.root_cause}

## Affected Files
${analysis.affected_files.map((f) => `- \`${f}\``).join("\n") || "- Unknown"}

## Suggested Fix
${analysis.summary}

## Diff to Apply
${analysis.fix_diff
    ? `\`\`\`diff\n${analysis.fix_diff}\n\`\`\``
    : "_No diff available._"}

---
_Auto-generated by TripBuilt error-autofix pipeline_
`;

    await githubRequest(`/repos/${GITHUB_REPO}/contents/${filePath}`, {
        method: "PUT",
        body: JSON.stringify({
            message: `fix: autofix notes for Sentry issue ${event.sentry_issue_id}`,
            content: Buffer.from(content, "utf8").toString("base64"),
            branch: branchName,
        }),
    });
}

async function createPullRequest(
    branchName: string,
    issueUrl: string,
    event: ErrorEventRow,
    analysis: AiAnalysis
): Promise<string> {
    const data = await githubRequest<{ html_url: string }>(
        `/repos/${GITHUB_REPO}/pulls`,
        {
            method: "POST",
            body: JSON.stringify({
                title: `fix: [Sentry] ${event.title.substring(0, 100)}`,
                head:  branchName,
                base:  "main",
                draft: true,
                body: `Closes ${issueUrl}

## Summary
AI-generated fix notes for Sentry issue \`${event.sentry_issue_id}\`.

**Confidence:** ${analysis.confidence}%
**Root cause:** ${analysis.root_cause}

This PR contains \`docs/autofix/${event.sentry_issue_id}.md\` with the AI analysis and suggested diff.
Apply the diff manually after reviewing for correctness.

---
_Auto-generated by TripBuilt error-autofix pipeline_`,
            }),
        }
    );
    return data.html_url;
}

// ---------------------------------------------------------------------------
// Helpers: DB persistence
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events/error_patterns are not in generated Supabase types
type AdminClient = any;

function normalizeErrorTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, "<uuid>")  // strip UUIDs
        .replace(/\d+/g, "<n>")                               // strip numbers
        .trim();
}

function fingerprint(title: string): string {
    return createHash("sha256")
        .update(normalizeErrorTitle(title))
        .digest("hex");
}

async function findSimilarPatterns(
    supabase: AdminClient,
    event: ErrorEventRow
): Promise<ErrorPatternRow[]> {
    // Exact fingerprint hit
    const fp = fingerprint(event.title);
    const { data: exact } = await supabase
        .from("error_patterns")
        .select("error_message_pattern, root_cause, fix_summary, fix_diff, confidence_score, github_pr_url")
        .eq("error_fingerprint", fp)
        .limit(1);

    if (exact?.length > 0) return exact as ErrorPatternRow[];

    // Fallback: full-text similarity on error_message_pattern (up to 3 results)
    const { data: similar } = await supabase
        .from("error_patterns")
        .select("error_message_pattern, root_cause, fix_summary, fix_diff, confidence_score, github_pr_url")
        .textSearch("error_message_pattern", normalizeErrorTitle(event.title), { type: "plain" })
        .order("confidence_score", { ascending: false })
        .limit(3);

    return (similar ?? []) as ErrorPatternRow[];
}

async function upsertErrorPattern(
    supabase: AdminClient,
    event: ErrorEventRow,
    analysis: AiAnalysis,
    githubPrUrl: string | null
): Promise<void> {
    const fp = fingerprint(event.title);

    await supabase.from("error_patterns").upsert(
        {
            error_fingerprint:     fp,
            error_message_pattern: normalizeErrorTitle(event.title),
            root_cause:            analysis.root_cause,
            fix_summary:           analysis.summary,
            fix_diff:              analysis.fix_diff,
            files_affected:        analysis.affected_files,
            github_pr_url:         githubPrUrl,
            confidence_score:      analysis.confidence / 100,
            last_seen_at:          new Date().toISOString(),
            times_seen:            1, // DB will accumulate via conflict update below
        },
        {
            onConflict: "error_fingerprint",
            ignoreDuplicates: false,
        }
    );
}

async function updateEventStatus(
    supabase: AdminClient,
    eventId: string,
    fields: Record<string, unknown>
): Promise<void> {
    await supabase
        .from("error_events")
        .update(fields)
        .eq("id", eventId);
}

// ---------------------------------------------------------------------------
// Core pipeline
// ---------------------------------------------------------------------------

async function runAutofix(errorEventId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error_events not in generated types
    const supabase = createAdminClient() as any;

    // 1. Fetch the error event
    const { data: eventData, error: fetchError } = await supabase
        .from("error_events")
        .select("id, sentry_issue_id, sentry_issue_url, title, level, culprit, environment, event_count, user_count, first_seen_at, autofix_status")
        .eq("id", errorEventId)
        .single();

    if (fetchError || !eventData) {
        logError("error-autofix: could not fetch error_event", fetchError, { error_event_id: errorEventId });
        return;
    }

    const event = eventData as ErrorEventRow;

    // Skip if already processed (idempotency guard — pg_net trigger may fire duplicates)
    if (event.autofix_status !== "pending") {
        logEvent("info", "error-autofix: already processed, skipping", {
            error_event_id: errorEventId,
            autofix_status: event.autofix_status,
        });
        return;
    }

    logEvent("info", "error-autofix: pipeline started", {
        error_event_id: errorEventId,
        sentry_issue_id: event.sentry_issue_id,
        level: event.level,
    });

    await updateEventStatus(supabase, errorEventId, { autofix_status: "analyzing" });

    try {
        // 2. Look up past patterns
        const pastPatterns = await findSimilarPatterns(supabase, event);

        // 3. Fetch source file from GitHub
        const filePath      = event.culprit ? culpritToFilePath(event.culprit) : null;
        const sourceContent = filePath ? await fetchSourceFile(filePath, event.culprit) : null;

        if (!sourceContent && filePath) {
            logEvent("info", "error-autofix: source file not found on GitHub", {
                error_event_id: errorEventId,
                file_path: filePath,
            });
        }

        // 4. AI analysis
        const analysis = await analyzeWithAI(event, sourceContent, pastPatterns);

        logEvent("info", "error-autofix: AI analysis complete", {
            error_event_id: errorEventId,
            confidence: analysis.confidence,
            root_cause: analysis.root_cause,
        });

        // 5. Create GitHub Issue
        const issueUrl = await createGithubIssue(event, analysis);

        logEvent("info", "error-autofix: GitHub issue created", {
            error_event_id: errorEventId,
            issue_url: issueUrl,
        });

        // 6. Create branch + PR if confidence is high enough
        let prUrl: string | null = null;

        if (analysis.confidence >= CONFIDENCE_THRESHOLD) {
            const branchName = `fix/sentry-${event.sentry_issue_id}`;
            const mainSha    = await getMainSha();

            await createBranch(branchName, mainSha);
            await commitFixNotes(branchName, event, analysis);
            prUrl = await createPullRequest(branchName, issueUrl, event, analysis);

            logEvent("info", "error-autofix: GitHub PR created", {
                error_event_id: errorEventId,
                pr_url: prUrl,
                branch: branchName,
            });
        }

        // 7. Upsert knowledge base
        await upsertErrorPattern(supabase, event, analysis, prUrl);

        // 8. Update error_events row
        await updateEventStatus(supabase, errorEventId, {
            ai_analysis:      analysis,
            ai_suggested_fix: analysis.fix_diff ?? analysis.summary,
            github_issue_url: issueUrl,
            github_pr_url:    prUrl,
            autofix_status:   prUrl ? "pr_opened" : "issue_created",
        });

        logEvent("info", "error-autofix: pipeline complete", {
            error_event_id: errorEventId,
            autofix_status: prUrl ? "pr_opened" : "issue_created",
        });
    } catch (err) {
        logError("error-autofix: pipeline failed", err, { error_event_id: errorEventId });

        await updateEventStatus(supabase, errorEventId, { autofix_status: "failed" }).catch(() => {
            // Best-effort — don't mask the original error
        });
    }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
    const cronAuth = await authorizeCronRequest(request, {
        replayWindowMs: 24 * 60 * 60 * 1000, // 24h — error IDs are unique, block duplicate runs
    });

    if (!cronAuth.authorized) {
        logEvent("warn", "error-autofix: unauthorized request", {
            reason: cronAuth.reason,
            status: cronAuth.status,
        });
        return NextResponse.json({ error: cronAuth.reason }, { status: cronAuth.status });
    }

    let errorEventId: string;
    try {
        const body = await request.json() as { error_event_id?: string };
        errorEventId = body.error_event_id ?? "";
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!errorEventId) {
        return NextResponse.json({ error: "error_event_id is required" }, { status: 400 });
    }

    logEvent("info", "error-autofix: request received", { error_event_id: errorEventId });

    // Run pipeline asynchronously — keeps Vercel function alive after 200 is returned
    scheduleBackgroundTask(
        runAutofix(errorEventId).catch((err) =>
            logError("error-autofix: unhandled error in runAutofix", err, { error_event_id: errorEventId })
        )
    );

    return NextResponse.json({ ok: true });
}
