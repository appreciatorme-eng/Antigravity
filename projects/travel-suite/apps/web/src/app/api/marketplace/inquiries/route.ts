import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { sanitizeText } from "@/lib/security/sanitize";
import type { Database } from "@/lib/database.types";
import { captureOperationalMetric } from "@/lib/observability/metrics";
import { jsonWithRequestId as withRequestId } from "@/lib/api/response";
import {
    getRequestContext,
    getRequestId,
    logError,
    logEvent,
} from "@/lib/observability/logger";

const UpdateInquirySchema = z.object({
    id: z.string().min(6).max(80),
    status: z.string().min(2).max(30).optional(),
    mark_read: z.boolean().optional(),
});

type OrganizationSummary = Pick<Database["public"]["Tables"]["organizations"]["Row"], "name" | "logo_url">;

type MarketplaceInquiryWithOrg = Database["public"]["Tables"]["marketplace_inquiries"]["Row"] & {
    sender?: OrganizationSummary | OrganizationSummary[] | null;
    receiver?: OrganizationSummary | OrganizationSummary[] | null;
};

export async function GET(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            logEvent("warn", "Marketplace inquiries list unauthorized", requestContext);
            return withRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (!profile?.organization_id) {
            logEvent("warn", "Marketplace inquiries list missing organization", {
                ...requestContext,
                user_id: user.id,
            });
            return withRequestId({ error: "No organization" }, requestId, { status: 403 });
        }

        const orgId = profile.organization_id;

        // Fetch received inquiries
        const { data: receivedData, error: receivedError } = await supabase
            .from("marketplace_inquiries")
            .select(`
                *,
                sender:organizations!sender_org_id(name, logo_url)
            `)
            .eq("receiver_org_id", orgId)
            .order("created_at", { ascending: false });
        if (receivedError) throw receivedError;

        // Fetch sent inquiries
        const { data: sentData, error: sentError } = await supabase
            .from("marketplace_inquiries")
            .select(`
                *,
                receiver:organizations!receiver_org_id(name, logo_url)
            `)
            .eq("sender_org_id", orgId)
            .order("created_at", { ascending: false });
        if (sentError) throw sentError;

        const received = (receivedData || []) as MarketplaceInquiryWithOrg[];
        const sent = (sentData || []) as MarketplaceInquiryWithOrg[];
        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace inquiries list fetched", {
            ...requestContext,
            user_id: user.id,
            received_count: received.length,
            sent_count: sent.length,
            durationMs,
        });
        void captureOperationalMetric("api.marketplace.inquiries.list", {
            request_id: requestId,
            user_id: user.id,
            received_count: received.length,
            sent_count: sent.length,
            duration_ms: durationMs,
        });
        return withRequestId({ received, sent }, requestId);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load marketplace inquiries";
        logError("Marketplace inquiries list failed", error, requestContext);
        void captureOperationalMetric("api.marketplace.inquiries.list.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = getRequestId(request);
    const requestContext = getRequestContext(request, requestId);
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            logEvent("warn", "Marketplace inquiry update unauthorized", requestContext);
            return withRequestId({ error: "Unauthorized" }, requestId, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("organization_id")
            .eq("id", user.id)
            .single();
        if (!profile?.organization_id) {
            logEvent("warn", "Marketplace inquiry update missing organization", {
                ...requestContext,
                user_id: user.id,
            });
            return withRequestId({ error: "Organization not configured" }, requestId, { status: 403 });
        }

        const payloadRaw = await request.json().catch(() => null);
        const parsed = UpdateInquirySchema.safeParse(payloadRaw);
        if (!parsed.success) {
            return withRequestId(
                { error: "Invalid update payload", details: parsed.error.flatten() },
                requestId,
                { status: 400 }
            );
        }

        const updates: Database["public"]["Tables"]["marketplace_inquiries"]["Update"] = {};
        const status = sanitizeText(parsed.data.status, { maxLength: 30 });
        if (status) updates.status = status;
        if (parsed.data.mark_read) updates.read_at = new Date().toISOString();
        updates.updated_at = new Date().toISOString();

        if (!updates.status && !updates.read_at) {
            return withRequestId({ error: "No changes requested" }, requestId, { status: 400 });
        }

        const { data, error } = await supabase
            .from("marketplace_inquiries")
            .update(updates)
            .eq("id", parsed.data.id)
            .or(`receiver_org_id.eq.${profile.organization_id},sender_org_id.eq.${profile.organization_id}`)
            .select()
            .single();

        if (error) throw error;
        const durationMs = Date.now() - startedAt;
        logEvent("info", "Marketplace inquiry updated", {
            ...requestContext,
            user_id: user.id,
            inquiry_id: data?.id,
            status: updates.status || null,
            mark_read: Boolean(updates.read_at),
            durationMs,
        });
        void captureOperationalMetric("api.marketplace.inquiries.update", {
            request_id: requestId,
            user_id: user.id,
            inquiry_id: data?.id || null,
            status: updates.status || null,
            mark_read: Boolean(updates.read_at),
            duration_ms: durationMs,
        });
        return withRequestId(data, requestId);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update marketplace inquiry";
        logError("Marketplace inquiry update failed", error, requestContext);
        void captureOperationalMetric("api.marketplace.inquiries.update.error", {
            request_id: requestId,
            error: message,
        });
        return withRequestId({ error: message }, requestId, { status: 500 });
    }
}
