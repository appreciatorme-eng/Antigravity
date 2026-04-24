import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Plane } from "lucide-react";
import type { ItineraryResult } from "@/types/itinerary";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadTripRequestBusinessBranding } from "@/lib/whatsapp/trip-intake.server";
import {
    SHARED_ITINERARY_PUBLIC_SELECT,
    shareSelectContainsPii,
} from "@/lib/share/public-trip";
import ShareTemplateRenderer from "./ShareTemplateRenderer";
import type { OrganizationBranding } from "@/components/itinerary-templates/ItineraryBrandedFooter";
import { normalizeSharePaymentConfig } from "@/lib/share/payment-config";
import {
    readSharePaymentConfigFromRawData,
    withOptionalSharedItineraryPaymentConfig,
} from "@/lib/share/payment-config-compat";
import type { Json } from "@/lib/supabase/database.types";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ token: string }>;
}): Promise<Metadata> {
    const { token } = await params;
    const supabase = createAdminClient();

    const { data: share } = await supabase
        .from("shared_itineraries")
        .select("itineraries(trip_title, destination, duration_days, summary, profiles(organizations(name)))")
        .eq("share_code", token)
        .single();

    const itin = (share as unknown as {
        itineraries?: {
            trip_title?: string;
            destination?: string;
            duration_days?: number;
            summary?: string;
            profiles?: { organizations?: { name?: string } | { name?: string }[] };
        };
    })?.itineraries;

    if (!itin) {
        return { title: "Shared Itinerary — TripBuilt" };
    }

    const org = itin.profiles?.organizations;
    const operatorName = (Array.isArray(org) ? org[0]?.name : org?.name) || "TripBuilt";
    const title = `${itin.destination || "Trip"} ${itin.duration_days ? `${itin.duration_days}-Day` : ""} Itinerary — ${operatorName}`;
    const description = itin.summary
        ? itin.summary.slice(0, 160)
        : `${itin.trip_title || "Travel itinerary"} for ${itin.destination || "your next adventure"}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            siteName: operatorName,
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
    };
}

export default async function SharedTripPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const supabaseAdmin = createAdminClient();
    const { token } = await params;

    if (shareSelectContainsPii(SHARED_ITINERARY_PUBLIC_SELECT)) {
        throw new Error("Unsafe public share select contains sensitive fields");
    }

    // Fetch only the safe public share payload needed to render the itinerary.
    // Do not resolve traveler contact information from a bearer share token.
    const { data: share, error: shareError, paymentConfigSupported } =
        await withOptionalSharedItineraryPaymentConfig(
            async () =>
                supabaseAdmin
                    .from("shared_itineraries")
                    .select(SHARED_ITINERARY_PUBLIC_SELECT)
                    .eq("share_code", token)
                    .single(),
            async () =>
                supabaseAdmin
                    .from("shared_itineraries")
                    .select(`
                        id,
                        created_at,
                        expires_at,
                        template_id,
                        status,
                        viewed_at,
                        itineraries (
                          id,
                          created_at,
                          raw_data,
                          trip_title,
                          destination,
                          duration_days,
                          budget,
                          interests,
                          summary,
                          user_id,
                          client_id,
                          profiles!itineraries_user_id_fkey (
                            organizations!profiles_organization_id_fkey ( name, logo_url, primary_color, billing_city, billing_state )
                          )
                        )
                    `)
                    .eq("share_code", token)
                    .single(),
        );

    const shareRow = share as {
        id: string;
        created_at?: string | null;
        expires_at?: string | null;
        viewed_at?: string | null;
        status?: string | null;
    } | null;

    if (shareError || !shareRow) {
        notFound();
    }

    // Check if expired
    if (shareRow.expires_at && new Date(shareRow.expires_at) < new Date()) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Link Expired
                    </h1>
                    <p className="text-gray-600 mb-6">
                        This share link is no longer valid.
                    </p>
                    <Link
                        href="/planner"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
                    >
                        <Plane className="w-5 h-5" />
                        Create Your Own Trip
                    </Link>
                </div>
            </main>
        );
    }

    // Track the view — set both viewed_at and status so the planner pipeline reflects "Viewed"
    const isFirstView = !shareRow.viewed_at;
    const viewUpdate: Record<string, string> = { viewed_at: new Date().toISOString() };
    // Only promote status to "viewed" if it hasn't progressed further (commented/approved)
    if (isFirstView && (!shareRow.status || shareRow.status === "active")) {
        viewUpdate.status = "viewed";
    }
    await supabaseAdmin
        .from("shared_itineraries")
        .update(viewUpdate)
        .eq("id", shareRow.id);

    const shareRecord = share as unknown as {
        itineraries: {
            id?: string;
            created_at?: string | null;
            raw_data: unknown;
            trip_title?: string;
            destination?: string;
            duration_days?: number;
            budget?: string;
            interests?: string[];
            summary?: string;
            user_id?: string;
            client_id?: string;
            profiles?: {
                organizations?: { name?: string; logo_url?: string; primary_color?: string; billing_city?: string; billing_state?: string } | { name?: string; logo_url?: string; primary_color?: string; billing_city?: string; billing_state?: string }[];
            };
        } | null;
        template_id?: string;
        payment_config?: Json | null;
    };
    const itinerary = shareRecord.itineraries;
    if (!itinerary) {
        notFound();
    }

    const tripData = itinerary.raw_data as unknown as ItineraryResult;
    // Merge DB columns into the tripData object (some fields may live on the itinerary row directly)
    const fullTripData: ItineraryResult = {
        ...tripData,
        trip_title: tripData?.trip_title || itinerary.trip_title || "Your Itinerary",
        destination: tripData?.destination || itinerary.destination || "",
        duration_days: tripData?.duration_days || itinerary.duration_days || 0,
        budget: tripData?.budget || itinerary.budget || undefined,
        interests: tripData?.interests || itinerary.interests || [],
        summary: tripData?.summary || itinerary.summary || "",
    };

    // Render from the saved itinerary payload only.
    // Resolve organization branding
    const org = itinerary.profiles?.organizations;
    const resolvedOrg = Array.isArray(org) ? org[0] : org;
    const organizationName: string = resolvedOrg?.name || "Travel Adventures";

    const { data: linkedTrip } = itinerary.id
        ? await supabaseAdmin
            .from("trips")
            .select("organization_id, client_id")
            .eq("itinerary_id", itinerary.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : { data: null };
    const businessBranding = linkedTrip?.organization_id
        ? await loadTripRequestBusinessBranding({
            organizationId: linkedTrip.organization_id,
            operatorUserId: itinerary.user_id ?? null,
        })
        : null;

    // Fetch client name if a client is assigned to this itinerary.
    let clientName: string | null = null;
    const resolvedClientId = itinerary.client_id ?? linkedTrip?.client_id ?? null;
    if (resolvedClientId) {
        const { data: clientProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", resolvedClientId)
            .maybeSingle();
        clientName = clientProfile?.full_name ?? null;
    }

    const organizationBranding: OrganizationBranding = {
        name: businessBranding?.organizationName ?? organizationName,
        logoUrl: businessBranding?.organizationLogoUrl ?? resolvedOrg?.logo_url ?? null,
        primaryColor: businessBranding?.organizationPrimaryColor ?? resolvedOrg?.primary_color ?? null,
        email: businessBranding?.organizationContactEmail ?? null,
        phone: businessBranding?.organizationContactPhone ?? null,
        city: resolvedOrg?.billing_city ?? null,
        state: resolvedOrg?.billing_state ?? null,
    };

    // Resolve the template (default to safari_story — the first premium template)
    const templateId: string = shareRecord.template_id || "safari_story";
    const paymentConfig = normalizeSharePaymentConfig(
        paymentConfigSupported
            ? shareRecord.payment_config ?? null
            : readSharePaymentConfigFromRawData(itinerary.raw_data),
    );

    // Delegate rendering to a client component — all template components use "use client"
    // and cannot be dynamically resolved inside a server component.
    return (
        <ShareTemplateRenderer
            token={token}
            templateId={templateId}
            itinerary={fullTripData}
            organizationName={organizationName}
            organizationBranding={organizationBranding}
            client={clientName ? { name: clientName } : null}
            paymentConfig={paymentConfig}
            referenceIssuedAt={shareRow.created_at ?? itinerary.created_at ?? null}
        />
    );
}
