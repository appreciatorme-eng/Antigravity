import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/security/sanitize";
import { safeErrorMessage } from "@/lib/security/safe-error";
import type { ClientComment } from "@/types/feedback";

const FeedbackActionSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("resolve_comment"),
        comment_id: z.string().min(1).max(200),
    }),
    z.object({
        action: z.literal("unresolve_comment"),
        comment_id: z.string().min(1).max(200),
    }),
    z.object({
        action: z.literal("reply_comment"),
        comment_id: z.string().min(1).max(200),
        reply: z.string().min(1).max(2000),
    }),
    z.object({
        action: z.literal("resolve_all"),
    }),
]);

function parseComments(value: unknown): ClientComment[] {
    if (!Array.isArray(value)) return [];

    const comments: ClientComment[] = [];
    for (const entry of value) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
        const record = entry as Record<string, unknown>;

        const id = sanitizeText(record.id, { maxLength: 200 });
        const comment = sanitizeText(record.comment, { maxLength: 2000, preserveNewlines: true });
        if (!id || !comment) continue;

        comments.push({
            id,
            author: sanitizeText(record.author, { maxLength: 120 }) || "Guest",
            comment,
            created_at: sanitizeText(record.created_at, { maxLength: 80 }) || new Date().toISOString(),
            ...(record.resolved_at ? { resolved_at: sanitizeText(record.resolved_at, { maxLength: 80 }) } : {}),
            ...(record.resolved_by ? { resolved_by: sanitizeText(record.resolved_by, { maxLength: 120 }) } : {}),
            ...(record.operator_reply ? {
                operator_reply: sanitizeText(record.operator_reply, { maxLength: 2000, preserveNewlines: true }),
            } : {}),
            ...(record.operator_reply_at ? {
                operator_reply_at: sanitizeText(record.operator_reply_at, { maxLength: 80 }),
            } : {}),
        });
    }
    return comments;
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "Missing itinerary id" }, { status: 400 });
        }

        // Validate ownership
        const { data: itinerary, error: itinError } = await supabase
            .from("itineraries")
            .select("id")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

        if (itinError || !itinerary) {
            return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
        }

        // Parse and validate request body
        const body = await request.json();
        const parsed = FeedbackActionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request", details: parsed.error.flatten() },
                { status: 400 }
            );
        }
        const action = parsed.data;

        // Fetch shared itinerary (use admin client — shared_itineraries RLS may restrict)
        const adminClient = createAdminClient();
        const { data: share, error: shareError } = await adminClient
            .from("shared_itineraries")
            .select("id, client_comments, self_service_status")
            .eq("itinerary_id", id)
            .single();

        if (shareError || !share) {
            return NextResponse.json(
                { error: "No shared itinerary found for this plan" },
                { status: 404 }
            );
        }

        const existingComments = parseComments(share.client_comments);
        const operatorName = user.user_metadata?.full_name || user.email || "Operator";
        const now = new Date().toISOString();

        let updatedComments: ClientComment[];
        let updatedSelfServiceStatus: string | undefined;

        switch (action.action) {
            case "resolve_comment": {
                const found = existingComments.some((c) => c.id === action.comment_id);
                if (!found) {
                    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
                }
                updatedComments = existingComments.map((c) =>
                    c.id === action.comment_id
                        ? { ...c, resolved_at: now, resolved_by: operatorName }
                        : c
                );
                break;
            }

            case "unresolve_comment": {
                const found = existingComments.some((c) => c.id === action.comment_id);
                if (!found) {
                    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
                }
                updatedComments = existingComments.map((c) => {
                    if (c.id !== action.comment_id) return c;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { resolved_at, resolved_by, ...rest } = c;
                    return rest;
                });
                break;
            }

            case "reply_comment": {
                const found = existingComments.some((c) => c.id === action.comment_id);
                if (!found) {
                    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
                }
                const sanitizedReply = sanitizeText(action.reply, {
                    maxLength: 2000,
                    preserveNewlines: true,
                });
                if (!sanitizedReply) {
                    return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 });
                }
                updatedComments = existingComments.map((c) =>
                    c.id === action.comment_id
                        ? { ...c, operator_reply: sanitizedReply, operator_reply_at: now }
                        : c
                );
                break;
            }

            case "resolve_all": {
                updatedComments = existingComments.map((c) =>
                    c.resolved_at
                        ? c
                        : { ...c, resolved_at: now, resolved_by: operatorName }
                );
                updatedSelfServiceStatus = "resolved";
                break;
            }

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }

        // Write back the updated comments
        const updatePayload: Record<string, unknown> = {
            client_comments: updatedComments,
        };
        if (updatedSelfServiceStatus) {
            updatePayload.self_service_status = updatedSelfServiceStatus;
        }

        const { error: updateError } = await adminClient
            .from("shared_itineraries")
            .update(updatePayload)
            .eq("id", share.id);

        if (updateError) {
            console.error("Error updating feedback:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, comments: updatedComments });
    } catch (error) {
        console.error("Internal error in feedback endpoint:", error);
        const message = safeErrorMessage(error, "Request failed");
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
