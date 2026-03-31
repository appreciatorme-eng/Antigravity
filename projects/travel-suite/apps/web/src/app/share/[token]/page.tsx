import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Plane } from "lucide-react";
import type { ItineraryResult } from "@/types/itinerary";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    SHARED_ITINERARY_PUBLIC_SELECT,
    shareSelectContainsPii,
} from "@/lib/share/public-trip";
import ShareTemplateRenderer from "./ShareTemplateRenderer";
import type { OrganizationBranding } from "@/components/itinerary-templates/ItineraryBrandedFooter";

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
    const { data: share, error: shareError } = await supabaseAdmin
        .from("shared_itineraries")
        .select(SHARED_ITINERARY_PUBLIC_SELECT)
        .eq("share_code", token)
        .single();

    if (shareError || !share) {
        notFound();
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
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

    // Track the view
    await supabaseAdmin
        .from("shared_itineraries")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", share.id);

    const shareRecord = share as unknown as {
        itineraries: {
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
                organizations?: { name?: string; logo_url?: string; primary_color?: string } | { name?: string; logo_url?: string; primary_color?: string }[];
            };
        } | null;
        template_id?: string;
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

    // Resolve organization branding
    const org = itinerary.profiles?.organizations;
    const resolvedOrg = Array.isArray(org) ? org[0] : org;
    const organizationName: string = resolvedOrg?.name || "Travel Adventures";

    // Fetch operator contact info separately (not through PII-guarded select)
    // The itinerary's user_id is the operator — their email/phone is business contact info
    let operatorEmail: string | null = null;
    let operatorPhone: string | null = null;
    if (itinerary.user_id) {
        const { data: operatorProfile } = await supabaseAdmin
            .from("profiles")
            .select("email, phone")
            .eq("id", itinerary.user_id)
            .maybeSingle();
        operatorEmail = operatorProfile?.email ?? null;
        operatorPhone = operatorProfile?.phone ?? null;
    }

    // Fetch client name if a client is assigned to this itinerary
    let clientName: string | null = null;
    if (itinerary.client_id) {
        const { data: clientProfile } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", itinerary.client_id)
            .maybeSingle();
        clientName = clientProfile?.full_name ?? null;
    }

    const organizationBranding: OrganizationBranding = {
        name: organizationName,
        logoUrl: resolvedOrg?.logo_url ?? null,
        primaryColor: resolvedOrg?.primary_color ?? null,
        email: operatorEmail,
        phone: operatorPhone,
    };

    // Resolve the template (default to safari_story — the first premium template)
    const templateId: string = shareRecord.template_id || "safari_story";

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
        />
    );
}
