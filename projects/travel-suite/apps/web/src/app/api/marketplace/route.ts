import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { sanitizeText } from "@/lib/security/sanitize";

const supabaseAdmin = createAdminClient();

type MarketplaceReviewRow = {
    rating: number | null;
};

type MarketplaceProfileUpsert = Database["public"]["Tables"]["marketplace_profiles"]["Insert"];

type MarketplaceOrganizationJoin = {
    name: string | null;
    logo_url: string | null;
} | null;

type MarketplaceProfileRow = {
    description: string | null;
    service_regions: unknown;
    specialties: unknown;
    gallery_urls: unknown;
    rate_card: unknown;
    compliance_documents: unknown;
    verification_status: string | null;
    organization: MarketplaceOrganizationJoin;
    reviews: MarketplaceReviewRow[] | null;
    [key: string]: unknown;
};

const MarketplacePatchSchema = z.object({
    description: z.unknown().optional(),
    service_regions: z.array(z.unknown()).optional(),
    specialties: z.array(z.unknown()).optional(),
    margin_rate: z.union([z.number(), z.string(), z.null()]).optional(),
    request_verification: z.boolean().optional(),
    rate_card: z.array(z.unknown()).optional(),
    gallery_urls: z.array(z.unknown()).optional(),
    compliance_documents: z.array(z.unknown()).optional(),
});

const ALLOWED_VERIFICATION_STATUSES = new Set(["none", "pending", "verified", "rejected"]);

function sanitizeQueryText(value: unknown, maxLength = 120): string {
    const cleaned = sanitizeText(value, { maxLength });
    return cleaned.replace(/[^a-zA-Z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function sanitizeStringList(value: unknown, maxItems: number, maxLength: number): string[] {
    if (!Array.isArray(value)) return [];
    const deduped = new Map<string, string>();
    for (const entry of value) {
        const normalized = sanitizeText(entry, { maxLength });
        if (!normalized) continue;
        const key = normalized.toLowerCase();
        if (!deduped.has(key)) {
            deduped.set(key, normalized);
        }
        if (deduped.size >= maxItems) break;
    }
    return Array.from(deduped.values());
}

function sanitizeHttpUrl(value: unknown): string | null {
    const candidate = sanitizeText(value, { maxLength: 2048 });
    if (!candidate) return null;
    try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
        return parsed.toString();
    } catch {
        return null;
    }
}

function sanitizeMarginRate(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const numeric = typeof value === "number" ? value : Number.parseFloat(String(value));
    if (!Number.isFinite(numeric)) return null;
    const bounded = Math.min(100, Math.max(0, numeric));
    return Number(bounded.toFixed(2));
}

function sanitizeVerificationStatus(value: unknown): string | null {
    const status = sanitizeText(value, { maxLength: 24 }).toLowerCase();
    return ALLOWED_VERIFICATION_STATUSES.has(status) ? status : null;
}

function sanitizeRateCard(value: unknown): Array<{ id: string; service: string; margin: number }> {
    if (!Array.isArray(value)) return [];
    const output: Array<{ id: string; service: string; margin: number }> = [];
    for (const entry of value.slice(0, 100)) {
        if (!entry || typeof entry !== "object") continue;
        const record = entry as Record<string, unknown>;
        const service = sanitizeText(record.service, { maxLength: 120 });
        const margin = sanitizeMarginRate(record.margin);
        if (!service || margin === null) continue;
        output.push({
            id: sanitizeText(record.id, { maxLength: 64 }) || `rate-${output.length + 1}`,
            service,
            margin,
        });
    }
    return output;
}

function sanitizeComplianceDocuments(value: unknown): Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    expiry_date?: string;
}> {
    if (!Array.isArray(value)) return [];
    const output: Array<{ id: string; name: string; url: string; type: string; expiry_date?: string }> = [];

    for (const entry of value.slice(0, 100)) {
        if (!entry || typeof entry !== "object") continue;
        const record = entry as Record<string, unknown>;
        const name = sanitizeText(record.name, { maxLength: 120 });
        const url = sanitizeHttpUrl(record.url);
        if (!name || !url) continue;

        const expiryRaw = sanitizeText(record.expiry_date, { maxLength: 16 });
        const expiryDate = /^\d{4}-\d{2}-\d{2}$/.test(expiryRaw) ? expiryRaw : undefined;

        output.push({
            id: sanitizeText(record.id, { maxLength: 64 }) || `doc-${output.length + 1}`,
            name,
            url,
            type: sanitizeText(record.type, { maxLength: 64 }) || "Other",
            expiry_date: expiryDate,
        });
    }

    return output;
}

async function getAuthContext(req: Request) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("role, organization_id")
                .eq("id", authData.user.id)
                .single();
            return { user: authData.user, profile };
        }
    }

    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (user) {
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();
        return { user, profile };
    }
    return { user: null, profile: null };
}

export async function GET(req: Request) {
    try {
        const { user, profile } = await getAuthContext(req);
        if (!user || !profile) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!profile.organization_id) {
            return NextResponse.json({ error: "Organization not configured" }, { status: 400 });
        }

        const url = new URL(req.url);
        const region = sanitizeText(url.searchParams.get("region"), { maxLength: 80 });
        const specialty = sanitizeText(url.searchParams.get("specialty"), { maxLength: 80 });
        const query = sanitizeQueryText(url.searchParams.get("q"), 120);
        const verification = sanitizeVerificationStatus(url.searchParams.get("verification"));

        let supabaseQuery = supabaseAdmin
            .from("marketplace_profiles")
            .select(`
                *,
                organization:organizations!inner(name, logo_url),
                reviews:marketplace_reviews(rating)
            `);

        if (verification) {
            supabaseQuery = supabaseQuery.eq("verification_status", verification);
        }

        if (region) {
            supabaseQuery = supabaseQuery.contains("service_regions", [region]);
        }
        if (specialty) {
            supabaseQuery = supabaseQuery.contains("specialties", [specialty]);
        }
        if (query) {
            const wildcard = `%${query.replace(/\s+/g, "%")}%`;
            type QueryWithOr = typeof supabaseQuery & {
                or: (filters: string) => typeof supabaseQuery;
            };
            supabaseQuery = (supabaseQuery as QueryWithOr).or(
                `organization.name.ilike.${wildcard},description.ilike.${wildcard}`
            );
        }

        const { data, error } = await supabaseQuery
            .order("is_verified", { ascending: false })
            .order("updated_at", { ascending: false });

        if (error) throw error;

        // Process data to include average rating and flatten organization info
        const rows = (data || []) as unknown as MarketplaceProfileRow[];
        const results = rows.map((item) => {
            const ratings = (item.reviews || []).map((review) => Number(review.rating || 0));
            const avgRating = ratings.length > 0
                ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
                : 0;

            const normalizedServiceRegions = sanitizeStringList(item.service_regions, 80, 80);
            const normalizedSpecialties = sanitizeStringList(item.specialties, 80, 80);
            const normalizedGalleryUrls = sanitizeStringList(item.gallery_urls, 40, 2048)
                .map((value) => sanitizeHttpUrl(value))
                .filter((value): value is string => Boolean(value));

            return {
                ...item,
                description: sanitizeText(item.description, { maxLength: 4000, preserveNewlines: true }),
                service_regions: normalizedServiceRegions,
                specialties: normalizedSpecialties,
                gallery_urls: normalizedGalleryUrls,
                rate_card: sanitizeRateCard(item.rate_card),
                compliance_documents: sanitizeComplianceDocuments(item.compliance_documents),
                organization_name: sanitizeText(item.organization?.name, { maxLength: 160 }),
                organization_logo: sanitizeHttpUrl(item.organization?.logo_url),
                average_rating: avgRating,
                review_count: ratings.length,
                verification_status: sanitizeVerificationStatus(item.verification_status) || "none"
            };
        });

        return NextResponse.json(results);
    } catch (error: unknown) {
        console.error("Marketplace GET error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { user, profile } = await getAuthContext(req);
        if (!user || !profile) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!profile.organization_id) {
            return NextResponse.json({ error: "Organization not found" }, { status: 400 });
        }

        const body = await req.json().catch(() => null);
        const parsed = MarketplacePatchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const updates: MarketplaceProfileUpsert = {
            organization_id: profile.organization_id,
            description: sanitizeText(parsed.data.description, {
                maxLength: 4000,
                preserveNewlines: true,
            }) || null,
            service_regions: sanitizeStringList(parsed.data.service_regions, 80, 80),
            specialties: sanitizeStringList(parsed.data.specialties, 80, 80),
            margin_rate: sanitizeMarginRate(parsed.data.margin_rate),
            rate_card: sanitizeRateCard(parsed.data.rate_card),
            gallery_urls: sanitizeStringList(parsed.data.gallery_urls, 40, 2048)
                .map((value) => sanitizeHttpUrl(value))
                .filter((value): value is string => Boolean(value)),
            compliance_documents: sanitizeComplianceDocuments(parsed.data.compliance_documents),
            updated_at: new Date().toISOString()
        };

        if (parsed.data.request_verification) {
            updates.verification_status = "pending";
            updates.is_verified = false;
        }

        const { data, error } = await supabaseAdmin
            .from("marketplace_profiles")
            .upsert(updates, { onConflict: "organization_id" })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("Marketplace PATCH error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
